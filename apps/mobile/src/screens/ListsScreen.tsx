import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useLists,
  useList,
  useCreateList,
  useUpdateList,
  useDeleteList,
  useToggleItem,
} from '@mixtape/api/hooks/lists/useLists';
import { useCreateVoiceSeed, useDeleteSeed } from '@mixtape/api/hooks/useSeed';
import { fetchRecentSeeds } from '@mixtape/api/clients/writing/seedApi';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { CaptureDock } from '../components/shared/CaptureDock';
import type { RecordedClip } from '../hooks/useNativeVoiceRecorder';
import { pollWithBackoff } from '../services/polling/pollWithBackoff';

// ADR-0048 D12, D13 — Lists is "don't forget" actionables, parse-on-send.
const LAST_LIST_KEY = 'mixtape.mobile.lastListId';

// Lightweight client-side split — "comma-split, sentence-split, or a
// lightweight local model" per the ADR; no backend support needed since the
// List micro-grammar parser only understands already-prefixed lines.
function splitIntoItems(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function appendItemsToBody(bodyText: string, items: string[]): string {
  const lines = items.map((item) => `- ${item}`);
  const trimmed = bodyText.trimEnd();
  return trimmed ? `${trimmed}\n${lines.join('\n')}` : lines.join('\n');
}

export default function ListsScreen() {
  const { lists, isLoading: listsLoading, refetch: refetchLists } = useLists();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [restoredLastList, setRestoredLastList] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [tidyOpen, setTidyOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  const { list, isLoading: listLoading, refetch: refetchList } = useList({
    listId: activeListId ?? '',
    enabled: !!activeListId,
  });

  const createList = useCreateList();
  const updateList = useUpdateList();
  const deleteList = useDeleteList();
  const toggleItem = useToggleItem();
  const createVoiceSeed = useCreateVoiceSeed();
  const deleteSeed = useDeleteSeed();

  // Restore last-active list (D2-style memory, same pattern as last-tab).
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(LAST_LIST_KEY).then((stored) => {
      if (!active) return;
      if (stored) setActiveListId(stored);
      setRestoredLastList(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // No stored list (or it no longer exists) — fall back to most recent.
  useEffect(() => {
    if (!restoredLastList || listsLoading) return;
    if (activeListId && lists.some((l) => l.id === activeListId)) return;
    if (lists.length > 0) {
      setActiveListId(lists[0].id);
    }
  }, [restoredLastList, listsLoading, activeListId, lists]);

  const selectList = (id: string) => {
    setActiveListId(id);
    void AsyncStorage.setItem(LAST_LIST_KEY, id);
    setChooserOpen(false);
  };

  const addItemsToActiveList = async (items: string[]) => {
    if (items.length === 0) return;

    if (!list) {
      const created = await createList.mutateAsync({
        title: items[0].slice(0, 60),
        body_text: items.map((item) => `- ${item}`).join('\n'),
      });
      selectList(created.id);
      return;
    }

    await updateList.mutateAsync({
      listId: list.id,
      payload: { body_text: appendItemsToBody(list.body_text, items) },
    });
    refetchList();
  };

  const handleSubmitText = async (text: string) => {
    await addItemsToActiveList(splitIntoItems(text));
  };

  // Lists has no transcription pipeline of its own — reuse the existing
  // voice-Seed pipeline purely as a transcription utility, then discard the
  // Seed once its text has been folded into the list (it's not meant to
  // also live on as a separate Notebook entry).
  const handleSubmitVoice = async (clip: RecordedClip) => {
    const seed = await createVoiceSeed.mutateAsync({
      uri: clip.uri,
      mimeType: clip.mimeType,
      fileName: clip.fileName,
      source: 'mobile',
    });

    const transcript = await pollWithBackoff(async () => {
      const seeds = await fetchRecentSeeds(20);
      const match = seeds.find((s) => s.id === seed.id);
      if (match && match.status !== 'processing') {
        return { done: true, value: match.status === 'ready' ? match.body_text : undefined };
      }
      return { done: false };
    });

    void deleteSeed.mutateAsync(seed.id).catch(() => {});

    if (transcript) {
      await addItemsToActiveList(splitIntoItems(transcript));
    }
  };

  const handleNewList = async () => {
    const created = await createList.mutateAsync({ title: 'New list' });
    selectList(created.id);
  };

  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameText(currentTitle);
  };

  const confirmRename = async () => {
    if (!renamingId) return;
    const title = renameText.trim();
    if (title) {
      await updateList.mutateAsync({ listId: renamingId, payload: { title } });
      refetchList();
      refetchLists();
    }
    setRenamingId(null);
  };

  const handleDeleteList = async (id: string) => {
    await deleteList.mutateAsync(id);
    if (id === activeListId) {
      setActiveListId(null);
    }
    refetchLists();
  };

  // ADR-0048 Section 6 — Tidy: recency sort, no LLM required for Phase 1.
  const oldestLists = [...lists].sort(
    (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
  ).slice(0, 3);

  return (
    <View style={styles.container}>
      <CrossroadsHeader routeLabel="lists" />

      <View style={styles.listHeaderRow}>
        <TouchableOpacity
          style={styles.listChooserButton}
          onPress={() => setChooserOpen(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.listChooserTitle} numberOfLines={1}>
            {list?.title || (listsLoading ? 'Loading…' : 'No lists yet')}
          </Text>
          <Ionicons name="chevron-down" size={16} color="#4A6B85" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tidyButton}
          onPress={() => setTidyOpen(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="sparkles-outline" size={20} color="#4A6B85" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.itemsScroll} contentContainerStyle={styles.itemsContent}>
        {listLoading && activeListId ? (
          <ActivityIndicator color="#0E5AA7" style={styles.loadingSpinner} />
        ) : null}

        {list?.items.map((item) => (
          <TouchableOpacity
            key={item.index}
            style={styles.itemRow}
            onPress={() =>
              item.is_action &&
              toggleItem.mutate({ listId: list.id, itemIndex: item.index })
            }
            activeOpacity={item.is_action ? 0.6 : 1}
          >
            {item.is_action ? (
              <Ionicons
                name={item.is_completed ? 'checkbox' : 'square-outline'}
                size={20}
                color={item.is_completed ? '#0E5AA7' : '#738292'}
              />
            ) : (
              <View style={styles.noteDot} />
            )}
            <Text style={[styles.itemText, item.is_completed && styles.itemTextDone]}>
              {item.text}
            </Text>
          </TouchableOpacity>
        ))}

        {list && list.items.length === 0 ? (
          <Text style={styles.emptyText}>Nothing here yet — speak or type below.</Text>
        ) : null}

        {!list && !listsLoading ? (
          <Text style={styles.emptyText}>No lists yet — speak or type below to start one.</Text>
        ) : null}
      </ScrollView>

      <CaptureDock
        draftStorageKey="mixtape.mobile.listDraft"
        placeholder="Speak or type items, separated by commas…"
        kickerLabel="ADD TO LIST"
        kickerSub={list?.title}
        submitLabel="Parse + add"
        onSubmitText={handleSubmitText}
        onSubmitVoice={handleSubmitVoice}
      />

      {/* List chooser — horizontal scroll of recent lists + New (ADR Section 5.4) */}
      <Modal visible={chooserOpen} animationType="slide" transparent onRequestClose={() => setChooserOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setChooserOpen(false)}>
          <View style={styles.chooserSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.chooserHeading}>Your lists</Text>
            <ScrollView style={styles.chooserScroll}>
              {lists.map((l) => (
                <TouchableOpacity
                  key={l.id}
                  style={styles.chooserRow}
                  onPress={() => selectList(l.id)}
                >
                  <Text style={[styles.chooserRowText, l.id === activeListId && styles.chooserRowTextActive]}>
                    {l.title || 'Untitled list'}
                  </Text>
                  <Text style={styles.chooserRowCount}>{l.stats.open} open</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.newListButton} onPress={handleNewList}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.newListButtonText}>New list</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Tidy — conversational, interruptible, never forced (ADR Section 6) */}
      <Modal visible={tidyOpen} animationType="fade" transparent onRequestClose={() => setTidyOpen(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setTidyOpen(false)}>
          <View style={styles.tidySheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.tidyHeading}>Tidy</Text>
            {oldestLists.length === 0 ? (
              <Text style={styles.tidyBody}>No lists to tidy yet.</Text>
            ) : (
              <>
                <Text style={styles.tidyBody}>
                  You have {lists.length} {lists.length === 1 ? 'list' : 'lists'}. The most
                  distant {oldestLists.length === 1 ? 'one is' : 'are'}:{' '}
                  {oldestLists.map((l) => `"${l.title || 'Untitled list'}"`).join(', ')}.
                  Want to review?
                </Text>
                {oldestLists.map((l) => (
                  <View key={l.id} style={styles.tidyRow}>
                    {renamingId === l.id ? (
                      <TextInput
                        style={styles.tidyRenameInput}
                        value={renameText}
                        onChangeText={setRenameText}
                        onSubmitEditing={confirmRename}
                        onBlur={confirmRename}
                        autoFocus
                      />
                    ) : (
                      <Text style={styles.tidyRowText} numberOfLines={1}>
                        {l.title || 'Untitled list'}
                      </Text>
                    )}
                    <View style={styles.tidyActions}>
                      <TouchableOpacity onPress={() => startRename(l.id, l.title)}>
                        <Ionicons name="pencil-outline" size={18} color="#4A6B85" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert('Delete list?', `"${l.title || 'Untitled list'}" will be removed.`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteList(l.id) },
                          ])
                        }
                      >
                        <Ionicons name="trash-outline" size={18} color="#C0392B" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
            <TouchableOpacity style={styles.tidySkipButton} onPress={() => setTidyOpen(false)}>
              <Text style={styles.tidySkipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4F8',
  },
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  listChooserButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E0E8F0',
  },
  listChooserTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1B2B3A',
    flex: 1,
    marginRight: 8,
  },
  tidyButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemsScroll: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  loadingSpinner: {
    marginTop: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E8F0',
  },
  noteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9DB9D4',
    marginHorizontal: 7,
  },
  itemText: {
    fontSize: 15,
    color: '#1B2B3A',
    flex: 1,
  },
  itemTextDone: {
    color: '#9AA9B6',
    textDecorationLine: 'line-through',
  },
  emptyText: {
    color: '#738292',
    fontSize: 14,
    marginTop: 24,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  chooserSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 18,
    maxHeight: '70%',
  },
  chooserHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2B3A',
    marginBottom: 10,
  },
  chooserScroll: {
    maxHeight: 360,
  },
  chooserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F8',
  },
  chooserRowText: {
    fontSize: 15,
    color: '#1B2B3A',
    flex: 1,
  },
  chooserRowTextActive: {
    color: '#0E5AA7',
    fontWeight: '700',
  },
  chooserRowCount: {
    fontSize: 12,
    color: '#738292',
  },
  newListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0E5AA7',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  newListButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  tidySheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 18,
  },
  tidyHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B2B3A',
    marginBottom: 8,
  },
  tidyBody: {
    fontSize: 14,
    color: '#3F5A70',
    lineHeight: 20,
    marginBottom: 14,
  },
  tidyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF4F8',
  },
  tidyRowText: {
    fontSize: 14,
    color: '#1B2B3A',
    flex: 1,
    marginRight: 10,
  },
  tidyRenameInput: {
    flex: 1,
    fontSize: 14,
    color: '#1B2B3A',
    borderBottomWidth: 1,
    borderBottomColor: '#0E5AA7',
    marginRight: 10,
    paddingVertical: 2,
  },
  tidyActions: {
    flexDirection: 'row',
    gap: 14,
  },
  tidySkipButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  tidySkipButtonText: {
    color: '#738292',
    fontSize: 14,
    fontWeight: '600',
  },
});

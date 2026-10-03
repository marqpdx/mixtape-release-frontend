// apps/mobile/src/screens/FolioNotesScreen.tsx
//
// Folio Notes PoC — mobile capture surface
// (puddlejump/decisions/folio/folio-notes-poc-mobile-handoff.md, build order step 2).
// Folio selector on top, recent notes, CaptureDock at the bottom. Capture
// acknowledges "Saved" as soon as the server has persisted the note;
// transcription happens in the background and is picked up via Notebook's
// list-refetch + socket-push pattern.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useCreateFolio,
  useCreateFolioTextNote,
  useCreateFolioVoiceNote,
  useFolioNotes,
  useFolios,
} from '@mixtape/api/hooks/folio/useFolio';
import type { FolioNote, FolioNoteShape } from '@mixtape/api/clients/folio/folioApi';
import { CrossroadsHeader } from '../components/CrossroadsHeader';
import { CaptureDock } from '../components/shared/CaptureDock';
import type { RecordedClip } from '../hooks/useNativeVoiceRecorder';
import { useAuthStore } from '../stores/authStore';
import { pollWithBackoff } from '../services/polling/pollWithBackoff';
import { socketService } from '../services/socket/socketService';

const LAST_FOLIO_KEY = 'mixtape.mobile.lastFolioId';
const CAPTURE_DRAFT_KEY_PREFIX = 'mixtape.mobile.folioNoteDraft';

const SHAPE_LABELS: Record<FolioNoteShape, string> = {
  character: 'Character',
  scene: 'Scene',
  plot: 'Plot',
  place: 'Place',
  world: 'World',
  meta: 'Meta',
  unplaced: 'Unplaced',
};

function formatNoteTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function NoteBody({ note }: { note: FolioNote }) {
  if (note.status === 'processing') {
    return <Text style={[styles.noteBody, styles.noteBodyMuted]}>Transcribing…</Text>;
  }
  if (note.status === 'failed') {
    // Audio is retained server-side — a failed transcription is a
    // recoverable note, not a lost capture (build plan §41).
    return <Text style={[styles.noteBody, styles.noteBodyMuted]}>Saved — transcript not ready yet</Text>;
  }
  return <Text style={styles.noteBody}>{note.text || 'Empty note'}</Text>;
}

export default function FolioNotesScreen() {
  const currentUser = useAuthStore((state) => state.user);
  const foliosQuery = useFolios();
  const createFolio = useCreateFolio();
  const [selectedFolioId, setSelectedFolioId] = useState<string | null>(null);
  const [isCreatingFolio, setIsCreatingFolio] = useState(false);
  const [newFolioTitle, setNewFolioTitle] = useState('');
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [isUserRefreshing, setIsUserRefreshing] = useState(false);
  const noteListRef = useRef<FlatList<FolioNote> | null>(null);

  const notesQuery = useFolioNotes(selectedFolioId);
  const createTextNote = useCreateFolioTextNote(selectedFolioId);
  const createVoiceNote = useCreateFolioVoiceNote(selectedFolioId);
  const notes = useMemo(() => notesQuery.data ?? [], [notesQuery.data]);
  const folios = useMemo(() => foliosQuery.data ?? [], [foliosQuery.data]);

  // Restore the last-used Folio, falling back to the most recently updated one.
  useEffect(() => {
    if (selectedFolioId || folios.length === 0) return;
    void AsyncStorage.getItem(LAST_FOLIO_KEY).then((stored) => {
      const match = folios.find((folio) => folio.id === stored);
      setSelectedFolioId(match ? match.id : folios[0].id);
    });
  }, [folios, selectedFolioId]);

  const selectFolio = (folioId: string) => {
    setSelectedFolioId(folioId);
    setSavedNoteId(null);
    void AsyncStorage.setItem(LAST_FOLIO_KEY, folioId);
  };

  const handleCreateFolio = async () => {
    const title = newFolioTitle.trim();
    if (!title) return;
    const folio = await createFolio.mutateAsync(title);
    setNewFolioTitle('');
    setIsCreatingFolio(false);
    selectFolio(folio.id);
  };

  const hasProcessingNote = useMemo(
    () => notes.some((note) => note.status === 'processing'),
    [notes]
  );

  useEffect(() => {
    if (!hasProcessingNote) return;

    let cancelled = false;
    void pollWithBackoff(
      async () => {
        const result = await notesQuery.refetch();
        const stillProcessing = (result.data ?? []).some((note) => note.status === 'processing');
        return { done: !stillProcessing };
      },
      { isCancelled: () => cancelled, timeoutMs: Number.POSITIVE_INFINITY }
    );

    return () => {
      cancelled = true;
    };
  }, [hasProcessingNote, notesQuery]);

  // Push path: Livewire emits folio_note:transcribed when Celery finishes
  // transcription and folio_note:tended when Switchboard → Inkwell tending
  // lands. Polling above remains the transcription fallback when the socket
  // is unavailable — same arrangement as SeedNotebook.
  useEffect(() => {
    const socket = socketService.getRawSocket();
    if (!socket) return;
    const handler = (payload?: { folio_id?: string }) => {
      if (!payload?.folio_id || payload.folio_id === selectedFolioId) {
        void notesQuery.refetch();
      }
    };
    socket.on('folio_note:transcribed', handler);
    socket.on('folio_note:tended', handler);
    return () => {
      socket.off('folio_note:transcribed', handler);
      socket.off('folio_note:tended', handler);
    };
  }, [notesQuery, selectedFolioId]);

  const acknowledge = (note: FolioNote) => {
    setSavedNoteId(note.id);
    requestAnimationFrame(() => {
      noteListRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  };

  const handleSubmitText = async (text: string) => {
    const note = await createTextNote.mutateAsync({ raw_text: text, source: 'mobile' });
    acknowledge(note);
  };

  const handleSubmitVoice = async (clip: RecordedClip) => {
    const note = await createVoiceNote.mutateAsync({
      uri: clip.uri,
      mimeType: clip.mimeType,
      fileName: clip.fileName,
      source: 'mobile',
    });
    acknowledge(note);
  };

  const draftStorageKey = `${CAPTURE_DRAFT_KEY_PREFIX}.${currentUser?.username ?? 'anon'}.${selectedFolioId ?? 'none'}`;

  return (
    <View style={styles.container}>
      <CrossroadsHeader routeLabel="folio notes" />

      <View style={styles.selectorSection}>
        <Text style={styles.selectorLabel}>Folio</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {folios.map((folio) => {
            const active = folio.id === selectedFolioId;
            return (
              <TouchableOpacity
                key={folio.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => selectFolio(folio.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {folio.title || 'Untitled Folio'}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.chip}
            onPress={() => setIsCreatingFolio((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={styles.chipText}>+ New</Text>
          </TouchableOpacity>
        </ScrollView>

        {isCreatingFolio || (!foliosQuery.isLoading && folios.length === 0) ? (
          <View style={styles.newFolioRow}>
            <TextInput
              style={styles.newFolioInput}
              placeholder="Folio title"
              placeholderTextColor="#738292"
              value={newFolioTitle}
              onChangeText={setNewFolioTitle}
              onSubmitEditing={() => { void handleCreateFolio(); }}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.newFolioButton, (!newFolioTitle.trim() || createFolio.isPending) && styles.buttonDisabled]}
              onPress={() => { void handleCreateFolio(); }}
              disabled={!newFolioTitle.trim() || createFolio.isPending}
              activeOpacity={0.85}
            >
              {createFolio.isPending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.newFolioButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          ref={noteListRef}
          data={notes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.noteList}
          ItemSeparatorComponent={() => <View style={styles.noteDivider} />}
          keyboardShouldPersistTaps="handled"
          inverted
          refreshControl={
            <RefreshControl
              refreshing={isUserRefreshing}
              onRefresh={() => {
                setIsUserRefreshing(true);
                void notesQuery.refetch().finally(() => setIsUserRefreshing(false));
              }}
              tintColor="#0E5AA7"
            />
          }
          ListEmptyComponent={
            notesQuery.isLoading || foliosQuery.isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color="#0E5AA7" />
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No notes yet</Text>
                <Text style={styles.emptySubtitle}>
                  {selectedFolioId
                    ? 'Speak a thought — it will be kept exactly as you said it.'
                    : 'Create a Folio to start capturing notes.'}
                </Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View style={styles.noteRow}>
              <View style={styles.noteHeader}>
                <Text style={[styles.noteShape, item.shape === 'unplaced' && styles.noteShapeUnplaced]}>
                  {SHAPE_LABELS[item.shape] ?? item.shape}
                </Text>
                <Text style={styles.noteMeta}>
                  {item.source_type === 'voice' ? '🎙 ' : ''}{formatNoteTime(item.created_at)}
                </Text>
              </View>
              <NoteBody note={item} />
            </View>
          )}
        />

        {selectedFolioId ? (
          <View style={styles.captureDock}>
            <CaptureDock
              key={selectedFolioId}
              draftStorageKey={draftStorageKey}
              kickerLabel="Folio Notes"
              kickerSub="Say it before you lose it."
              placeholder="Type a note..."
              onSubmitText={handleSubmitText}
              onSubmitVoice={handleSubmitVoice}
              isSubmittingText={createTextNote.isPending}
              isSubmittingVoice={createVoiceNote.isPending}
              onChangeTextOverride={(value, setText) => {
                setText(value);
                if (savedNoteId) setSavedNoteId(null);
              }}
              footerCenter={savedNoteId ? <Text style={styles.savedTitle}>Saved</Text> : null}
            />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF4F8',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
  },
  selectorSection: {
    gap: 8,
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#315E87',
  },
  chipRow: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    maxWidth: 200,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C9D4DE',
  },
  chipActive: {
    backgroundColor: '#0E5AA7',
    borderColor: '#0E5AA7',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#315E87',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  newFolioRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  newFolioInput: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C9D4DE',
    color: '#13293D',
    fontSize: 15,
  },
  newFolioButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#0E5AA7',
    minWidth: 76,
    alignItems: 'center',
  },
  newFolioButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  body: {
    flex: 1,
  },
  noteList: {
    paddingBottom: 20,
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    overflow: 'hidden',
  },
  noteDivider: {
    height: 1,
    backgroundColor: '#E6EDF3',
    marginHorizontal: 16,
  },
  centerState: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#13293D',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#627181',
    textAlign: 'center',
  },
  noteRow: {
    padding: 16,
    gap: 8,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteShape: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#315E87',
  },
  // Unplaced is healthy (build plan §4.5, §33) — quieter, never alarm-colored.
  noteShapeUnplaced: {
    color: '#7D8C99',
  },
  noteMeta: {
    fontSize: 12,
    color: '#6A7785',
  },
  noteBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#13293D',
  },
  noteBodyMuted: {
    color: '#6A7785',
    fontStyle: 'italic',
  },
  captureDock: {
    paddingTop: 10,
  },
  savedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B6E44',
  },
});

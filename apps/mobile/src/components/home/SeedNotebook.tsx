import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  useCreateSeed,
  useCreateVoiceSeed,
  useDeleteSeed,
  useRecentSeeds,
  useUpdateSeed,
} from '@mixtape/api/hooks/useSeed';
import type { Seed } from '@mixtape/api/clients/writing/seedApi';
import { useAuthStore } from '../../stores/authStore';
import { CaptureDock } from '../shared/CaptureDock';
import type { CaptureDockHandle } from '../shared/CaptureDock';
import type { RecordedClip } from '../../hooks/useNativeVoiceRecorder';
import { parseDispatchText, useDispatchCommand } from '../../hooks/useDispatchCommand';
import { MentionSuggestionList } from './MentionSuggestionList';

interface SeedNotebookProps {
  keyboardVerticalOffset?: number;
  onFocusChange?: (focused: boolean) => void;
  onDevelopSeed: (seed: Seed) => void;
  dispatchEnabled?: boolean;
}

function formatSeedTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function selectVisibleSeeds(seeds: Seed[]): Seed[] {
  return seeds;
}

const CAPTURE_DRAFT_KEY_PREFIX = 'mixtape.mobile.seedDraft';

export function SeedNotebook({
  keyboardVerticalOffset = 0,
  onFocusChange,
  onDevelopSeed,
  dispatchEnabled = false,
}: SeedNotebookProps) {
  const currentUser = useAuthStore((state) => state.user);
  const recentSeedsQuery = useRecentSeeds(20);
  const createSeed = useCreateSeed();
  const createVoiceSeed = useCreateVoiceSeed();
  const deleteSeed = useDeleteSeed();
  const updateSeed = useUpdateSeed();
  const [editingSeedId, setEditingSeedId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [savedSeed, setSavedSeed] = useState<Seed | null>(null);
  const [copiedSeedId, setCopiedSeedId] = useState<string | null>(null);
  const [dispatchParseResult, setDispatchParseResult] = useState(() =>
    parseDispatchText('')
  );
  const dispatch = useDispatchCommand();
  const editInputRef = useRef<TextInput | null>(null);
  const captureDockRef = useRef<CaptureDockHandle | null>(null);
  const seedListRef = useRef<FlatList<Seed> | null>(null);
  const voiceRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceRefreshPhaseRef = useRef<'initial' | 'extended'>('initial');

  const visibleSeeds = useMemo(
    () => selectVisibleSeeds(recentSeedsQuery.data ?? []),
    [recentSeedsQuery.data]
  );
  const draftStorageKey = currentUser?.username
    ? `${CAPTURE_DRAFT_KEY_PREFIX}.${currentUser.username}`
    : CAPTURE_DRAFT_KEY_PREFIX;

  useEffect(() => {
    const hasProcessingVoiceSeed = visibleSeeds.some(
      (seed) => seed.kind === 'voice' && seed.status === 'processing'
    );

    if (!hasProcessingVoiceSeed) {
      if (voiceRefreshTimeoutRef.current) {
        clearTimeout(voiceRefreshTimeoutRef.current);
        voiceRefreshTimeoutRef.current = null;
      }
      voiceRefreshPhaseRef.current = 'initial';
      return;
    }

    const delay = voiceRefreshPhaseRef.current === 'initial' ? 5000 : 24000;
    voiceRefreshTimeoutRef.current = setTimeout(() => {
      voiceRefreshPhaseRef.current = 'extended';
      void recentSeedsQuery.refetch();
    }, delay);

    return () => {
      if (voiceRefreshTimeoutRef.current) {
        clearTimeout(voiceRefreshTimeoutRef.current);
        voiceRefreshTimeoutRef.current = null;
      }
    };
  }, [recentSeedsQuery, visibleSeeds]);

  const handleCapture = async (bodyText: string) => {
    const seed = await createSeed.mutateAsync({
      body_text: bodyText,
      kind: 'text',
      source: 'mobile',
    });

    setSavedSeed(seed);
    requestAnimationFrame(() => {
      seedListRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  };

  const handleVoiceComplete = async (clip: RecordedClip) => {
    const seed = await createVoiceSeed.mutateAsync({
      uri: clip.uri,
      mimeType: clip.mimeType,
      fileName: clip.fileName,
      source: 'mobile',
    });
    setSavedSeed(seed);
    requestAnimationFrame(() => {
      seedListRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
  };

  const startEditingSeed = (seed: Seed) => {
    setEditingSeedId(seed.id);
    setEditingText(seed.body_text);
    setSavedSeed(null);
    requestAnimationFrame(() => {
      editInputRef.current?.focus();
    });
  };

  const handleSaveSeedEdit = async () => {
    if (!editingSeedId) {
      return;
    }

    await updateSeed.mutateAsync({
      id: editingSeedId,
      data: { body_text: editingText.trim() },
    });

    setEditingSeedId(null);
    setEditingText('');
  };

  const cancelEditingSeed = () => {
    setEditingSeedId(null);
    setEditingText('');
    onFocusChange?.(false);
  };

  const handleDeleteSeed = (seed: Seed) => {
    Alert.alert(
      'Delete Seed?',
      'This removes the Seed from your notebook.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void deleteSeed.mutateAsync(seed.id).then(() => {
              if (savedSeed?.id === seed.id) {
                setSavedSeed(null);
              }
              if (editingSeedId === seed.id) {
                setEditingSeedId(null);
                setEditingText('');
              }
            });
          },
        },
      ]
    );
  };

  const handleCopySeed = async (seed: Seed) => {
    const content = seed.body_text?.trim();
    if (!content) {
      return;
    }

    Clipboard.setString(content);
    setCopiedSeedId(seed.id);
    setTimeout(() => {
      setCopiedSeedId((current) => (current === seed.id ? null : current));
    }, 1800);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Recent Seeds</Text>
      </View>

      <FlatList
        ref={seedListRef}
        data={visibleSeeds}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.seedList}
        ItemSeparatorComponent={() => <View style={styles.seedDivider} />}
        keyboardShouldPersistTaps="handled"
        inverted
        refreshControl={
          <RefreshControl
            refreshing={recentSeedsQuery.isRefetching}
            onRefresh={() => {
              void recentSeedsQuery.refetch();
            }}
            tintColor="#0E5AA7"
          />
        }
        ListEmptyComponent={
          recentSeedsQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#0E5AA7" />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Seeds yet</Text>
              <Text style={styles.emptySubtitle}>Your notebook will appear here as soon as you start capturing.</Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isEditing = editingSeedId === item.id;

          return (
            <TouchableOpacity
              style={styles.seedRow}
              activeOpacity={0.88}
              onPress={() => startEditingSeed(item)}
            >
              <View style={styles.seedHeader}>
                <Text style={styles.seedKind}>SEED</Text>
                <Text style={styles.seedMeta}>{formatSeedTime(item.created_at)}</Text>
              </View>

              {isEditing ? (
                <>
                  <View style={styles.seedEditingCard}>
                    <Text style={styles.seedEditingLabel}>Editing below</Text>
                    <Text style={styles.seedBody}>{editingText || item.body_text || 'Empty Seed'}</Text>
                  </View>
                  <View style={styles.seedActions}>
                    <TouchableOpacity
                      onPress={cancelEditingSeed}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.seedSecondaryAction}>Done later</Text>
                    </TouchableOpacity>
                    <View style={styles.seedPrimaryActions}>
                      <TouchableOpacity
                        onPress={() => {
                          void handleCopySeed(item);
                        }}
                        activeOpacity={0.8}
                        style={styles.seedIconButton}
                      >
                        <Text style={styles.seedIconText}>
                          {copiedSeedId === item.id ? '✓' : '⧉'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onDevelopSeed(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.seedSecondaryAction}>Develop</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteSeed(item)}
                        activeOpacity={0.8}
                        style={styles.seedIconButton}
                      >
                        <Text style={styles.seedIconText}>🗑</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleSaveSeedEdit}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.seedPrimaryAction}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.seedBody}>{item.body_text || 'Empty Seed'}</Text>
                  <View style={styles.seedActions}>
                    <Text style={styles.seedTapHint}>Tap to edit inline</Text>
                    <View style={styles.seedPrimaryActions}>
                      <TouchableOpacity
                        onPress={() => {
                          void handleCopySeed(item);
                        }}
                        activeOpacity={0.8}
                        style={styles.seedIconButton}
                      >
                        <Text style={styles.seedIconText}>
                          {copiedSeedId === item.id ? '✓' : '⧉'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onDevelopSeed(item)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.seedPrimaryAction}>Develop</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteSeed(item)}
                        activeOpacity={0.8}
                        style={styles.seedIconButton}
                      >
                        <Text style={styles.seedIconText}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.captureDock}>
        {editingSeedId ? (
          <View style={styles.captureCard}>
            <View style={styles.kickerRow}>
              <Text style={styles.kicker}>Editing Seed</Text>
            </View>
            <Text style={styles.editingTitle}>Refine this Seed</Text>
            <TextInput
              ref={editInputRef}
              style={styles.captureInput}
              multiline
              placeholder="Revise this Seed..."
              placeholderTextColor="#738292"
              value={editingText}
              onChangeText={setEditingText}
              textAlignVertical="top"
              onFocus={() => onFocusChange?.(true)}
              onBlur={() => onFocusChange?.(false)}
            />
            <View style={styles.captureFooter}>
              <TouchableOpacity onPress={cancelEditingSeed} activeOpacity={0.8}>
                <Text style={styles.seedSecondaryAction}>Done later</Text>
              </TouchableOpacity>
              <View style={styles.editorActions}>
                <TouchableOpacity
                  onPress={() => {
                    const activeSeed = visibleSeeds.find((seed) => seed.id === editingSeedId);
                    if (activeSeed) {
                      handleDeleteSeed(activeSeed);
                    }
                  }}
                  activeOpacity={0.8}
                  style={styles.seedIconButton}
                  disabled={!editingSeedId}
                >
                  <Text style={styles.seedIconText}>🗑</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveSeedEdit}
                  activeOpacity={0.85}
                  style={[
                    styles.iconSendButton,
                    (!editingText.trim() || updateSeed.isPending) && styles.buttonDisabled,
                  ]}
                  disabled={!editingText.trim() || updateSeed.isPending}
                >
                  {updateSeed.isPending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.iconSendText}>➤</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <CaptureDock
            ref={captureDockRef}
            draftStorageKey={draftStorageKey}
            kickerLabel="Pocket Notebook"
            kickerSub="What's on your mind?"
            placeholder="Type here..."
            isInputHighlighted={dispatchEnabled && dispatchParseResult.isDispatchMode}
            onChangeTextOverride={(value, setText) => {
              if (dispatchEnabled) {
                const parsed = parseDispatchText(value);
                setDispatchParseResult(parsed);
                if (parsed.shouldFire && !dispatch.isDispatching) {
                  void dispatch.fire(parsed, draftStorageKey, (newText) => {
                    setText(newText);
                    setDispatchParseResult(parseDispatchText(newText));
                  });
                  return;
                }
              }
              setText(value);
              if (savedSeed) {
                setSavedSeed(null);
              }
            }}
            belowInputContent={
              <>
                {dispatchEnabled &&
                 dispatchParseResult.isDispatchMode &&
                 dispatchParseResult.mentionQuery !== null ? (
                  <MentionSuggestionList
                    query={dispatchParseResult.mentionQuery}
                    onSelect={(username) => {
                      // Replace the partial @mention at the end of the command line with the completed one
                      const currentText = captureDockRef.current?.getText() ?? '';
                      const newText = currentText.replace(/@(\w*)$/, `@${username} `);
                      captureDockRef.current?.setText(newText);
                      setDispatchParseResult(parseDispatchText(newText));
                    }}
                  />
                ) : null}

                {dispatchEnabled && dispatch.dispatchError ? (
                  <TouchableOpacity
                    onPress={dispatch.clearError}
                    style={styles.dispatchError}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.dispatchErrorText}>{dispatch.dispatchError}</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            }
            onSubmitText={handleCapture}
            onSubmitVoice={handleVoiceComplete}
            isSubmittingText={createSeed.isPending}
            isSubmittingVoice={createVoiceSeed.isPending}
            onFocusChange={onFocusChange}
            footerExtraContent={
              <>
                {dispatch.confirmationVisible ? (
                  <Animated.View
                    style={[styles.dispatchConfirmation, { opacity: dispatch.confirmationOpacity }]}
                    pointerEvents="none"
                  >
                    <Text style={styles.dispatchConfirmationText}>✓ Message sent</Text>
                  </Animated.View>
                ) : null}

                <View
                  style={[
                    styles.savedPrompt,
                    !savedSeed && styles.savedPromptHidden,
                  ]}
                  pointerEvents={savedSeed ? 'auto' : 'none'}
                >
                  <Text style={styles.savedTitle}>Saved</Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (savedSeed) {
                        onDevelopSeed(savedSeed);
                      }
                    }}
                    activeOpacity={0.8}
                    disabled={!savedSeed}
                  >
                    <Text style={styles.savedLink}>Develop this?</Text>
                  </TouchableOpacity>
                </View>
              </>
            }
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  captureDock: {
    paddingTop: 10,
    paddingBottom: 0,
  },
  captureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 8,
    marginBottom: 4,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  kicker: {
    color: '#315E87',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  kickerSub: {
    color: '#6A8DA8',
    fontSize: 12,
    fontWeight: '500',
  },
  editingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D2235',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5E6E7D',
  },
  captureInput: {
    minHeight: 96,
    maxHeight: 148,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#C9D4DE',
    color: '#13293D',
    fontSize: 16,
    lineHeight: 22,
  },
  dispatchError: {
    backgroundColor: '#FFF0EE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#F5C4BF',
  },
  dispatchErrorText: {
    fontSize: 13,
    color: '#8F3341',
    fontWeight: '600',
  },
  dispatchConfirmation: {
    position: 'absolute',
    bottom: 48,
    alignSelf: 'center',
    backgroundColor: '#1D6B3F',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
    zIndex: 10,
  },
  dispatchConfirmationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  captureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
    minHeight: 42,
  },
  iconSendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0E5AA7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSendText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  savedPrompt: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    minHeight: 18,
  },
  savedPromptHidden: {
    display: 'none',
  },
  savedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B6E44',
  },
  savedLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E5AA7',
  },
  recentHeader: {
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#13293D',
  },
  seedList: {
    paddingBottom: 20,
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    overflow: 'hidden',
  },
  seedDivider: {
    height: 1,
    backgroundColor: '#E6EDF3',
    marginHorizontal: 16,
  },
  centerState: {
    paddingVertical: 36,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#D7E0EA',
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
  seedRow: {
    padding: 16,
    gap: 10,
  },
  seedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seedKind: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#315E87',
  },
  seedMeta: {
    fontSize: 12,
    color: '#6A7785',
  },
  seedBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#13293D',
  },
  seedTapHint: {
    fontSize: 12,
    color: '#6A7785',
  },
  seedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  seedPrimaryActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  seedPrimaryAction: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0E5AA7',
  },
  seedSecondaryAction: {
    fontSize: 13,
    color: '#526170',
    fontWeight: '600',
  },
  seedIconButton: {
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seedIconText: {
    fontSize: 15,
  },
  seedEditor: {
    minHeight: 104,
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#C9D4DE',
    color: '#13293D',
    fontSize: 15,
    lineHeight: 22,
  },
  seedEditingCard: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#C9D4DE',
    gap: 8,
  },
  seedEditingLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#315E87',
  },
  editorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

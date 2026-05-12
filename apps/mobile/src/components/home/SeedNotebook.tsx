import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useCreateSeed,
  useCreateVoiceSeed,
  useDeleteSeed,
  useRecentSeeds,
  useUpdateSeed,
} from '@mixtape/api/hooks/useSeed';
import type { Seed } from '@mixtape/api/clients/writing/seedApi';
import { useAuthStore } from '../../stores/authStore';
import { useNativeVoiceRecorder } from '../../hooks/useNativeVoiceRecorder';
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

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
  const [captureText, setCaptureText] = useState('');
  const [editingSeedId, setEditingSeedId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [savedSeed, setSavedSeed] = useState<Seed | null>(null);
  const [captureFocused, setCaptureFocused] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [copiedSeedId, setCopiedSeedId] = useState<string | null>(null);
  const [dispatchParseResult, setDispatchParseResult] = useState(() =>
    parseDispatchText('')
  );
  const dispatch = useDispatchCommand();
  const captureInputRef = useRef<TextInput | null>(null);
  const editInputRef = useRef<TextInput | null>(null);
  const seedListRef = useRef<FlatList<Seed> | null>(null);
  const retainCaptureFocusRef = useRef(false);
  const draftSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceRefreshPhaseRef = useRef<'initial' | 'extended'>('initial');
  const {
    isPreparing,
    isRecording,
    isPaused,
    recordingSeconds,
    meterLevel,
    micError,
    canOpenSettings,
    startRecording,
    pauseRecording,
    resumeRecording,
    finalizeRecording,
    clearRecording,
  } = useNativeVoiceRecorder();

  const visibleSeeds = useMemo(
    () => selectVisibleSeeds(recentSeedsQuery.data ?? []),
    [recentSeedsQuery.data]
  );
  const showVoiceStatus = isRecording || isPaused || isPreparing;
  const voiceSessionActive = isRecording || isPaused || isPreparing;
  const draftStorageKey = currentUser?.username
    ? `${CAPTURE_DRAFT_KEY_PREFIX}.${currentUser.username}`
    : CAPTURE_DRAFT_KEY_PREFIX;

  useEffect(() => {
    let active = true;

    void AsyncStorage.getItem(draftStorageKey).then((value) => {
      if (!active || !value) {
        return;
      }

      setCaptureText(value);
      setDraftStatus('saved');
    });

    return () => {
      active = false;
    };
  }, [draftStorageKey]);

  useEffect(() => {
    if (editingSeedId) {
      return;
    }

    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }

    setDraftStatus(captureText.trim() ? 'saving' : 'idle');

    draftSaveTimeoutRef.current = setTimeout(() => {
      const nextValue = captureText;
      const request = nextValue.trim()
        ? AsyncStorage.setItem(draftStorageKey, nextValue)
        : AsyncStorage.removeItem(draftStorageKey);

      void request.then(() => {
        setDraftStatus(nextValue.trim() ? 'saved' : 'idle');
      });
    }, 600);

    return () => {
      if (draftSaveTimeoutRef.current) {
        clearTimeout(draftSaveTimeoutRef.current);
        draftSaveTimeoutRef.current = null;
      }
    };
  }, [captureText, draftStorageKey, editingSeedId]);

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

  const handleCapture = async () => {
    const bodyText = captureText.trim();
    if (!bodyText || createSeed.isPending) {
      return;
    }

    retainCaptureFocusRef.current = true;

    const seed = await createSeed.mutateAsync({
      body_text: bodyText,
      kind: 'text',
      source: 'mobile',
    });

    setCaptureText('');
    setDraftStatus('idle');
    setSavedSeed(seed);
    void AsyncStorage.removeItem(draftStorageKey);
    requestAnimationFrame(() => {
      seedListRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
    setTimeout(() => {
      captureInputRef.current?.focus();
      retainCaptureFocusRef.current = false;
    }, 10);
  };

  const handleSendVoiceSeed = async () => {
    if ((!isRecording && !isPaused) || createVoiceSeed.isPending) {
      return;
    }

    const recordedClip = await finalizeRecording();
    if (!recordedClip) {
      return;
    }

    const seed = await createVoiceSeed.mutateAsync({
      uri: recordedClip.uri,
      mimeType: recordedClip.mimeType,
      fileName: recordedClip.fileName,
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
    setCaptureFocused(false);
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
        <View style={styles.captureCard}>
          <View style={styles.kickerRow}>
            <Text style={styles.kicker}>
              {editingSeedId ? 'Editing Seed' : 'Pocket Notebook'}
            </Text>
            {!editingSeedId ? (
              <Text style={styles.kickerSub}> · What's on your mind?</Text>
            ) : null}
          </View>
          {editingSeedId ? (
            <>
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
                onFocus={() => {
                  setCaptureFocused(true);
                  onFocusChange?.(true);
                }}
                onBlur={() => {
                  setCaptureFocused(false);
                  onFocusChange?.(false);
                }}
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
            </>
          ) : (
            <>
              <TextInput
                ref={captureInputRef}
                style={[
                  styles.captureInput,
                  dispatchEnabled && dispatchParseResult.isDispatchMode && styles.captureInputDispatch,
                ]}
                autoFocus={false}
                multiline
                placeholder="Type here..."
                placeholderTextColor="#738292"
                value={captureText}
                onChangeText={(value) => {
                  if (dispatchEnabled) {
                    const parsed = parseDispatchText(value);
                    setDispatchParseResult(parsed);
                    if (parsed.shouldFire && !dispatch.isDispatching) {
                      void dispatch.fire(parsed, draftStorageKey, (newText) => {
                        setCaptureText(newText);
                        setDispatchParseResult(parseDispatchText(newText));
                      });
                      return;
                    }
                  }
                  setCaptureText(value);
                  if (savedSeed) {
                    setSavedSeed(null);
                  }
                }}
                textAlignVertical="top"
                onFocus={() => {
                  setCaptureFocused(true);
                  onFocusChange?.(true);
                }}
                onBlur={() => {
                  if (retainCaptureFocusRef.current) {
                    requestAnimationFrame(() => {
                      captureInputRef.current?.focus();
                    });
                    return;
                  }

                  setCaptureFocused(false);
                  onFocusChange?.(false);
                }}
              />

              {dispatchEnabled &&
               dispatchParseResult.isDispatchMode &&
               dispatchParseResult.mentionQuery !== null ? (
                <MentionSuggestionList
                  query={dispatchParseResult.mentionQuery}
                  onSelect={(username) => {
                    // Replace the partial @mention at the end of the command line with the completed one
                    const newText = captureText.replace(/@(\w*)$/, `@${username} `);
                    setCaptureText(newText);
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

              <View style={styles.captureFooter}>
                {isPaused ? (
                  <View style={styles.voiceControlCluster}>
                    <TouchableOpacity
                      onPress={() => {
                        void clearRecording();
                      }}
                      activeOpacity={0.85}
                      style={styles.voiceTrashButton}
                    >
                      <Text style={styles.voiceTrashIcon}>🗑</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        void resumeRecording();
                      }}
                      activeOpacity={0.85}
                      style={[
                        styles.voiceSecondaryButton,
                        isPreparing && styles.buttonDisabled,
                      ]}
                      disabled={isPreparing}
                    >
                      <Text style={styles.voiceSecondaryButtonText}>Resume</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      if (isRecording) {
                        void pauseRecording();
                        return;
                      }
                      void startRecording();
                    }}
                    activeOpacity={0.85}
                    style={[
                      styles.voiceSecondaryButton,
                      isPreparing && styles.buttonDisabled,
                    ]}
                    disabled={isPreparing}
                  >
                    <Text style={styles.voiceSecondaryButtonText}>
                      {showVoiceStatus ? 'Pause' : 'Record'}
                    </Text>
                  </TouchableOpacity>
                )}
                {showVoiceStatus ? (
                  <View style={styles.voiceInlineStatus}>
                    <Text style={styles.voiceStatus}>{formatDuration(recordingSeconds)}</Text>
                    {isRecording ? (
                      <View style={styles.voiceMeter}>
                        {[0.2, 0.4, 0.6, 0.8].map((threshold, index) => (
                          <View
                            key={threshold}
                            style={[
                              styles.voiceMeterBar,
                              meterLevel >= threshold && styles.voiceMeterBarActive,
                              meterLevel >= threshold && {
                                height: 8 + index * 2 + meterLevel * 4,
                              },
                            ]}
                          />
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.captureFooterSpacer} />
                )}
                {voiceSessionActive ? (
                  <TouchableOpacity
                    onPress={() => {
                      void handleSendVoiceSeed();
                    }}
                    activeOpacity={0.85}
                    style={[
                      styles.sendButton,
                      createVoiceSeed.isPending && styles.buttonDisabled,
                    ]}
                    disabled={createVoiceSeed.isPending}
                  >
                    {createVoiceSeed.isPending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.sendButtonText}>➤ Voice</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <Pressable
                    style={[
                      styles.sendButton,
                      (!captureText.trim() || createSeed.isPending || isRecording) && styles.buttonDisabled,
                    ]}
                    focusable={false}
                    onPressIn={() => {
                      retainCaptureFocusRef.current = true;
                      captureInputRef.current?.focus();
                    }}
                    onPress={handleCapture}
                    disabled={!captureText.trim() || createSeed.isPending || isRecording}
                  >
                    {createSeed.isPending ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.sendButtonText}>➤</Text>
                    )}
                  </Pressable>
                )}
              </View>
              {micError ? (
                <View style={styles.voiceErrorRow}>
                  <Text style={styles.voiceError}>{micError}</Text>
                  {canOpenSettings ? (
                    <TouchableOpacity
                      onPress={() => {
                        void Linking.openSettings();
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.voiceSettingsLink}>Open settings</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
              <Text style={styles.draftStatus}>
                {draftStatus === 'saving'
                  ? 'Saving draft...'
                  : draftStatus === 'saved'
                    ? 'Draft saved'
                    : ' '}
              </Text>
            </>
          )}

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
        </View>
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
  captureInputDispatch: {
    borderColor: '#0E5AA7',
    backgroundColor: '#F0F7FF',
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
  voiceControlCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  captureFooterSpacer: {
    flex: 1,
  },
  voiceInlineStatus: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  draftStatus: {
    minHeight: 12,
    fontSize: 12,
    color: '#6A7785',
    marginTop: -2,
  },
  voiceStatus: {
    fontSize: 12,
    color: '#34516B',
    fontWeight: '600',
  },
  voiceMeter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 18,
    paddingTop: 0,
  },
  voiceMeterBar: {
    width: 5,
    height: 8,
    borderRadius: 3,
    backgroundColor: '#B7C7D6',
    maxHeight: 18,
  },
  voiceMeterBarActive: {
    backgroundColor: '#0E5AA7',
  },
  voiceSecondaryButton: {
    minWidth: 116,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F6FB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  voiceTrashButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceTrashIcon: {
    fontSize: 16,
  },
  voiceSecondaryButtonText: {
    color: '#244867',
    fontSize: 14,
    fontWeight: '700',
  },
  voiceError: {
    fontSize: 12,
    color: '#8F3341',
  },
  voiceErrorRow: {
    gap: 4,
  },
  voiceSettingsLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5AA7',
  },
  sendButton: {
    minWidth: 108,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#0E5AA7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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

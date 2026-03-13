import { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useCreateSeed,
  useDeleteSeed,
  useRecentSeeds,
  useUpdateSeed,
} from '@mixtape/api/hooks/useSeed';
import type { Seed } from '@mixtape/api/clients/writing/seedApi';

interface SeedNotebookProps {
  keyboardVerticalOffset?: number;
  onFocusChange?: (focused: boolean) => void;
  onDevelopSeed: (seed: Seed) => void;
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
  const ninetyMinutesAgo = Date.now() - 90 * 60 * 1000;
  const recentSeeds = seeds.filter((seed) => {
    const createdAt = new Date(seed.created_at).getTime();
    return !Number.isNaN(createdAt) && createdAt >= ninetyMinutesAgo;
  });

  if (recentSeeds.length > 0) {
    return recentSeeds;
  }

  return seeds.slice(0, 8);
}

export function SeedNotebook({
  keyboardVerticalOffset = 0,
  onFocusChange,
  onDevelopSeed,
}: SeedNotebookProps) {
  const recentSeedsQuery = useRecentSeeds(20);
  const createSeed = useCreateSeed();
  const deleteSeed = useDeleteSeed();
  const updateSeed = useUpdateSeed();
  const [captureText, setCaptureText] = useState('');
  const [editingSeedId, setEditingSeedId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [savedSeed, setSavedSeed] = useState<Seed | null>(null);
  const [captureFocused, setCaptureFocused] = useState(false);
  const captureInputRef = useRef<TextInput | null>(null);
  const editInputRef = useRef<TextInput | null>(null);
  const seedListRef = useRef<FlatList<Seed> | null>(null);
  const retainCaptureFocusRef = useRef(false);

  const visibleSeeds = useMemo(
    () => selectVisibleSeeds(recentSeedsQuery.data ?? []),
    [recentSeedsQuery.data]
  );

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
    setSavedSeed(seed);
    requestAnimationFrame(() => {
      seedListRef.current?.scrollToOffset({ offset: 0, animated: false });
    });
    setTimeout(() => {
      captureInputRef.current?.focus();
      retainCaptureFocusRef.current = false;
    }, 10);
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Recent Seeds</Text>
        <Text style={styles.recentHint}>Showing the last 90 minutes, or your latest 8 if things are quiet.</Text>
      </View>

      <FlatList
        ref={seedListRef}
        data={visibleSeeds}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.seedList}
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
              style={styles.seedCard}
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
          <Text style={styles.kicker}>
            {editingSeedId ? 'Editing Seed' : 'Pocket Notebook'}
          </Text>
          {!captureFocused && !editingSeedId ? (
            <Text style={styles.title}>What&apos;s on your mind?</Text>
          ) : null}
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
                style={styles.captureInput}
                autoFocus={false}
                multiline
                placeholder="Type here..."
                placeholderTextColor="#738292"
                value={captureText}
                onChangeText={(value) => {
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

              <View style={styles.captureFooter}>
                <Text style={styles.helper}>
                  Private Seed capture. New lines stay available; send from the button when ready.
                </Text>
                <Pressable
                  style={[
                    styles.sendButton,
                    (!captureText.trim() || createSeed.isPending) && styles.buttonDisabled,
                  ]}
                  focusable={false}
                  onPressIn={() => {
                    retainCaptureFocusRef.current = true;
                    captureInputRef.current?.focus();
                  }}
                  onPress={handleCapture}
                  disabled={!captureText.trim() || createSeed.isPending}
                >
                  {createSeed.isPending ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.sendButtonText}>Send</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}

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
    paddingBottom: 4,
  },
  captureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 12,
    marginBottom: 16,
  },
  kicker: {
    color: '#315E87',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0D2235',
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
  captureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  helper: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#6A7785',
  },
  sendButton: {
    minWidth: 88,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0E5AA7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
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
    opacity: 0,
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
    gap: 4,
    marginBottom: 10,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#13293D',
  },
  recentHint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6A7785',
  },
  seedList: {
    paddingBottom: 24,
    gap: 12,
    flexGrow: 1,
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
  seedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D7E0EA',
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

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { useCreateLeaf, useStoryline } from '@mixtape/api/hooks/useLeaf';
import type { Seed } from '@mixtape/api/clients/writing/seedApi';
import { HomeLeafCard } from './HomeLeafCard';

interface IdeaStudioProps {
  keyboardVerticalOffset?: number;
  onFocusChange?: (focused: boolean) => void;
  seedToDevelop: Seed | null;
  onDraftConsumed: () => void;
}

export function IdeaStudio({
  keyboardVerticalOffset = 0,
  onFocusChange,
  seedToDevelop,
  onDraftConsumed,
}: IdeaStudioProps) {
  const storylineQuery = useStoryline();
  const createLeaf = useCreateLeaf();
  const [draftText, setDraftText] = useState('');

  useEffect(() => {
    if (seedToDevelop) {
      setDraftText(seedToDevelop.body_text);
    }
  }, [seedToDevelop]);

  const handleCreateLeaf = async (publish: boolean) => {
    const bodyText = draftText.trim();
    if (!bodyText) {
      return;
    }

    await createLeaf.mutateAsync({
      body_text: bodyText,
      kind: 'text',
      publish,
    });

    setDraftText('');
    onDraftConsumed();
    void storylineQuery.refetch();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={styles.feedHeader}>
        <Text style={styles.feedTitle}>Storyline</Text>
        <Text style={styles.feedSubtitle}>Your published writing and recent additions.</Text>
      </View>

      <FlatList
        data={storylineQuery.data?.results ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.feedContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={storylineQuery.isRefetching}
            onRefresh={() => {
              void storylineQuery.refetch();
            }}
            tintColor="#0E5AA7"
          />
        }
        ListEmptyComponent={
          storylineQuery.isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color="#0E5AA7" />
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Storyline entries yet</Text>
              <Text style={styles.emptySubtitle}>
                Draft here, then add something to Storyline when it feels ready.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <HomeLeafCard leaf={item} />}
      />

      <View style={styles.editorDock}>
        <View style={styles.editorCard}>
          <Text style={styles.kicker}>Idea Studio</Text>
          <Text style={styles.title}>Develop toward Storyline</Text>

          {seedToDevelop ? (
            <View style={styles.seedBanner}>
              <Text style={styles.seedBannerTitle}>Working from a recent Seed</Text>
              <Text style={styles.seedBannerBody} numberOfLines={2}>
                {seedToDevelop.body_text}
              </Text>
            </View>
          ) : null}

          <TextInput
            style={styles.editorInput}
            multiline
            placeholder="Refine your idea..."
            placeholderTextColor="#738292"
            value={draftText}
            onChangeText={setDraftText}
            textAlignVertical="top"
            editable={!createLeaf.isPending}
            onFocus={() => onFocusChange?.(true)}
            onBlur={() => onFocusChange?.(false)}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                (!draftText.trim() || createLeaf.isPending) && styles.buttonDisabled,
              ]}
              onPress={() => {
                void handleCreateLeaf(false);
              }}
              disabled={!draftText.trim() || createLeaf.isPending}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Save Draft</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!draftText.trim() || createLeaf.isPending) && styles.buttonDisabled,
              ]}
              onPress={() => {
                void handleCreateLeaf(true);
              }}
              disabled={!draftText.trim() || createLeaf.isPending}
              activeOpacity={0.85}
            >
              {createLeaf.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Add to Storyline</Text>
              )}
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
  editorDock: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  editorCard: {
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
  seedBanner: {
    backgroundColor: '#F1F6FB',
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  seedBannerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#315E87',
  },
  seedBannerBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#13293D',
  },
  editorInput: {
    minHeight: 96,
    maxHeight: 150,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#C9D4DE',
    color: '#13293D',
    fontSize: 16,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#9DB6CC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FBFD',
  },
  secondaryButtonText: {
    color: '#244867',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0E5AA7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  feedHeader: {
    gap: 4,
    marginBottom: 10,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#13293D',
  },
  feedSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6A7785',
  },
  feedContent: {
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
});

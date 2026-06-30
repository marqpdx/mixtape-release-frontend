// apps/mobile/src/screens/NewThreadScreen.tsx

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThreadworks, threadworksQueryKeys } from '@mixtape/api/hooks/threadworks/useThreadworks';
import * as threadworksApi from '@mixtape/api/clients/threadworks/threadworksApi';
import type { Forum } from '@mixtape/core/types/threadworksTypes';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'NewThread'>;

const SAGE = '#4E7055';
const STEEL = '#1B4570';

function ForumRow({
  forum,
  selected,
  onSelect,
}: {
  forum: Forum;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      style={[forumStyles.row, selected && forumStyles.rowSelected]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={forumStyles.text}>
        <Text style={[forumStyles.title, selected && forumStyles.titleSelected]} numberOfLines={1}>
          {forum.title}
        </Text>
        {forum.description ? (
          <Text style={forumStyles.description} numberOfLines={1}>{forum.description}</Text>
        ) : null}
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={18} color={SAGE} />
      ) : (
        <Ionicons name="ellipse-outline" size={18} color="#C8DCE8" />
      )}
    </TouchableOpacity>
  );
}

export default function NewThreadScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const { forums, isLoading: forumsLoading } = useThreadworks();

  const canPost = !!selectedForum && title.trim().length > 0 && body.trim().length > 0;

  const { mutateAsync: createDiscussion, isPending } = useMutation({
    mutationFn: () =>
      threadworksApi.createDiscussion(selectedForum!.slug, {
        title: title.trim(),
        content: body.trim(),
      }),
    onSuccess: (discussion) => {
      void queryClient.invalidateQueries({
        queryKey: threadworksQueryKeys.recentDiscussions(),
      });
      void queryClient.invalidateQueries({
        queryKey: threadworksQueryKeys.discussions(selectedForum!.slug),
      });
      navigation.replace('ThreadDetail', {
        forumSlug: selectedForum!.slug,
        discussionSlug: discussion.slug,
        title: discussion.title,
        forumName: selectedForum!.title,
      });
    },
  });

  const handlePost = useCallback(async () => {
    if (!canPost || isPending) return;
    try {
      await createDiscussion();
    } catch {
      // mutation error — leave fields intact so user can retry
    }
  }, [canPost, isPending, createDiscussion]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerAction} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Thread</Text>
        <TouchableOpacity
          style={[styles.headerAction, styles.postAction]}
          onPress={() => void handlePost()}
          activeOpacity={0.75}
          disabled={!canPost || isPending}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.postText, !canPost && styles.postTextDisabled]}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 52}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Forum picker */}
          <Text style={styles.sectionLabel}>Choose a forum</Text>
          {forumsLoading ? (
            <View style={styles.forumLoading}>
              <ActivityIndicator color={SAGE} />
            </View>
          ) : forums.length === 0 ? (
            <Text style={styles.emptyForums}>No forums available.</Text>
          ) : (
            <View style={styles.forumList}>
              {forums.map((forum) => (
                <ForumRow
                  key={forum.id}
                  forum={forum}
                  selected={selectedForum?.id === forum.id}
                  onSelect={() => setSelectedForum(forum)}
                />
              ))}
            </View>
          )}

          <View style={styles.divider} />

          {/* Title */}
          <TextInput
            style={styles.titleInput}
            placeholder="Thread title"
            placeholderTextColor="#9DB9D4"
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            returnKeyType="next"
            editable={!!selectedForum}
          />

          {/* Body */}
          <TextInput
            style={styles.bodyInput}
            placeholder={selectedForum ? 'What do you want to discuss?' : 'Choose a forum first…'}
            placeholderTextColor="#9DB9D4"
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={10000}
            returnKeyType="default"
            textAlignVertical="top"
            editable={!!selectedForum}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EEF4F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D8E8F2',
    backgroundColor: '#EEF4F8',
  },
  headerAction: {
    minWidth: 64,
  },
  postAction: {
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: STEEL,
    flex: 1,
    textAlign: 'center',
  },
  cancelText: {
    fontSize: 15,
    color: '#6B8499',
  },
  postText: {
    fontSize: 15,
    fontWeight: '700',
    color: SAGE,
  },
  postTextDisabled: {
    color: '#B8D0C0',
  },
  body: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9DB9D4',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  forumLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyForums: {
    color: '#9DB9D4',
    fontSize: 14,
    paddingVertical: 16,
  },
  forumList: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D8E8F2',
    backgroundColor: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#D8E8F2',
    marginVertical: 20,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: STEEL,
    paddingVertical: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D8E8F2',
  },
  bodyInput: {
    fontSize: 15,
    color: '#2C4A66',
    lineHeight: 22,
    minHeight: 160,
    paddingTop: 4,
  },
});

const forumStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F6FA',
    gap: 10,
  },
  rowSelected: {
    backgroundColor: '#F2F7F3',
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: STEEL,
  },
  titleSelected: {
    color: SAGE,
  },
  description: {
    fontSize: 12,
    color: '#9DB9D4',
    marginTop: 2,
  },
});

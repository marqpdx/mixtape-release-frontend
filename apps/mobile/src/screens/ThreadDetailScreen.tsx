// apps/mobile/src/screens/ThreadDetailScreen.tsx

import { useCallback, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useDiscussion, threadworksQueryKeys } from '@mixtape/api/hooks/threadworks/useThreadworks';
import * as threadworksApi from '@mixtape/api/clients/threadworks/threadworksApi';
import type { Post, CreatePostData } from '@mixtape/core/types/threadworksTypes';
import { getThreadworksUserDisplayName } from '@mixtape/core/types/threadworksTypes';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ThreadDetail'>;

const SAGE = '#4E7055';
const STEEL = '#1B4570';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function PostRow({
  post,
  allPosts,
  onReply,
}: {
  post: Post;
  allPosts: Post[];
  onReply: (post: Post) => void;
}) {
  const authorName = getThreadworksUserDisplayName(post.author);

  let quotedPassage: string | null = null;
  if (post.quoted_post_id) {
    if (post.quoted_passage) {
      quotedPassage = post.quoted_passage;
    } else {
      const quotedPost = allPosts.find((p) => p.id === post.quoted_post_id);
      if (quotedPost) quotedPassage = quotedPost.content.slice(0, 200);
    }
  }

  return (
    <View style={postStyles.container}>
      <View style={postStyles.header}>
        <Text style={postStyles.author}>{authorName}</Text>
        <Text style={postStyles.time}>{relativeTime(post.created_at)}</Text>
      </View>
      {quotedPassage ? (
        <View style={postStyles.quotedBlock}>
          <View style={postStyles.quotedBar} />
          <Text style={postStyles.quotedText} numberOfLines={3}>{quotedPassage}</Text>
        </View>
      ) : null}
      <Text style={postStyles.content}>{post.content}</Text>
      <TouchableOpacity
        style={postStyles.replyBtn}
        onPress={() => onReply(post)}
        activeOpacity={0.6}
      >
        <Ionicons name="return-down-forward-outline" size={13} color="#9DB9D4" />
        <Text style={postStyles.replyLabel}>Reply</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ThreadDetailScreen({ route, navigation }: Props) {
  const { forumSlug, discussionSlug, title, forumName } = route.params;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);

  const [draft, setDraft] = useState('');
  const [quotedPost, setQuotedPost] = useState<Post | null>(null);

  const { discussion, isLoading, refetch } = useDiscussion(forumSlug, discussionSlug);
  const posts = discussion?.posts ?? [];

  const { mutateAsync: sendPost, isPending: isSending } = useMutation({
    mutationFn: (data: CreatePostData) =>
      threadworksApi.createPost(forumSlug, discussionSlug, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: threadworksQueryKeys.discussion(forumSlug, discussionSlug),
      });
      void queryClient.invalidateQueries({
        queryKey: threadworksQueryKeys.recentDiscussions(),
      });
    },
  });

  const handleReply = useCallback((post: Post) => {
    setQuotedPost(post);
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || isSending) return;
    const data: CreatePostData = {
      content,
      ...(quotedPost
        ? {
            quoted_post_id: quotedPost.id,
            quoted_passage: quotedPost.content.slice(0, 500),
          }
        : {}),
    };
    try {
      await sendPost(data);
      setDraft('');
      setQuotedPost(null);
    } catch {
      // leave draft intact so the user can retry
    }
  }, [draft, isSending, quotedPost, sendPost]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color={STEEL} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <TouchableOpacity
            onPress={() => { /* MX-14: navigate to forum discussion list view */ }}
            activeOpacity={0.7}
          >
            <Text style={styles.headerForum} numberOfLines={1}>{forumName}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={insets.top + 56}
      >
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostRow post={item} allPosts={posts} onReply={handleReply} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              {isLoading ? (
                <ActivityIndicator color={SAGE} />
              ) : (
                <Text style={styles.emptyText}>No posts yet. Start the conversation.</Text>
              )}
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isLoading && posts.length > 0} onRefresh={refetch} tintColor={SAGE} />
          }
        />

        <View style={[styles.composer, { paddingBottom: insets.bottom + 8 }]}>
          {quotedPost ? (
            <View style={styles.quotePreview}>
              <View style={styles.quoteBar} />
              <Text style={styles.quoteText} numberOfLines={2}>
                {getThreadworksUserDisplayName(quotedPost.author)}: {quotedPost.content}
              </Text>
              <TouchableOpacity
                onPress={() => setQuotedPost(null)}
                activeOpacity={0.7}
                style={styles.quoteDismiss}
              >
                <Ionicons name="close" size={14} color="#9DB9D4" />
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.composerRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Write a reply…"
              placeholderTextColor="#9DB9D4"
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={5000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!draft.trim() || isSending) && styles.sendBtnDisabled]}
              onPress={() => void handleSend()}
              activeOpacity={0.75}
              disabled={!draft.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D8E8F2',
    backgroundColor: '#EEF4F8',
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: STEEL,
  },
  headerForum: {
    fontSize: 12,
    color: SAGE,
    marginTop: 1,
  },
  body: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 12,
  },
  emptyState: {
    paddingTop: 48,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9DB9D4',
    fontSize: 14,
    textAlign: 'center',
  },
  composer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#D8E8F2',
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  quotePreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  quoteBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: SAGE,
    alignSelf: 'stretch',
    minHeight: 18,
  },
  quoteText: {
    flex: 1,
    fontSize: 12,
    color: '#6B8499',
    lineHeight: 16,
  },
  quoteDismiss: {
    padding: 2,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 110,
    backgroundColor: '#F4F8FB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8E8F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: STEEL,
    lineHeight: 20,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: SAGE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#B8D0C0',
  },
});

const postStyles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#D8E8F2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  author: {
    fontSize: 13,
    fontWeight: '600',
    color: STEEL,
  },
  time: {
    fontSize: 11,
    color: '#9DB9D4',
  },
  quotedBlock: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    paddingVertical: 4,
  },
  quotedBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: SAGE,
    alignSelf: 'stretch',
  },
  quotedText: {
    flex: 1,
    fontSize: 12,
    color: '#6B8499',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  content: {
    fontSize: 14,
    color: '#2C4A66',
    lineHeight: 21,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  replyLabel: {
    fontSize: 12,
    color: '#9DB9D4',
  },
});

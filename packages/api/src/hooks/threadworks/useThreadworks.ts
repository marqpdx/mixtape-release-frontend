// src/hooks/threadworks/useThreadworks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateForumData,
  CreateFeedPostData,
  UpdateFeedPostData,
  UpdateForumData,
  CreateDiscussionData,
  UpdateDiscussionData,
  CreatePostData,
  FetchForumsOptions,
  FetchDiscussionsOptions,
  UseThreadworksResult,
  UseForumResult,
  UseDiscussionResult,
  UseThreadworksMutationsResult,
} from '@mixtape/core/types/threadworksTypes';
import type { FetchFeedOptions } from '@mixtape/api/clients/threadworks/threadworksApi';
import * as threadworksApi from '@mixtape/api/clients/threadworks/threadworksApi';

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const threadworksQueryKeys = {
  all: ['threadworks'] as const,
  lists: () => [...threadworksQueryKeys.all, 'list'] as const,
  list: (groupSlug?: string, options?: FetchForumsOptions) =>
    [...threadworksQueryKeys.lists(), { groupSlug, options }] as const,
  details: () => [...threadworksQueryKeys.all, 'detail'] as const,
  detail: (forumSlug: string) => [...threadworksQueryKeys.details(), forumSlug] as const,
  discussions: (forumSlug: string) => [...threadworksQueryKeys.detail(forumSlug), 'discussions'] as const,
  discussionsList: (forumSlug: string, options?: FetchDiscussionsOptions) =>
    [...threadworksQueryKeys.discussions(forumSlug), options] as const,
  discussion: (forumSlug: string, discussionSlug: string) =>
    [...threadworksQueryKeys.discussions(forumSlug), discussionSlug] as const,
  posts: (forumSlug: string, discussionSlug: string) =>
    [...threadworksQueryKeys.discussion(forumSlug, discussionSlug), 'posts'] as const,
  feed: (forumSlug: string, options?: FetchFeedOptions) =>
    [...threadworksQueryKeys.detail(forumSlug), 'feed', options] as const,
  feedPosts: (forumSlug: string) => [...threadworksQueryKeys.detail(forumSlug), 'feed-posts'] as const,
  feedPost: (forumSlug: string, feedPostId: string) =>
    [...threadworksQueryKeys.feedPosts(forumSlug), feedPostId] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Fetch all forums (optionally scoped to a group)
 */
export const useThreadworks = (
  groupSlug?: string,
  options: FetchForumsOptions = {}
): UseThreadworksResult => {
  const {
    data: forums = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: threadworksQueryKeys.list(groupSlug, options),
    queryFn: () => threadworksApi.fetchForums(groupSlug, options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  return {
    forums,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Fetch a single forum with its discussions
 */
export const useForum = (
  forumSlug: string | null,
  groupSlug?: string
): UseForumResult => {
  const {
    data: forum = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: threadworksQueryKeys.detail(forumSlug || ''),
    queryFn: () => threadworksApi.fetchForum(forumSlug!, groupSlug),
    enabled: !!forumSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    forum,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Fetch discussions within a forum
 */
export const useDiscussions = (
  forumSlug: string | null,
  groupSlug?: string,
  options: FetchDiscussionsOptions = {}
) => {
  const {
    data: discussions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: threadworksQueryKeys.discussionsList(forumSlug || '', options),
    queryFn: () => threadworksApi.fetchDiscussions(forumSlug!, groupSlug, options),
    enabled: !!forumSlug,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    discussions,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Fetch a single discussion with all its posts
 */
export const useDiscussion = (
  forumSlug: string | null,
  discussionSlug: string | null,
  groupSlug?: string
): UseDiscussionResult => {
  const {
    data: discussion = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: threadworksQueryKeys.discussion(forumSlug || '', discussionSlug || ''),
    queryFn: () => threadworksApi.fetchDiscussion(forumSlug!, discussionSlug!, groupSlug),
    enabled: !!forumSlug && !!discussionSlug,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  return {
    discussion,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Mutations for creating/updating/deleting forums and discussions
 */
export const useThreadworksMutations = (
  groupSlug?: string
): UseThreadworksMutationsResult => {
  const queryClient = useQueryClient();

  // Create forum mutation
  const createForumMutation = useMutation({
    mutationFn: (data: CreateForumData) => threadworksApi.createForum(data, groupSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.list(groupSlug) });
    },
  });

  // Update forum mutation
  const updateForumMutation = useMutation({
    mutationFn: ({ forumSlug, data }: { forumSlug: string; data: UpdateForumData }) =>
      threadworksApi.updateForum(forumSlug, data, groupSlug),
    onSuccess: (_, { forumSlug }) => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.detail(forumSlug) });
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.lists() });
    },
  });

  // Delete forum mutation
  const deleteForumMutation = useMutation({
    mutationFn: (forumSlug: string) => threadworksApi.deleteForum(forumSlug, groupSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.lists() });
    },
  });

  // Create discussion mutation
  const createDiscussionMutation = useMutation({
    mutationFn: ({ forumSlug, data }: { forumSlug: string; data: CreateDiscussionData }) =>
      threadworksApi.createDiscussion(forumSlug, data, groupSlug),
    onSuccess: (_, { forumSlug }) => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.discussions(forumSlug) });
    },
  });

  // Update discussion mutation
  const updateDiscussionMutation = useMutation({
    mutationFn: ({
      forumSlug,
      discussionSlug,
      data,
    }: {
      forumSlug: string;
      discussionSlug: string;
      data: UpdateDiscussionData;
    }) => threadworksApi.updateDiscussion(forumSlug, discussionSlug, data, groupSlug),
    onSuccess: (_, { forumSlug, discussionSlug }) => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.discussion(forumSlug, discussionSlug) });
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.discussions(forumSlug) });
    },
  });

  // Delete discussion mutation
  const deleteDiscussionMutation = useMutation({
    mutationFn: ({ forumSlug, discussionSlug }: { forumSlug: string; discussionSlug: string }) =>
      threadworksApi.deleteDiscussion(forumSlug, discussionSlug, groupSlug),
    onSuccess: (_, { forumSlug }) => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.discussions(forumSlug) });
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: ({
      forumSlug,
      discussionSlug,
      data,
    }: {
      forumSlug: string;
      discussionSlug: string;
      data: CreatePostData;
    }) => threadworksApi.createPost(forumSlug, discussionSlug, data, groupSlug),
    onSuccess: (_, { forumSlug, discussionSlug }) => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.discussion(forumSlug, discussionSlug) });
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.posts(forumSlug, discussionSlug) });
    },
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: ({
      forumSlug,
      discussionSlug,
      postId,
      data,
    }: {
      forumSlug: string;
      discussionSlug: string;
      postId: string;
      data: Partial<CreatePostData>;
    }) => threadworksApi.updatePost(forumSlug, discussionSlug, postId, data, groupSlug),
    onSuccess: (_, { forumSlug, discussionSlug }) => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.discussion(forumSlug, discussionSlug) });
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: ({
      forumSlug,
      discussionSlug,
      postId,
    }: {
      forumSlug: string;
      discussionSlug: string;
      postId: string;
    }) => threadworksApi.deletePost(forumSlug, discussionSlug, postId, groupSlug),
    onSuccess: (_, { forumSlug, discussionSlug }) => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.discussion(forumSlug, discussionSlug) });
    },
  });

  return {
    createForum: createForumMutation.mutateAsync,
    updateForum: (forumSlug, data) => updateForumMutation.mutateAsync({ forumSlug, data }),
    deleteForum: deleteForumMutation.mutateAsync,
    createDiscussion: (forumSlug, data) => createDiscussionMutation.mutateAsync({ forumSlug, data }),
    updateDiscussion: (forumSlug, discussionSlug, data) =>
      updateDiscussionMutation.mutateAsync({ forumSlug, discussionSlug, data }),
    deleteDiscussion: (forumSlug, discussionSlug) =>
      deleteDiscussionMutation.mutateAsync({ forumSlug, discussionSlug }),
    createPost: (forumSlug, discussionSlug, data) =>
      createPostMutation.mutateAsync({ forumSlug, discussionSlug, data }),
    updatePost: (forumSlug, discussionSlug, postId, data) =>
      updatePostMutation.mutateAsync({ forumSlug, discussionSlug, postId, data }),
    deletePost: (forumSlug, discussionSlug, postId) =>
      deletePostMutation.mutateAsync({ forumSlug, discussionSlug, postId }),
    isCreatingForum: createForumMutation.isPending,
    isCreatingDiscussion: createDiscussionMutation.isPending,
    isCreatingPost: createPostMutation.isPending,
    error: (
      createForumMutation.error ||
      createDiscussionMutation.error ||
      createPostMutation.error
    ) as Error | null,
  };
};

/**
 * Utility hook to invalidate threadworks queries
 */
export const useInvalidateThreadworks = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAllThreadworks: () =>
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.all }),
    invalidateForums: (groupSlug?: string) =>
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.list(groupSlug) }),
    invalidateForum: (forumSlug: string) =>
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.detail(forumSlug) }),
    invalidateDiscussions: (forumSlug: string) =>
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.discussions(forumSlug) }),
    invalidateDiscussion: (forumSlug: string, discussionSlug: string) =>
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.discussion(forumSlug, discussionSlug) }),
    invalidateFeed: (forumSlug: string) =>
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.feed(forumSlug) }),
    invalidateFeedPosts: (forumSlug: string) =>
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.feedPosts(forumSlug) }),
  };
};

// ============================================================================
// UNIFIED FEED
// ============================================================================

export const useForumFeed = (
  forumSlug: string | null,
  groupSlug?: string,
  options: FetchFeedOptions = {}
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: threadworksQueryKeys.feed(forumSlug || '', options),
    queryFn: () => threadworksApi.fetchForumFeed(forumSlug!, groupSlug, options),
    enabled: !!forumSlug,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    feed: data?.results ?? [],
    count: data?.count ?? 0,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

// ============================================================================
// FEED POSTS
// ============================================================================

export const useFeedPosts = (forumSlug: string | null, groupSlug?: string) => {
  const { data: feedPosts = [], isLoading, error, refetch } = useQuery({
    queryKey: threadworksQueryKeys.feedPosts(forumSlug || ''),
    queryFn: () => threadworksApi.fetchFeedPosts(forumSlug!, groupSlug),
    enabled: !!forumSlug,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  return { feedPosts, isLoading, error: error as Error | null, refetch };
};

export const useFeedPost = (forumSlug: string | null, feedPostId: string | null, groupSlug?: string) => {
  const { data: feedPost = null, isLoading, error, refetch } = useQuery({
    queryKey: threadworksQueryKeys.feedPost(forumSlug || '', feedPostId || ''),
    queryFn: () => threadworksApi.fetchFeedPost(forumSlug!, feedPostId!, groupSlug),
    enabled: !!forumSlug && !!feedPostId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  return { feedPost, isLoading, error: error as Error | null, refetch };
};

export const useFeedPostMutations = (forumSlug: string, groupSlug?: string) => {
  const queryClient = useQueryClient();

  const invalidateFeed = () => {
    queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.feed(forumSlug) });
    queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.feedPosts(forumSlug) });
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateFeedPostData) => threadworksApi.createFeedPost(forumSlug, data, groupSlug),
    onSuccess: invalidateFeed,
  });

  const uploadImageMutation = useMutation({
    mutationFn: (vars: { file: File; title?: string; creation_signal?: string }) =>
      threadworksApi.uploadFeedPostImage(forumSlug, vars.file, {
        title: vars.title,
        creation_signal: vars.creation_signal,
        groupSlug,
      }),
    onSuccess: invalidateFeed,
  });

  const uploadVoiceMutation = useMutation({
    mutationFn: (vars: { blob: Blob; title?: string; creation_signal?: string }) =>
      threadworksApi.uploadFeedPostVoice(forumSlug, vars.blob, {
        title: vars.title,
        creation_signal: vars.creation_signal,
        groupSlug,
      }),
    onSuccess: invalidateFeed,
  });

  const updateMutation = useMutation({
    mutationFn: ({ feedPostId, data }: { feedPostId: string; data: UpdateFeedPostData }) =>
      threadworksApi.updateFeedPost(forumSlug, feedPostId, data, groupSlug),
    onSuccess: (_, { feedPostId }) => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.feedPost(forumSlug, feedPostId) });
      invalidateFeed();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (feedPostId: string) => threadworksApi.deleteFeedPost(forumSlug, feedPostId, groupSlug),
    onSuccess: invalidateFeed,
  });

  const createReplyMutation = useMutation({
    mutationFn: (vars: { feedPostId: string; data: CreatePostData }) =>
      threadworksApi.createFeedPostReply(forumSlug, vars.feedPostId, vars.data, groupSlug),
    onSuccess: (_, { feedPostId }) => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.feedPost(forumSlug, feedPostId) });
      invalidateFeed();
    },
  });

  return {
    createFeedPost: createMutation.mutateAsync,
    uploadImage: uploadImageMutation.mutateAsync,
    uploadVoice: uploadVoiceMutation.mutateAsync,
    updateFeedPost: (feedPostId: string, data: UpdateFeedPostData) =>
      updateMutation.mutateAsync({ feedPostId, data }),
    deleteFeedPost: deleteMutation.mutateAsync,
    createReply: (feedPostId: string, data: CreatePostData) =>
      createReplyMutation.mutateAsync({ feedPostId, data }),
    isCreating: createMutation.isPending || uploadImageMutation.isPending || uploadVoiceMutation.isPending,
    isCreatingReply: createReplyMutation.isPending,
  };
};

// ============================================================================
// DISCUSSION SUMMARY MUTATIONS
// ============================================================================

export const useDiscussionSummaryMutations = (
  forumSlug: string,
  discussionSlug: string,
  groupSlug?: string
) => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: threadworksQueryKeys.discussion(forumSlug, discussionSlug),
    });
  };

  const approveMutation = useMutation({
    mutationFn: () => threadworksApi.approveSummary(forumSlug, discussionSlug, groupSlug),
    onSuccess: invalidate,
  });

  const dismissMutation = useMutation({
    mutationFn: () => threadworksApi.dismissSummary(forumSlug, discussionSlug, groupSlug),
    onSuccess: invalidate,
  });

  return {
    approveSummary: approveMutation.mutateAsync,
    dismissSummary: dismissMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    isDismissing: dismissMutation.isPending,
  };
};
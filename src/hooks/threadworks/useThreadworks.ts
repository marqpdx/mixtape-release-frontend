// src/hooks/useThreadworks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import {
  Forum,
  Discussion,
  Post,
  CreateForumData,
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
  ThreadworksListResponse,
} from '@/types/threadworksTypes';

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
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch forums (optionally for a specific group)
 */
const fetchForums = async (
  groupSlug?: string,
  options: FetchForumsOptions = {}
): Promise<Forum[]> => {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks`
    : '/api/threadworks';
  const url = `${endpoint}${queryString ? `?${queryString}` : ''}`;

  const response = await axiosInstance.get<ThreadworksListResponse<Forum>>(url);
  return response.data.results || [];
};

/**
 * Fetch a single forum
 */
const fetchForum = async (forumSlug: string, groupSlug?: string): Promise<Forum> => {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}`
    : `/api/threadworks/${forumSlug}`;

  const response = await axiosInstance.get<Forum>(endpoint);
  return response.data;
};

/**
 * Create a new forum
 */
const createForumAPI = async (
  data: CreateForumData,
  groupSlug?: string
): Promise<Forum> => {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks`
    : '/api/threadworks';

  const response = await axiosInstance.post<Forum>(endpoint, data);
  return response.data;
};

/**
 * Update a forum
 */
const updateForumAPI = async (
  forumSlug: string,
  data: UpdateForumData,
  groupSlug?: string
): Promise<Forum> => {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}`
    : `/api/threadworks/${forumSlug}`;

  const response = await axiosInstance.patch<Forum>(endpoint, data);
  return response.data;
};

/**
 * Delete a forum
 */
const deleteForumAPI = async (forumSlug: string, groupSlug?: string): Promise<void> => {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}`
    : `/api/threadworks/${forumSlug}`;

  await axiosInstance.delete(endpoint);
};

/**
 * Fetch discussions within a forum
 */
const fetchDiscussions = async (
  forumSlug: string,
  groupSlug?: string,
  options: FetchDiscussionsOptions = {}
): Promise<Discussion[]> => {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions`
    : `/api/threadworks/${forumSlug}/discussions`;
  const url = `${endpoint}${queryString ? `?${queryString}` : ''}`;

  const response = await axiosInstance.get<ThreadworksListResponse<Discussion>>(url);
  return response.data.results || [];
};

/**
 * Fetch a single discussion
 */
const fetchDiscussion = async (
  forumSlug: string,
  discussionSlug: string,
  groupSlug?: string
): Promise<Discussion> => {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions/${discussionSlug}`
    : `/api/threadworks/${forumSlug}/discussions/${discussionSlug}`;

  const response = await axiosInstance.get<Discussion>(endpoint);
  return response.data;
};

/**
 * Create a new discussion in a forum
 */
const createDiscussionAPI = async (
  forumSlug: string,
  data: CreateDiscussionData,
  groupSlug?: string
): Promise<Discussion> => {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions`
    : `/api/threadworks/${forumSlug}/discussions`;

  const response = await axiosInstance.post<Discussion>(endpoint, data);
  return response.data;
};

/**
 * Update a discussion
 */
const updateDiscussionAPI = async (
  forumSlug: string,
  discussionSlug: string,
  data: UpdateDiscussionData,
  groupSlug?: string
): Promise<Discussion> => {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions/${discussionSlug}`
    : `/api/threadworks/${forumSlug}/discussions/${discussionSlug}`;

  const response = await axiosInstance.patch<Discussion>(endpoint, data);
  return response.data;
};

/**
 * Delete a discussion
 */
const deleteDiscussionAPI = async (
  forumSlug: string,
  discussionSlug: string,
  groupSlug?: string
): Promise<void> => {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions/${discussionSlug}`
    : `/api/threadworks/${forumSlug}/discussions/${discussionSlug}`;

  await axiosInstance.delete(endpoint);
};

/**
 * Create a new post in a discussion
 */
const createPostAPI = async (
  forumSlug: string,
  discussionSlug: string,
  data: CreatePostData,
  groupSlug?: string
): Promise<Post> => {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions/${discussionSlug}/posts`
    : `/api/threadworks/${forumSlug}/discussions/${discussionSlug}/posts`;

  const response = await axiosInstance.post<Post>(endpoint, data);
  return response.data;
};

/**
 * Update a post
 */
const updatePostAPI = async (
  forumSlug: string,
  discussionSlug: string,
  postId: string,
  data: Partial<CreatePostData>,
  groupSlug?: string
): Promise<Post> => {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions/${discussionSlug}/posts/${postId}`
    : `/api/threadworks/${forumSlug}/discussions/${discussionSlug}/posts/${postId}`;

  const response = await axiosInstance.patch<Post>(endpoint, data);
  return response.data;
};

/**
 * Delete a post
 */
const deletePostAPI = async (
  forumSlug: string,
  discussionSlug: string,
  postId: string,
  groupSlug?: string
): Promise<void> => {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions/${discussionSlug}/posts/${postId}`
    : `/api/threadworks/${forumSlug}/discussions/${discussionSlug}/posts/${postId}`;

  await axiosInstance.delete(endpoint);
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
    queryFn: () => fetchForums(groupSlug, options),
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
    queryFn: () => fetchForum(forumSlug!, groupSlug),
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
    queryFn: () => fetchDiscussions(forumSlug!, groupSlug, options),
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
    queryFn: () => fetchDiscussion(forumSlug!, discussionSlug!, groupSlug),
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
    mutationFn: (data: CreateForumData) => createForumAPI(data, groupSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.list(groupSlug) });
    },
  });

  // Update forum mutation
  const updateForumMutation = useMutation({
    mutationFn: ({ forumSlug, data }: { forumSlug: string; data: UpdateForumData }) =>
      updateForumAPI(forumSlug, data, groupSlug),
    onSuccess: (_, { forumSlug }) => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.detail(forumSlug) });
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.lists() });
    },
  });

  // Delete forum mutation
  const deleteForumMutation = useMutation({
    mutationFn: (forumSlug: string) => deleteForumAPI(forumSlug, groupSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.lists() });
    },
  });

  // Create discussion mutation
  const createDiscussionMutation = useMutation({
    mutationFn: ({ forumSlug, data }: { forumSlug: string; data: CreateDiscussionData }) =>
      createDiscussionAPI(forumSlug, data, groupSlug),
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
    }) => updateDiscussionAPI(forumSlug, discussionSlug, data, groupSlug),
    onSuccess: (_, { forumSlug, discussionSlug }) => {
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.discussion(forumSlug, discussionSlug) });
      queryClient.invalidateQueries({ queryKey: threadworksQueryKeys.discussions(forumSlug) });
    },
  });

  // Delete discussion mutation
  const deleteDiscussionMutation = useMutation({
    mutationFn: ({ forumSlug, discussionSlug }: { forumSlug: string; discussionSlug: string }) =>
      deleteDiscussionAPI(forumSlug, discussionSlug, groupSlug),
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
    }) => createPostAPI(forumSlug, discussionSlug, data, groupSlug),
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
    }) => updatePostAPI(forumSlug, discussionSlug, postId, data, groupSlug),
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
    }) => deletePostAPI(forumSlug, discussionSlug, postId, groupSlug),
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
  };
};
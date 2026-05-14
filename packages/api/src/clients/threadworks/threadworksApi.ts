// src/lib/threadworks/threadworksApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import {
  Forum,
  Discussion,
  Post,
  CreateForumData,
  UpdateForumData,
  UpdateForumAudienceData,
  CreateDiscussionData,
  UpdateDiscussionData,
  CreatePostData,
  FetchForumsOptions,
  FetchDiscussionsOptions,
  ThreadworksListResponse,
} from '@mixtape/core/types/threadworksTypes';

// ============================================================================
// FORUMS
// ============================================================================

/**
 * Fetch forums (optionally for a specific sponsor)
 */
export async function fetchForums(
  groupSlug?: string,
  options: FetchForumsOptions = {}
): Promise<Forum[]> {
  const params = new URLSearchParams();

  // Add sponsor params if groupSlug is provided
  if (groupSlug) {
    params.append('sponsor_type', 'group');
    params.append('sponsor_slug', groupSlug);
  }

  // Add other options
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const url = `/api/threadworks/forums${queryString ? `?${queryString}` : ''}`;

  const response = await axiosInstance.get<ThreadworksListResponse<Forum>>(url);
  // Handle both paginated ({ results: [...] }) and non-paginated ([...]) responses
  return response.data.results || response.data || [];
}

/**
 * Fetch a single forum
 */
export async function fetchForum(forumSlug: string, groupSlug?: string): Promise<Forum> {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}`
    : `/api/threadworks/${forumSlug}`;

  const response = await axiosInstance.get<Forum>(endpoint);
  return response.data;
}

/**
 * Create a new forum
 */
export async function createForum(
  data: CreateForumData,
  groupSlug?: string
): Promise<Forum> {
  // Use the list endpoint for creation
  const endpoint = '/api/threadworks/';

  // Add sponsor info if creating for a group
  const payload = groupSlug
    ? { ...data, sponsor_type: 'group', sponsor_slug: groupSlug }
    : data;

  const response = await axiosInstance.post<Forum>(endpoint, payload);
  return response.data;
}

/**
 * Update audience for a group-scoped forum
 */
export async function updateForumAudience(
  forumSlug: string,
  data: UpdateForumAudienceData,
  groupSlug: string
): Promise<Forum> {
  const endpoint = `/api/groups/${groupSlug}/threadworks/${forumSlug}/audience`;
  const response = await axiosInstance.patch<Forum>(endpoint, data);
  return response.data;
}

/**
 * Update a forum
 */
export async function updateForum(
  forumSlug: string,
  data: UpdateForumData,
  groupSlug?: string
): Promise<Forum> {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}`
    : `/api/threadworks/${forumSlug}`;

  const response = await axiosInstance.patch<Forum>(endpoint, data);
  return response.data;
}

/**
 * Delete a forum
 */
export async function deleteForum(forumSlug: string, groupSlug?: string): Promise<void> {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}`
    : `/api/threadworks/${forumSlug}`;

  await axiosInstance.delete(endpoint);
}

// ============================================================================
// DISCUSSIONS
// ============================================================================

/**
 * Fetch discussions within a forum
 */
export async function fetchDiscussions(
  forumSlug: string,
  groupSlug?: string,
  options: FetchDiscussionsOptions = {}
): Promise<Discussion[]> {
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
  // Handle both paginated ({ results: [...] }) and non-paginated ([...]) responses
  return response.data.results || response.data || [];
}

/**
 * Fetch a single discussion
 */
export async function fetchDiscussion(
  forumSlug: string,
  discussionSlug: string,
  groupSlug?: string
): Promise<Discussion> {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions/${discussionSlug}`
    : `/api/threadworks/${forumSlug}/discussions/${discussionSlug}`;

  const response = await axiosInstance.get<Discussion>(endpoint);
  return response.data;
}

/**
 * Create a new discussion in a forum
 */
export async function createDiscussion(
  forumSlug: string,
  data: CreateDiscussionData,
  groupSlug?: string
): Promise<Discussion> {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions`
    : `/api/threadworks/${forumSlug}/discussions`;

  const response = await axiosInstance.post<Discussion>(endpoint, data);
  return response.data;
}

/**
 * Update a discussion
 */
export async function updateDiscussion(
  forumSlug: string,
  discussionSlug: string,
  data: UpdateDiscussionData,
  groupSlug?: string
): Promise<Discussion> {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions/${discussionSlug}`
    : `/api/threadworks/${forumSlug}/discussions/${discussionSlug}`;

  const response = await axiosInstance.patch<Discussion>(endpoint, data);
  return response.data;
}

/**
 * Delete a discussion
 */
export async function deleteDiscussion(
  forumSlug: string,
  discussionSlug: string,
  groupSlug?: string
): Promise<void> {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions/${discussionSlug}`
    : `/api/threadworks/${forumSlug}/discussions/${discussionSlug}`;

  await axiosInstance.delete(endpoint);
}

// ============================================================================
// POSTS
// ============================================================================

/**
 * Create a new post in a discussion
 */
export async function createPost(
  forumSlug: string,
  discussionSlug: string,
  data: CreatePostData,
  groupSlug?: string
): Promise<Post> {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions/${discussionSlug}/posts`
    : `/api/threadworks/${forumSlug}/discussions/${discussionSlug}/posts`;

  const response = await axiosInstance.post<Post>(endpoint, data);
  return response.data;
}

/**
 * Update a post
 */
export async function updatePost(
  forumSlug: string,
  discussionSlug: string,
  postId: string,
  data: Partial<CreatePostData>,
  groupSlug?: string
): Promise<Post> {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions/${discussionSlug}/posts/${postId}`
    : `/api/threadworks/${forumSlug}/discussions/${discussionSlug}/posts/${postId}`;

  const response = await axiosInstance.patch<Post>(endpoint, data);
  return response.data;
}

/**
 * Delete a post
 */
export async function deletePost(
  forumSlug: string,
  discussionSlug: string,
  postId: string,
  groupSlug?: string
): Promise<void> {
  const endpoint = groupSlug
    ? `/api/groups/${groupSlug}/threadworks/${forumSlug}/discussions/${discussionSlug}/posts/${postId}`
    : `/api/threadworks/${forumSlug}/discussions/${discussionSlug}/posts/${postId}`;

  await axiosInstance.delete(endpoint);
}

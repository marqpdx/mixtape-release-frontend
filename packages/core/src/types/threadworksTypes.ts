// src/content/threadworksTypes.ts

import { IsoDateString } from "./groupTypes";


// ---------- Enums ----------

export type ForumVisibility = 'public' | 'members' | 'group';
export type DiscussionStatus = 'active' | 'archived' | 'pinned';

// ---------- User (embedded in forum/discussion data) ----------

export interface ThreadworksUser {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
}

// ---------- Core Models ----------

export interface Post {
  id: string;
  author: ThreadworksUser;
  content: string;
  created_at: IsoDateString;
  updated_at?: IsoDateString;
  is_edited: boolean;
}

export interface Discussion {
  id: string;
  slug: string;
  title: string;
  description?: string;
  created_at: IsoDateString;
  updated_at: IsoDateString;
  created_by: ThreadworksUser;
  posts: Post[];
  post_count: number;
  status: DiscussionStatus;
  last_post?: Post;
}

export interface Forum {
  id: string;
  slug: string;
  title: string;
  description: string;
  visibility: ForumVisibility;
  created_at: IsoDateString;
  updated_at: IsoDateString;
  created_by: ThreadworksUser;
  discussions: Discussion[];
  discussion_count: number;
  recent_participants: ThreadworksUser[];
  last_activity?: IsoDateString;
}

// ---------- API Response Types ----------

export interface ThreadworksListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ForumsResponse extends ThreadworksListResponse<Forum> {}

export interface DiscussionsResponse extends ThreadworksListResponse<Discussion> {}

// ---------- Form Data Types ----------

export interface CreateForumData {
  title: string;
  description: string;
  visibility: ForumVisibility;
}

export interface UpdateForumData extends Partial<CreateForumData> {}

export interface CreateDiscussionData {
  title: string;
  description?: string;
  content: string; // Initial post content
}

export interface UpdateDiscussionData extends Partial<CreateDiscussionData> {}

export interface CreatePostData {
  content: string;
}

// ---------- Hook Return Types ----------

export interface UseThreadworksResult {
  forums: Forum[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseForumResult {
  forum: Forum | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseDiscussionResult {
  discussion: Discussion | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseThreadworksMutationsResult {
  createForum: (data: CreateForumData) => Promise<Forum>;
  updateForum: (forumSlug: string, data: UpdateForumData) => Promise<Forum>;
  deleteForum: (forumSlug: string) => Promise<void>;
  createDiscussion: (forumSlug: string, data: CreateDiscussionData) => Promise<Discussion>;
  updateDiscussion: (forumSlug: string, discussionSlug: string, data: UpdateDiscussionData) => Promise<Discussion>;
  deleteDiscussion: (forumSlug: string, discussionSlug: string) => Promise<void>;
  createPost: (forumSlug: string, discussionSlug: string, data: CreatePostData) => Promise<Post>;
  updatePost: (forumSlug: string, discussionSlug: string, postId: string, data: Partial<CreatePostData>) => Promise<Post>;
  deletePost: (forumSlug: string, discussionSlug: string, postId: string) => Promise<void>;
  isCreatingForum: boolean;
  isCreatingDiscussion: boolean;
  isCreatingPost: boolean;
  error: Error | null;
}

// ---------- Query Options ----------

export interface FetchForumsOptions {
  visibility?: ForumVisibility;
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}

export interface FetchDiscussionsOptions {
  status?: DiscussionStatus;
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}

// ---------- Utility Functions ----------

/**
 * Get display name for a user (with fallbacks)
 */
export const getThreadworksUserDisplayName = (user: ThreadworksUser): string => {
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  return user.username || user.id;
};

/**
 * Get user's initials for avatar fallback
 */
export const getThreadworksUserInitials = (user: ThreadworksUser): string => {
  const display = getThreadworksUserDisplayName(user);
  return display
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Check if forum is public
 */
export const isForumPublic = (forum: Forum): boolean => {
  return forum.visibility === 'public';
};

/**
 * Check if discussion is pinned
 */
export const isDiscussionPinned = (discussion: Discussion): boolean => {
  return discussion.status === 'pinned';
};

/**
 * Check if discussion is archived
 */
export const isDiscussionArchived = (discussion: Discussion): boolean => {
  return discussion.status === 'archived';
};

/**
 * Get human-readable visibility label for forums
 */
export const getForumVisibilityLabel = (visibility: ForumVisibility): string => {
  const labels: Record<ForumVisibility, string> = {
    public: 'Public',
    members: 'Members Only',
    group: 'Group Only',
  };
  return labels[visibility] || visibility;
};

/**
 * Get human-readable status label for discussions
 */
export const getDiscussionStatusLabel = (status: DiscussionStatus): string => {
  const labels: Record<DiscussionStatus, string> = {
    active: 'Active',
    archived: 'Archived',
    pinned: 'Pinned',
  };
  return labels[status] || status;
};

/**
 * Format post count for display in threadworks
 */
export const formatThreadPostCount = (count: number): string => {
  return `${count} ${count === 1 ? 'post' : 'posts'}`;
};

/**
 * Format discussion count for display
 */
export const formatDiscussionCount = (count: number): string => {
  return `${count} ${count === 1 ? 'discussion' : 'discussions'}`;
};
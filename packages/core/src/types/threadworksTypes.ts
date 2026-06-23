// src/content/threadworksTypes.ts

import { IsoDateString } from "./groupTypes";


// ---------- Enums ----------

export type ForumVisibility = 'public' | 'members' | 'group';
export type DiscussionStatus = 'active' | 'archived' | 'pinned';
export type ForumAudienceType = 'all_members' | 'subset';
export type VisibilityScope = 'circle' | 'group' | 'crossroads';
export type CreationSignal = 'low' | 'medium' | 'high';
export type FeedPostKind = 'text' | 'image' | 'link' | 'voice';

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
  author: ThreadworksUser | null;
  content: string;
  created_at: IsoDateString;
  updated_at?: IsoDateString;
  is_edited: boolean;
  parent_id: string | null;
  // Phase 1 (ADR-0047)
  discussion_id?: string | null;
  feed_post_id?: string | null;
  quoted_post_id?: string | null;
  quoted_passage?: string;
  is_author_distinguished?: boolean;
}

export interface FeedPost {
  id: string;
  author: ThreadworksUser | null;
  title: string;
  kind: FeedPostKind;
  body_text: string;
  body_json: Record<string, unknown> | null;
  image_file: string | null;
  audio_file: string | null;
  link_url: string;
  link_preview: { title?: string; description?: string; image?: string; url?: string } | null;
  visibility_scope: VisibilityScope;
  memory_value_score: number;
  timeliness_date: string | null;
  creation_signal: CreationSignal | null;
  is_deleted: boolean;
  created_at: IsoDateString;
  updated_at: IsoDateString;
  post_count: number;
  posts?: Post[];
}

export type FeedItem =
  | { type: 'discussion'; data: Discussion; created_at: IsoDateString }
  | { type: 'feed_post'; data: FeedPost; created_at: IsoDateString };

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
  pinned_nav_name?: string;
  last_post?: Post;
  // Phase 1 (ADR-0047)
  visibility_scope?: VisibilityScope;
  memory_value_score?: number;
  timeliness_date?: string | null;
  creation_signal?: CreationSignal | null;
  summary?: string | null;
  summary_pending?: string | null;
  summary_pending_delta?: number | null;
  summary_pending_substantive?: boolean | null;
  // Phase 3 (D13)
  resolution_post_id?: string | null;
  resolution_post?: Post | null;
}

export interface ForumAudienceMember {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
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
  feed_post_count?: number;
  recent_participants: ThreadworksUser[];
  last_activity?: IsoDateString;
  audience_type: ForumAudienceType;
  auto_add_new_members: boolean;
  audience_member_count?: number | null;
  audience_members?: ForumAudienceMember[];
  is_contained_circle?: boolean;
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
  audience_type?: ForumAudienceType;
  auto_add_new_members?: boolean;
  member_ids?: string[];
}

export interface UpdateForumData extends Partial<CreateForumData> {}

export interface UpdateForumAudienceData {
  audience_type?: ForumAudienceType;
  auto_add_new_members?: boolean;
  member_ids?: string[];
}

export interface CreateDiscussionData {
  title: string;
  description?: string;
  content: string;
  visibility_scope?: VisibilityScope;
  creation_signal?: CreationSignal;
  timeliness_date?: string;
}

export interface UpdateDiscussionData extends Partial<CreateDiscussionData> {}

export interface CreatePostData {
  content: string;
  quoted_post_id?: string;
  quoted_passage?: string;
}

export interface CreateFeedPostData {
  title?: string;
  kind: FeedPostKind;
  body_text?: string;
  body_json?: Record<string, unknown>;
  link_url?: string;
  visibility_scope?: VisibilityScope;
  timeliness_date?: string;
  creation_signal?: CreationSignal;
}

export interface UpdateFeedPostData extends Partial<Omit<CreateFeedPostData, 'kind'>> {}

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
  resolveDiscussion: (forumSlug: string, discussionSlug: string, postId: string) => Promise<Discussion>;
  unresolveDiscussion: (forumSlug: string, discussionSlug: string) => Promise<Discussion>;
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
export const getThreadworksUserDisplayName = (user: ThreadworksUser | null): string => {
  if (!user) return "Deleted member";
  if (user.first_name || user.last_name) {
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
  }
  return user.username || user.id;
};

/**
 * Get user's initials for avatar fallback
 */
export const getThreadworksUserInitials = (user: ThreadworksUser | null): string => {
  if (!user) return "?";
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
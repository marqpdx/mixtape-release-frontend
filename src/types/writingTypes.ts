/**
 * Writing content types for Mixtape
 * Corresponds to WritingPiece, WritingWorkingCopy, WritingVersion, WritingPlacement, WritingComment models
 */

export type WritingKind = 'post' | 'article' | 'dispatch' | 'forum' | 'announcement' | 'almanac' | 'page' | 'other'

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export type PlacementChannel = 'feed' | 'lantern' | 'forum' | 'dispatch' | 'almanac' | 'page'

export type PlacementVisibility = 'public' | 'members' | 'private' | 'scheduled'

/**
 * Main WritingPiece model
 */
export interface WritingPiece {
  id: string // UUID
  slug: string
  title: string
  excerpt: string

  // Content
  body_json: Record<string, any> // TipTap/ProseMirror content
  writing_kind: WritingKind
  status: ContentStatus
  is_empty: boolean

  // Metadata
  canonical_url?: string
  reading_time: number | null

  // Versioning
  current_version_no: number

  // Scheduling
  scheduled_for?: string | null // ISO datetime

  // Group pinning
  pinned_at?: string | null // ISO datetime
  pinned_rank?: number | null

  // Engagement
  allow_comments: boolean
  view_count: number
  comment_count: number

  // Sponsorship (group/user ownership)
  sponsor_content_type: string // 'group' or 'user'
  sponsor_object_id: string // UUID

  // Author info
  author: {
    id: string
    first_name: string
    last_name: string
    email: string
  }

  // Timestamps
  created_at: string // ISO datetime
  updated_at: string // ISO datetime
  published_at?: string | null // ISO datetime

  // Computed properties
  is_draft?: boolean
  is_published?: boolean
  is_announcement?: boolean
  is_canonical_kind?: boolean
}







/**
 * WritingWorkingCopy - per-user autosave buffer (full version from list endpoint)
 */
export interface WritingWorkingCopy {
  id: string | number
  piece: {
    id: string
    slug: string
    title: string
    writing_kind: WritingKind
    status: ContentStatus
    created_at: string
    updated_at: string
    excerpt?: string
  }
  user: {
    id: string | number
    username: string
    email?: string
    first_name?: string
    last_name?: string
  }

  title: string
  excerpt: string
  body_json: Record<string, any>

  last_saved_at: string // ISO datetime
  auto_save_count: number
  client_session_id: string
}

/**
 * WritingWorkingCopyLight - lightweight response from GET /working-copy endpoint
 */
export interface WritingWorkingCopyLight {
  id: number
  piece: {
    id: string // UUID
    slug: string
    status: ContentStatus
    is_empty: boolean
  }
  body_json: Record<string, any>
  title: string
  excerpt: string
  last_saved_at: string
  auto_save_count: number
  client_session_id: string
}

/**
 * WritingVersion - immutable snapshot
 */
export interface WritingVersion {
  id: string // UUID
  piece_id: string

  version_no: number

  // Snapshot content
  body_json: Record<string, any>
  title: string
  excerpt: string

  changelog?: string
  created_at: string // ISO datetime
}

/**
 * WritingPlacement - distribution/routing for a piece
 */
export interface WritingPlacement {
  id: string // UUID
  piece_id: string

  // Destination (polymorphic)
  target_content_type: string
  target_object_id: string

  // Channel and visibility
  channel: PlacementChannel
  visibility: PlacementVisibility

  // Version behavior
  follow_updates: boolean
  locked_version_no?: number | null

  // Presentation
  is_excerpt: boolean
  fragment_selector?: Record<string, any> | null
  overrides?: {
    title_override?: string
    excerpt_override?: string
    cover_override?: string
    lantern_subject?: string
  }

  // Metadata
  placed_at: string // ISO datetime
  order: number
  is_pinned: boolean
}


export interface FlattenedPlacement {
  id: string
  piece_id: string
  piece_slug: string
  piece_title: string
  piece_body_json: any
  piece_status: string
  published_at: string
  pinned_at?: string | null
  author_name: string
  visibility: string
  is_pinned: boolean
  is_announcement: boolean
  order: number
  created_at: string
  updated_at: string
  display?: {
    title: string
    excerpt: string
    is_excerpt: boolean
    body_json: any
  }
}






/**
 * WritingComment - discussion on a piece
 */
export interface WritingComment {
  id: string // UUID
  piece_id: string
  author_id: string

  content: string
  parent_id?: string | null

  is_approved: boolean
  is_flagged: boolean

  created_at: string // ISO datetime
  updated_at: string // ISO datetime
}

/**
 * API request/response types
 */
export interface CreateWritingPieceRequest {
  title?: string
  excerpt?: string
  body_json: Record<string, any>
  writing_kind?: WritingKind
  status?: ContentStatus
  sponsor_content_type: string // 'group' or 'user'
  sponsor_object_id: string
  create_working_copy?: boolean
}

export interface UpdateWritingPieceRequest {
  title?: string
  excerpt?: string
  body_json?: Record<string, any>
  writing_kind?: WritingKind
  status?: ContentStatus
  scheduled_for?: string | null
  allow_comments?: boolean
}

export interface CreateWorkingCopyRequest {
  body_json?: Record<string, any>
  title?: string
  excerpt?: string
  client_session_id?: string
}

export interface PublishWritingPieceRequest {
  scheduled_for?: string | null // ISO datetime or null for immediate publish
}

// Helper for formatting
export const formatPostCount = (count: number): string => {
  if (count === 0) return 'No posts'
  if (count === 1) return '1 post'
  return `${count} posts`
}


export type Visibility = 'public' | 'members' | 'private' | 'scheduled';

export interface PlacementOptions {
  visibility?: Visibility;
  follow_updates?: boolean;
  locked_version_no?: number | null;
  is_excerpt?: boolean;
  fragment_selector?: any | null;
  overrides?: {
    title_override?: string;
    excerpt_override?: string;
    cover_override?: string;
    lantern_subject?: string;
  } | null;
  order?: number;
  is_pinned?: boolean;
}

export interface PublishDestinations {
  personal?: boolean;
  groups?: string[]; // slugs or UUIDs
  lantern?: boolean;
}

export interface PublishDestinations {
  personal?: boolean;
  groups?: string[]; // slugs or UUIDs
  lantern?: boolean;
}

export interface GroupOverridesMap {
  [groupIdOrSlug: string]: PlacementOptions;
}

export interface PublishAndPlacePayload {
  title?: string;
  body_json?: any;
  excerpt?: string;
  writing_kind?: string;
  scheduled_for?: string; // ISO8601
  canonical_url?: string;
  tags?: string[];
  destinations: PublishDestinations;
  placement_options?: PlacementOptions;
  group_overrides?: GroupOverridesMap;
}
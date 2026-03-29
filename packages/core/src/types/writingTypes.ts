/**
 * Writing content types for Mixtape
 * Corresponds to WritingPiece, WorkingDocument, WritingVersion, WritingPlacement, WritingComment models
 */

export type WritingKind = 'post' | 'article' | 'dispatch' | 'forum' | 'announcement' | 'almanac' | 'page' | 'other'

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived'

export type PlacementChannel = 'feed' | 'shelf' | 'lantern' | 'forum' | 'dispatch' | 'almanac' | 'page'

export type PlacementVisibility = 'public' | 'members' | 'unlisted' | 'private' | 'scheduled'

export type AddressedTo = 'public' | 'crossroads' | 'self'

/**
 * Main WritingPiece model
 */
export interface WritingSeries {
  id: string
  title: string
  slug: string
  phase_num: number | null
  subtitle: string | null
  group: string | null // group UUID
}

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
  addressed_to?: AddressedTo

  // Versioning
  current_version_no: number

  // Scheduling
  scheduled_for?: string | null // ISO datetime

  // Group pinning
  pinned_at?: string | null // ISO datetime
  pinned_rank?: number | null

  // Outline
  enable_outline?: boolean

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
  tags_list?: string[]
}

/** Returned by the detail endpoint (WritingPieceDetailSerializer) */
export interface WritingPieceDetail {
  id: string
  title: string
  slug: string
  body_json: Record<string, any>
  excerpt: string
  writing_kind: WritingKind
  enable_outline: boolean
  author_name: string
  author_avatar: string | null
  sponsor_name: string | null
  published_at: string | null
  reading_time: number | null
  view_count: number
  allow_comments: boolean
  canonical_url: string | null
  series: WritingSeries | null
  series_order: number | null
}

/** Returned by the catalog endpoint (WritingPieceCatalogSerializer) — no body_json */
export interface WritingPieceCatalogItem {
  id: string
  title: string
  slug: string
  excerpt: string
  writing_kind: WritingKind
  author_name: string
  published_at: string | null
  reading_time: number | null
  series: WritingSeries | null
  series_order: number | null
}







/**
 * WorkingDocument - per-user autosave buffer (full version from list endpoint)
 */
export interface WorkingDocument {
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
    tags_list?: string[]
    series_id?: string | null
    series_title?: string | null
    series_phase_num?: number | null
    series_order?: number | null
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

  // Collaboration fields
  is_collaborative: boolean
  collaborator_count: number
  collaborators: Array<{
    id: number
    user: {
      id: number
      username: string
      email?: string
      first_name?: string
      last_name?: string
    }
    role: 'editor' | 'commenter'
  }>
}

/**
 * WorkingDocumentLight - lightweight response from GET /working-copy endpoint
 */
export interface WorkingDocumentLight {
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
  tags?: string[]
  sponsor_content_type?: string
  sponsor_object_id?: string
  sponsor_label?: string
  sponsor_image_url?: string | null
  series_id?: string | null
  series_title?: string | null
  series_phase_num?: number | null
  series_order?: number | null
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

// Helper for formatting writing post counts
export const formatWritingPostCount = (count: number): string => {
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
    pin_kind?: string;
    pin_audience?: 'group' | 'community' | 'public';
  } | null;
  order?: number;
  is_pinned?: boolean;
}

export interface PublishDestinations {
  personal?: boolean;
  groups?: string[]; // slugs or UUIDs
  shelves?: string[]; // library ids
  lantern?: boolean;
}

export interface GroupOverridesMap {
  [groupIdOrSlug: string]: PlacementOptions;
}

// DOCX Import types

export interface DocxPreviewResult {
  body_json: Record<string, any>;
  title: string | null;
  stats: { node_counts: Record<string, number>; comment_count: number };
  comments: Array<{ id: string; author: string; date: string; text: string }>;
  file_sha256: string;
  original_filename: string;
  already_imported: {
    piece_id: string;
    receipt_id: string;
    imported_at: string;
  } | null;
}

export interface DocxImportPayload {
  body_json: Record<string, any>;
  title: string;
  writing_kind: string;
  sponsor_type: string;
  sponsor_id: string;
  enable_outline?: boolean;
  source_url?: string;
  file_sha256: string;
  original_filename: string;
  addressed_to?: string;
  force?: boolean;
  mode?: 'new' | 'replace';
}

export interface DocxImportResult {
  piece: WritingPiece;
  outline_nodes_created: number;
  message: string;
}

export interface DocumentImportPreviewItem {
  temp_id: string;
  original_filename: string;
  file_type: "docx" | "md" | "unknown";
  file_sha256?: string;
  title?: string;
  excerpt?: string;
  body_json?: Record<string, any>;
  writing_kind?: string;
  addressed_to?: string;
  enable_outline?: boolean;
  source_url?: string;
  phase_num?: number | null;
  series_order?: number | null;
  frontmatter?: Record<string, unknown>;
  metadata_notes?: Record<string, unknown>;
  already_imported?: boolean;
  existing_import?: {
    piece_id: string;
    receipt_id?: string;
    imported_at: string;
  } | null;
  warnings?: string[];
  error?: string;
  stats?: {
    word_count?: number;
    heading_count?: number;
    node_counts?: Record<string, number>;
    comment_count?: number;
  };
}

export interface DocumentImportPreviewResult {
  items: DocumentImportPreviewItem[];
}

export interface DocumentImportConfirmItem {
  temp_id: string;
  file_type: "docx" | "md";
  file_sha256: string;
  original_filename: string;
  title: string;
  excerpt?: string;
  body_json: Record<string, any>;
  writing_kind: string;
  addressed_to?: string;
  enable_outline?: boolean;
  source_url?: string;
  replace_existing?: boolean;
  import_notes?: Record<string, unknown>;
  phase_num?: number | null;
  series_order?: number | null;
}

export interface DocumentImportConfirmPayload {
  sponsor_type: string;
  sponsor_id?: string;
  sponsor_slug?: string;
  series_id?: string;
  items: DocumentImportConfirmItem[];
}

export interface DocumentImportConfirmResult {
  results: Array<{
    temp_id: string;
    status: "created" | "replaced" | "skipped_duplicate" | "error";
    piece?: {
      id: string;
      slug: string;
      status: string;
      title: string;
    };
    working_document?: {
      id: string;
    };
    outline_nodes_created?: number;
    error?: string;
  }>;
}

export interface PublishAndPlacePayload {
  title?: string;
  body_json?: any;
  excerpt?: string;
  writing_kind?: string;
  scheduled_for?: string; // ISO8601
  canonical_url?: string;
  tags?: string[];
  audience?: 'just_me' | 'readers';
  addressed_to?: AddressedTo;
  destinations: PublishDestinations;
  placement_options?: PlacementOptions;
  group_overrides?: GroupOverridesMap;
}

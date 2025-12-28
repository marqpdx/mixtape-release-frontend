// src/components/groups/writing/types.ts

export type WritingStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type WritingKind =
  | 'post'
  | 'article'
  | 'dispatch'
  | 'forum'
  | 'announcement'
  | 'almanac'
  | 'page'
  | 'other';

export interface WritingPiece {
  id: string;
  title: string;
  slug: string | null;
  summary?: string | null;

  status: WritingStatus;
  writing_kind: WritingKind;

  body_json: any;
  excerpt?: string | null;
  canonical_url?: string | null;

  // Versioning
  current_version_no: number;

  // Timestamps
  created_at: string;   // ISO
  updated_at: string;   // ISO
  published_at?: string | null;  // ISO
  scheduled_for?: string | null; // ISO

  // Sponsor (polymorphic)
  sponsor_content_type?: string | null;
  sponsor_object_id?: string | null;

  // Pinning
  pinned_at?: string | null;  // ISO
  pinned_rank?: number | null;

  // Options / metrics
  allow_comments: boolean;
  view_count: number;
  comment_count: number;

  // Derived (server may include)
  reading_time?: number | null;
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

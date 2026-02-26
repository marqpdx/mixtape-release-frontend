/**
 * TypeScript types for the Leaf system (Storyline, Comments, Streams)
 */

export interface LeafAuthor {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

export interface Leaf {
  id: string;
  author: LeafAuthor;
  body_text: string;
  body_json: Record<string, unknown>;
  caption: string;
  kind: 'text' | 'image' | 'link' | 'voice';
  origin_seed: string | null;
  promoted_to: string | null;
  audio_file: string | null;
  image_file: string | null;
  link_url: string | null;
  link_preview: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
  };
  source_content_type: number | null;
  source_object_id: string | null;
  source_type: string | null;
  source_title: string | null;
  is_reference: boolean;
  visibility: 'public' | 'followers' | 'private';
  published_at: string | null;
  created_at: string;
  updated_at: string;
  comment_count: number;
}

export interface LeafComment {
  id: string;
  author: LeafAuthor;
  content: string;
  parent: string | null;
  is_approved: boolean;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
  replies: LeafComment[];
}

export interface LeafCreateData {
  body_text?: string;
  body_json?: Record<string, unknown>;
  kind?: 'text' | 'image' | 'link' | 'voice';
  link_url?: string | null;
}

export interface ReferenceLeafCreateData {
  source_content_type: string;
  source_object_id: string;
  caption?: string;
}

export interface LeafCommentCreateData {
  content: string;
  parent?: string | null;
}

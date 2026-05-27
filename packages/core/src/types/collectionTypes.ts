// Collection (Library curation layer) types for Mixtape
// Used by both web and mobile apps

/**
 * Collection list item (lightweight)
 * Used for browsing/searching Collections
 */
export interface CollectionListItem {
  id: string;
  title: string;
  summary: string;
  slug: string;

  // Sponsor info (flattened)
  sponsor_type: 'group' | 'user';
  sponsor_id: string;
  sponsor_name: string;

  // Counts
  item_count: number;
  file_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Ingestion status summary
 */
export interface IngestionStatus {
  total: number;
  ready: number;
  processing: number;
  pending: number;
  failed: number;
}

/**
 * Collection detail (full metadata)
 */
export interface CollectionDetail {
  id: string;
  title: string;
  summary: string;
  body: string;
  slug: string;

  // Sponsor info
  sponsor_type: 'group' | 'user';
  sponsor_id: string;
  sponsor_name: string;

  // Author info
  author_name: string;
  submitted_by: {
    id: string;
    username: string;
    display_name: string;
  } | null;

  // Counts and status
  item_count: number;
  file_count: number;
  ingestion_status: IngestionStatus;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Alias for CollectionDetail (convenience)
 */
export type Collection = CollectionDetail;

/**
 * SourceFile minimal representation
 * Used when browsing available files to add to Collection
 */
export interface SourceFileMinimal {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  origin: 'upload' | 'git' | 'external' | 'audio';
  created_at: string;

  // Indicates if already added to Collection
  in_collection: boolean;
  item_count: number; // How many times added to this Collection
}

/**
 * LibraryItem content types (discriminated unions)
 */

// SourceFile content
export interface SourceFileContent {
  id: string;
  filename?: string;
  content_type?: string;
  size_bytes?: number;
  origin?: 'upload' | 'git' | 'external' | 'audio';
  ingestion_status?: 'pending' | 'processing' | 'complete' | 'failed' | 'unsupported';
  created_at?: string;
}

export interface SourceFileReadable {
  source_file_id: string;
  filename: string;
  content_type: string;
  artifact_id: string | null;
  artifact_type: string;
  ingestion_status: 'pending' | 'processing' | 'complete' | 'failed' | 'unsupported';
  text?: string;
}

// WritingPiece content
export interface WritingPieceContent {
  id: string;
  title: string;
  slug: string;
  summary: string;
  writing_kind: 'dispatch' | 'article' | 'post' | 'announcement' | 'page' | 'forum' | 'almanac' | 'other';
  status: string;
  author_name: string;
  published_at: string | null;
  created_at: string;
}

// Collection (Library) content - for linked collections
export interface CollectionLinkContent {
  id: string;
  title: string;
  slug: string;
  summary: string;
  item_count: number;
  file_count: number;
  sponsor_type: 'group' | 'user';
  created_at: string;
}

/**
 * LibraryItem (editorial overlay) - Polymorphic
 * Represents how content appears in a Collection
 * Content can be SourceFile, WritingPiece, Collection (linked), or Folder
 */
export type LibraryItem =
  | {
      // Folder variant
      content_type: 'folder';
      is_folder: true;
      title: string;  // Folder name

      // No content for folders
      content?: never;

      // Editorial overlay fields (common)
      id: string;
      parent_id: string | null;  // Hierarchy support
      order_index: number;
      folder_path: string;  // Legacy
      tags: string[];
      notes: string;  // Folder description
      is_featured: boolean;
      is_hidden: boolean;
      created_at: string;
      updated_at: string;
    }
  | {
      // SourceFile variant
      content_type: 'source_file';
      is_folder: false;
      content: SourceFileContent;

      // Editorial overlay fields (common)
      id: string;
      parent_id: string | null;  // Hierarchy support
      order_index: number;
      folder_path: string;  // Legacy
      tags: string[];
      notes: string;
      is_featured: boolean;
      is_hidden: boolean;
      created_at: string;
      updated_at: string;
    }
  | {
      // WritingPiece variant
      content_type: 'writing_piece';
      is_folder: false;
      content: WritingPieceContent;

      // Editorial overlay fields (common)
      id: string;
      parent_id: string | null;  // Hierarchy support
      order_index: number;
      folder_path: string;  // Legacy
      tags: string[];
      notes: string;
      is_featured: boolean;
      is_hidden: boolean;
      created_at: string;
      updated_at: string;
    }
  | {
      // Collection link variant (NEW)
      content_type: 'collection';
      is_folder: false;
      content: CollectionLinkContent;

      // Editorial overlay fields (common)
      id: string;
      parent_id: string | null;  // Hierarchy support
      order_index: number;
      folder_path: string;  // Legacy
      tags: string[];
      notes: string;
      is_featured: boolean;
      is_hidden: boolean;
      created_at: string;
      updated_at: string;
    };

/**
 * Request to create a new LibraryItem (polymorphic)
 */
export interface LibraryItemCreateRequest {
  content_type: 'source_file' | 'writing_piece' | 'dispatch_post' | 'collection';
  content_id: string;
  title?: string;
  order_index?: number; // Auto if not provided
  folder_path?: string;
  tags?: string[];
  notes?: string;
  is_featured?: boolean;
}

/**
 * WritingPiece minimal representation
 * Used when browsing available documents to add to Collection
 */
export interface WritingPieceMinimal {
  id: string;
  title: string;
  slug: string;
  summary: string;
  doc_type?: 'writing_piece' | 'dispatch_post';
  writing_kind: 'dispatch' | 'article' | 'post' | 'announcement' | 'page' | 'forum' | 'almanac' | 'other';
  status: string;
  author_name: string;
  published_at: string;
  created_at: string;

  // Indicates if already added to Collection
  in_collection: boolean;
  item_count: number; // How many times added to this Collection
}

/**
 * Request to update an existing LibraryItem
 * All fields optional (PATCH semantics)
 */
export interface LibraryItemUpdateRequest {
  order_index?: number;
  folder_path?: string;
  tags?: string[];
  notes?: string;
  is_featured?: boolean;
  is_hidden?: boolean;
}

/**
 * Request to bulk reorder and nest items
 */
export interface LibraryItemReorderRequest {
  items: Array<{
    id: string;
    order_index: number;
    parent_id?: string | null;  // Optional: change parent for nesting
  }>;
}

/**
 * Request to create a new Collection
 */
export interface CollectionCreateRequest {
  title: string;
  summary?: string;
  body?: string;
  sponsor_type: 'group' | 'user';
  sponsor_id: string;
  author_name?: string;
}

/**
 * Request to update Collection metadata
 * All fields optional (PATCH semantics)
 */
export interface CollectionUpdateRequest {
  title?: string;
  summary?: string;
  body?: string;
  author_name?: string;
}

/**
 * Query params for listing Collections
 */
export interface CollectionListParams {
  sponsor_type?: 'group' | 'user';
  sponsor_id?: string;
}

/**
 * Query params for listing Collection items
 */
export interface CollectionItemListParams {
  folder?: string;
  featured?: boolean;
  hidden?: boolean;
}

/**
 * Text search request
 * Searches through document content (Chunks) using PostgreSQL full-text
 */
export interface CollectionTextSearchRequest {
  query: string;
  limit?: number;
}

/**
 * Text search result
 * Single chunk match with context snippet
 */
export interface CollectionTextSearchResult {
  source_file_id: string;
  filename: string;
  chunk_id: string;
  chunk_text: string;  // Snippet with context around match
  chunk_index: number;
}

/**
 * Text search response
 */
export interface CollectionTextSearchResponse {
  query: string;
  results: CollectionTextSearchResult[];
  total: number;
}

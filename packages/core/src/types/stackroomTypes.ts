// Stackroom retrieval and IR types for Mixtape
// Used by both web and mobile apps

/**
 * Request parameters for semantic retrieval
 */
export interface RetrieveRequest {
  query: string; // 3-500 characters
  library_id: string;
  model_name?: string;
  model_version?: string;
  limit?: number; // 1-100, default 10
  score_threshold?: number; // 0.0-1.0
  artifact_types?: string[]; // e.g., ['normalized_markdown', 'extracted_text']
  source_file_ids?: string[];
}

/**
 * Individual chunk result from retrieval
 */
export interface ChunkResult {
  chunk_id: string;
  text: string;
  score: number; // 0.0-1.0
  source_spans: Array<{
    char_start: number;
    char_end: number;
  }>;
  artifact_id: string;
  artifact_type: string;
  source_file_id: string;
  filename: string;
  path: string;
}

/**
 * Performance timing metrics
 */
export interface RetrievalTiming {
  embed_ms: number;
  qdrant_ms: number;
  resolve_ms: number;
  total_ms: number;
}

/**
 * Response from semantic retrieval endpoint
 */
export interface RetrievalResponse {
  query: string;
  results: ChunkResult[];
  model: string; // e.g., "text-embedding-3-small@1"
  collection: string;
  timing?: RetrievalTiming;
}

/**
 * Error response from retrieval endpoint
 */
export interface RetrievalError {
  error: string; // Error code: 'model_not_found' | 'no_embeddings' | 'search_unavailable' | etc.
  detail: string; // User-friendly error message
}

/**
 * Library metadata
 */
export interface Library {
  id: string;
  tenant_type: 'group' | 'user';
  tenant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

/**
 * Source file metadata
 */
export interface SourceFile {
  id: string;
  library_id: string;
  origin: 'upload' | 'git' | 'external' | 'audio';
  path: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  hash_sha256: string;
  git_commit?: string;
  source_url?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Embedding model metadata
 */
export interface EmbeddingModel {
  id: string;
  name: string;
  version: string;
  provider: string;
  dimensions: number;
  created_at: string;
}

// ============================================================================
// INGESTION TYPES
// ============================================================================

/**
 * Ingestion run status
 */
export interface IngestionRun {
  id: string;
  library_id: string;
  status: 'running' | 'success' | 'partial' | 'failed';
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

/**
 * File upload request for simple upload endpoint
 */
export interface FileUploadRequest {
  library_id: string;
  file: File;
}

/**
 * Upload progress tracking
 */
export interface FileUploadProgress {
  file_id: string;
  filename: string;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'failed' | 'already_uploaded';
  progress: number; // 0-100
  error?: string;
  ingestion_run_id?: string;
  source_file_id?: string;
}

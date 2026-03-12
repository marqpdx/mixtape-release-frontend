/**
 * TypeScript type definitions for Puddlejump (Portable Document Library) format
 *
 * Spec Version: 1.0.0
 * Based on: puddlejump-contract.md
 *
 * These types define the structure of Puddlejump bundles for import/export.
 */

/**
 * Complete Puddlejump bundle manifest (puddlejump.json)
 */
export interface PuddlejumpManifest {
  $schema: string;
  format_version: string; // Semantic version (e.g., "1.0.0")
  bundle: PuddlejumpBundleMetadata;
  constraints: PuddlejumpConstraints;
  files: PuddlejumpFileEntry[];
  integrity: PuddlejumpIntegrity;
  generation: PuddlejumpGeneration;
}

/**
 * Bundle-level metadata
 */
export interface PuddlejumpBundleMetadata {
  id: string; // UUID v4
  title: string; // 1-200 characters
  description?: string; // Optional, max 1000 characters
  created_at: string; // ISO 8601 datetime (e.g., "2026-01-12T14:30:00Z")
  created_by: string; // Email or identifier
  license?: string; // Optional (e.g., "CC-BY-4.0", "All Rights Reserved")
}

/**
 * Constraints enforced on bundle
 */
export interface PuddlejumpConstraints {
  max_files: number; // Hard limit: 300
  max_size_bytes: number; // Hard limit: 52428800 (50MB)
  format: 'markdown'; // Only markdown supported in v1.0
  folder_depth: number; // Max nesting: 5 levels
}

/**
 * Per-file entry in manifest
 */
export interface PuddlejumpFileEntry {
  path: string; // Relative path from Documents/ (e.g., "guides/onboarding.md")
  hash: string; // SHA-256 hash prefixed with "sha256:" (64 hex chars after prefix)
  size_bytes: number; // File size in bytes
  last_modified: string; // ISO 8601 datetime
  canonical: boolean; // True if this is a canonical/authoritative file
  canonical_metadata?: PuddlejumpCanonicalMetadata; // Present only if canonical=true
  tags?: string[]; // Optional tags
  summary?: string; // Optional file summary
}

/**
 * Canonical metadata (only present for canonical files)
 */
export interface PuddlejumpCanonicalMetadata {
  date?: string; // ISO 8601 date (e.g., "2026-01-12")
  authority?: string; // Who declared this canonical (e.g., "Engineering Team")
  supersedes?: string; // Relative path to file this supersedes (e.g., "old-api-spec.md")
  review_date?: string; // ISO 8601 date when review is due
}

/**
 * Integrity verification hashes
 */
export interface PuddlejumpIntegrity {
  catalog_hash: string; // SHA-256 hash of PUDDLEJUMP.md
  total_hash: string; // SHA-256 hash of concatenated file hashes
  algorithm: 'sha256'; // Hash algorithm used
}

/**
 * Generation metadata (tool/version that created bundle)
 */
export interface PuddlejumpGeneration {
  tool: 'puddlejump-cli' | 'mixtape-export' | 'custom';
  version: string; // Semantic version of tool
  command?: string; // Optional: command used to generate bundle
}

/**
 * Markdown front matter structure (YAML)
 */
export interface PuddlejumpFrontMatter {
  // Puddlejump canonical metadata
  canonical?: boolean;
  canonical_date?: string; // ISO 8601 date
  canonical_authority?: string;
  supersedes?: string; // Relative path
  review_date?: string; // ISO 8601 date

  // Standard metadata
  title?: string;
  author?: string;
  tags?: string[];
  audience?: string[];
  summary?: string;

  // Optional
  version?: string;
  status?: string;
  related?: string[]; // Relative paths to related files
}

/**
 * Import API request
 */
export interface PuddlejumpImportRequest {
  file: File; // .zip file
  conflict_strategy?: 'replace' | 'version' | 'skip'; // Default: prompt user
  auto_ingest?: boolean; // Default: true (trigger Stackroom ingestion)
}

/**
 * Import API response
 */
export interface PuddlejumpImportResponse {
  library_id: string; // UUID of created/updated Library
  library_slug: string; // URL-friendly slug
  bundle_id: string; // Bundle ID from manifest
  status: 'processing' | 'conflicts_detected' | 'completed' | 'failed';
  counts: PuddlejumpImportCounts;
  conflicts?: PuddlejumpConflict[]; // Present if status='conflicts_detected'
  ingestion_status?: 'queued' | 'running' | 'completed' | 'failed';
  created_at: string; // ISO 8601 datetime
  error?: string; // Present if status='failed'
  warning?: 'large_bundle'; // Set when file_count > 100 (A2)
  file_count?: number; // Total files in bundle
}

/**
 * File counts after import
 */
export interface PuddlejumpImportCounts {
  total_files: number;
  new_files: number; // Files added
  updated_files: number; // Files modified
  skipped_files: number; // Files unchanged
  conflicts: number; // Files with conflicts
}

/**
 * Conflict detected during import
 */
export interface PuddlejumpConflict {
  path: string; // Relative file path
  existing_hash: string; // SHA-256 hash of existing file
  new_hash: string; // SHA-256 hash of new file
  resolution_options: PuddlejumpConflictResolution[];
}

/**
 * Conflict resolution options
 */
export type PuddlejumpConflictResolution = 'replace' | 'version' | 'merge' | 'skip';

/**
 * Export API request
 */
export interface PuddlejumpExportRequest {
  format?: 'zip' | 'folder'; // Default: zip
  include_non_canonical?: boolean; // Default: true
  filename?: string; // Optional custom filename
}

/**
 * Export API response
 *
 * The export endpoint streams a zip file directly (Content-Type: application/zip).
 * There is no JSON response body — the bundle_id is returned in the X-Bundle-Id header.
 * Use the Blob returned by the fetch/axios call; do not expect a JSON object.
 */
export type PuddlejumpExportResponse = Blob;

/**
 * Bundle info summary
 */
export interface PuddlejumpBundleInfo {
  title: string;
  file_count: number;
  total_size_bytes: number;
  canonical_count: number; // Number of canonical files
}

/**
 * Validation error structure
 */
export interface PuddlejumpValidationError {
  error: 'validation_failed';
  message: string;
  details: {
    [key: string]: {
      actual?: number | string | string[];
      max?: number;
      message: string;
    };
  };
}

/**
 * Database models (Mixtape-side, for reference)
 */

/**
 * Extended Library model (after migration 0007)
 */
export interface LibraryWithPuddlejump {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  body?: string;

  // Puddlejump fields (added in migration 0007)
  puddlejump_bundle_id?: string | null; // UUID from imported bundle
  puddlejump_origin: 'imported' | 'created'; // Default: 'created'
  puddlejump_exported_at?: string | null; // ISO 8601 datetime

  created_at: string;
  updated_at: string;
}

/**
 * Extended LibraryItem model (after migration 0007)
 */
export interface LibraryItemWithPuddlejump {
  id: string;
  library: string; // Library UUID
  is_folder: boolean;
  title?: string; // For folders
  content_type?: string;
  content_object_id?: string;
  parent?: string | null; // Parent LibraryItem UUID
  order_index: number;
  folder_path: string; // Relative path from Documents/

  // Curatorial metadata
  tags?: string[];
  notes?: string;
  is_featured: boolean; // Maps to canonical status (cached from file)
  is_hidden: boolean;

  // Puddlejump canonical metadata (added in migration 0007)
  // This is a CACHE of data from file front matter, not authoritative
  puddlejump_canonical_metadata: {
    canonical_date?: string;
    canonical_authority?: string;
    supersedes?: string;
    review_date?: string;
  };

  created_at: string;
  updated_at: string;
}

/**
 * Canon precedence chain (for reference - not a runtime type)
 *
 * Authority flows:
 *   file.md front matter (canonical: true)  ← SOURCE OF TRUTH
 *         ↓ (generated)
 *   manifest.json (files[].canonical)
 *         ↓ (generated)
 *   PUDDLEJUMP.md (catalog)
 *         ↓ (cached for UI performance)
 *   LibraryItem.is_featured (database)
 *
 * On import: File front matter → Database cache
 * On export: Database cache → File front matter (round-trip)
 */

/**
 * Sync state (desktop client — sync API is built, see /api/stackroom/puddlejump/sync/*)
 */
export interface PuddlejumpSyncState {
  file_path: string;
  local_hash: string;
  server_hash?: string;
  last_synced_at?: string; // ISO 8601 datetime
  sync_status: 'synced' | 'pending' | 'downloading' | 'conflict' | 'error';
  library_item_id?: string;
}

// ============================================================================
// CANON GOVERNANCE TYPES (Puddlejump v1 §4-6, Appendix A1/A3/A6)
// ============================================================================

/**
 * Version history entry for a SourceFile
 */
export interface SourceFileVersion {
  id: string;
  version_number: number;
  hash_sha256: string;
  change_summary: string;
  actor: {
    id: string | null;
    username: string | null;
    display_name: string | null;
  };
  ai_assisted: boolean;
  ai_agent: string | null;
  ai_summary: string | null;
  is_approved: boolean;
  approved_by?: {
    username: string;
    display_name: string;
  } | null;
  approved_at?: string | null;
  created_at: string;
}

/**
 * Checkout status for soft checkout (§6, A1)
 */
export interface CheckoutStatus {
  checked_out_by: {
    username: string;
    display_name: string;
  } | null;
  checked_out_at: string | null;
  is_own?: boolean;
}

/**
 * Diff data for Canon approval UI (A6)
 */
export interface CanonDiff {
  previous_content: string | null;
  proposed_content: string;
  previous_version_number: number | null;
  proposed_version_number: number;
}

/**
 * Canon approval response
 */
export interface CanonApprovalResponse {
  id: string;
  approved_at: string;
  source_file_id: string;
  version_id: string;
  is_canon: boolean;
}

/**
 * Version submission response
 */
export interface VersionSubmitResponse {
  id: string;
  version_number: number;
  hash_sha256: string;
  created_at: string;
}

/**
 * Type guards
 */

export function isPuddlejumpManifest(obj: unknown): obj is PuddlejumpManifest {
  if (!obj || typeof obj !== 'object') return false;
  const manifest = obj as Partial<PuddlejumpManifest>;
  return (
    typeof manifest.format_version === 'string' &&
    typeof manifest.bundle === 'object' &&
    Array.isArray(manifest.files) &&
    typeof manifest.integrity === 'object'
  );
}

export function isPuddlejumpFileEntry(obj: unknown): obj is PuddlejumpFileEntry {
  if (!obj || typeof obj !== 'object') return false;
  const entry = obj as Partial<PuddlejumpFileEntry>;
  return (
    typeof entry.path === 'string' &&
    typeof entry.hash === 'string' &&
    typeof entry.size_bytes === 'number' &&
    typeof entry.canonical === 'boolean'
  );
}

/**
 * Constants
 */

export const PUDDLEJUMP_CONSTRAINTS = {
  MAX_FILES: 300,
  MAX_SIZE_BYTES: 52_428_800, // 50MB
  MAX_FOLDER_DEPTH: 5,
  FORMAT: 'markdown' as const,
} as const;

export const PUDDLEJUMP_FILE_NAMES = {
  MANIFEST: 'puddlejump.json',
  CATALOG: 'PUDDLEJUMP.md',
  DOCUMENTS_DIR: 'Documents',
} as const;

export const PUDDLEJUMP_SCHEMA_URL = 'https://puddlejump.mixtape.ai/schema/v1.0.json';

/**
 * Utility types for API endpoints
 */

export type PuddlejumpApiEndpoint =
  | '/api/stackroom/puddlejump/personal'
  | '/api/stackroom/puddlejump/import'
  | '/api/stackroom/puddlejump/health'
  | '/api/stackroom/puddlejump/sync/status'
  | '/api/stackroom/puddlejump/sync/upload'
  | '/api/stackroom/puddlejump/sync/download/{file_id}'
  | '/api/stackroom/puddlejump/sync/delete/{file_id}'
  | '/api/stackroom/puddlejump/sync/complete'
  | '/api/stackroom/libraries/{library_id}/export';

// ============================================================================
// PERSONAL PUDDLEJUMP TYPES
// ============================================================================

/**
 * Item in a Puddlejump library
 */
export interface PuddlejumpItem {
  id: string;
  is_folder: boolean;
  title: string;
  folder_path: string;
  tags: string[];
  notes: string;
  is_featured: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
  // Content info (only for non-folders)
  content_type?: string;
  content_id?: string;
  filename?: string;
  size_bytes?: number;
  // Canon governance (present when content_type is sourcefile)
  source_file_id?: string;
  latest_version_id?: string;
}

/**
 * Personal Puddlejump library response
 */
export interface PersonalPuddlejump {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  file_count: number;
  total_size_bytes: number;
  last_synced_at: string | null;
  items: PuddlejumpItem[];
  created_at: string;
  updated_at: string;
}

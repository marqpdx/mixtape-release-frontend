// packages/api/src/clients/puddlejump/puddlejumpApi.ts

// Puddlejump API client
// Handles Puddlejump library, sync, and bundle operations

import {
  PuddlejumpImportResponse,
  PuddlejumpValidationError,
  PersonalPuddlejump,
  PuddlejumpItem,
  SourceFileVersion,
  CheckoutStatus,
  CanonDiff,
  CanonApprovalResponse,
  VersionSubmitResponse,
  RetrieveAsyncRequest,
  AsyncActionResponse,
} from '@mixtape/core/types/puddlejump';
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// ============================================================================
// PERSONAL PUDDLEJUMP
// ============================================================================

/**
 * Get or create the user's personal Puddlejump library
 *
 * @returns Personal Puddlejump library with items
 */
export async function getPersonalPuddlejump(): Promise<PersonalPuddlejump> {
  const response = await axiosInstance.get<PersonalPuddlejump>(
    '/api/puddlejump/personal'
  );
  return response.data;
}

// ============================================================================
// SYNC PROTOCOL
// ============================================================================

export async function getSyncStatus(): Promise<{
  synced: boolean;
  file_count: number;
  total_size_bytes: number;
  last_synced_at: string | null;
}> {
  const response = await axiosInstance.get('/api/puddlejump/sync/status');
  return response.data;
}

export async function syncUpload(data: {
  title?: string;
  filename: string;
  folder_path?: string;
  size_bytes?: number;
  content_type?: string;
  source_file_id?: string;
  tags?: string[];
  notes?: string;
  order_index?: number;
}): Promise<PuddlejumpItem> {
  const response = await axiosInstance.post<PuddlejumpItem>('/api/puddlejump/sync/upload', data);
  return response.data;
}

export async function syncDownload(itemId: string): Promise<PuddlejumpItem> {
  const response = await axiosInstance.get<PuddlejumpItem>(
    `/api/puddlejump/sync/download/${itemId}/`
  );
  return response.data;
}

export async function syncDelete(itemId: string): Promise<void> {
  await axiosInstance.delete(`/api/puddlejump/sync/delete/${itemId}/`);
}

export async function syncComplete(): Promise<{ last_synced_at: string }> {
  const response = await axiosInstance.post('/api/puddlejump/sync/complete');
  return response.data;
}

// ============================================================================
// PUDDLEJUMP IMPORT
// ============================================================================

/**
 * Import a Puddlejump bundle (.zip file)
 * Creates Library and LibraryItem records from bundle contents
 *
 * @param file - Puddlejump bundle as .zip file
 * @param conflictStrategy - How to handle conflicts ('replace' | 'version' | 'skip')
 * @param autoIngest - Whether to trigger Stackroom ingestion (default: true)
 * @returns Import result with library_id, slug, counts
 * @throws ValidationError if bundle is invalid
 */
export async function importPuddlejumpBundle(
  file: File,
  conflictStrategy: 'replace' | 'version' | 'skip' = 'replace',
  autoIngest: boolean = true
): Promise<PuddlejumpImportResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conflict_strategy', conflictStrategy);
  formData.append('auto_ingest', String(autoIngest));

  const response = await axiosInstance.post<PuddlejumpImportResponse>(
    '/api/puddlejump/import',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      // Allow longer timeout for large bundles
      timeout: 60000, // 60 seconds
    }
  );

  return response.data;
}

/**
 * Export a Library as Puddlejump Canon bundle (zip download)
 */
export async function exportPuddlejumpBundle(
  libraryId: string,
  includeNonCanonical: boolean = false
): Promise<Blob> {
  const response = await axiosInstance.get(
    `/api/puddlejump/${libraryId}/export`,
    {
      params: { include_non_canonical: includeNonCanonical },
      responseType: 'blob',
    }
  );
  return response.data;
}

// ============================================================================
// CANON GOVERNANCE
// ============================================================================

/**
 * Fetch version history for a source file
 */
export async function fetchVersions(
  sourceFileId: string
): Promise<{ versions: SourceFileVersion[] }> {
  const response = await axiosInstance.get(
    `/api/stackroom/source-files/${sourceFileId}/versions`
  );
  return response.data;
}

/**
 * Submit a new version for a source file
 */
export async function submitVersion(
  sourceFileId: string,
  data: {
    content: string;
    change_summary?: string;
    ai_assisted?: boolean;
    ai_agent?: string;
    ai_summary?: string;
  }
): Promise<VersionSubmitResponse> {
  const response = await axiosInstance.post(
    `/api/stackroom/source-files/${sourceFileId}/versions`,
    data
  );
  return response.data;
}

/**
 * Approve a version as Canon
 */
export async function approveCanon(
  sourceFileId: string,
  data: { version_id: string; notes?: string }
): Promise<CanonApprovalResponse> {
  const response = await axiosInstance.post(
    `/api/stackroom/source-files/${sourceFileId}/approve`,
    data
  );
  return response.data;
}

/**
 * Get diff data for Canon approval UI
 */
export async function fetchDiff(
  sourceFileId: string
): Promise<CanonDiff> {
  const response = await axiosInstance.get(
    `/api/stackroom/source-files/${sourceFileId}/diff`
  );
  return response.data;
}

/**
 * Get checkout status for a source file
 */
export async function fetchCheckoutStatus(
  sourceFileId: string
): Promise<{ checkout: CheckoutStatus | null }> {
  const response = await axiosInstance.get(
    `/api/stackroom/source-files/${sourceFileId}/checkout`
  );
  return response.data;
}

/**
 * Check out a source file (soft checkout, advisory only)
 */
export async function checkoutFile(
  sourceFileId: string
): Promise<{ checked_out_by: string; checked_out_at: string }> {
  const response = await axiosInstance.post(
    `/api/stackroom/source-files/${sourceFileId}/checkout`
  );
  return response.data;
}

/**
 * Release checkout on a source file
 */
export async function checkinFile(
  sourceFileId: string
): Promise<{ checked_out_by: null; checked_out_at: null }> {
  const response = await axiosInstance.post(
    `/api/stackroom/source-files/${sourceFileId}/checkin`
  );
  return response.data;
}

/**
 * Check Puddlejump API health
 */
export async function checkPuddlejumpHealth(): Promise<{
  status: string;
  version: string;
  phase: string;
}> {
  const response = await axiosInstance.get('/api/puddlejump/health');
  return response.data;
}

// ─── Async retrieve / find ─────────────────────────────────────────────────────

export async function submitRetrieveAsync(
  payload: RetrieveAsyncRequest
): Promise<AsyncActionResponse> {
  const response = await axiosInstance.post('/api/puddlejump/retrieve/', payload);
  return response.data as AsyncActionResponse;
}

export async function submitFindAsync(
  payload: RetrieveAsyncRequest
): Promise<AsyncActionResponse> {
  const response = await axiosInstance.post('/api/puddlejump/find/', payload);
  return response.data as AsyncActionResponse;
}

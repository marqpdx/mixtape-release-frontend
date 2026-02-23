// packages/api/src/clients/stackroom/puddlejumpApi.ts

// Puddlejump API client
// Handles Puddlejump bundle import/export operations

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
    '/api/stackroom/puddlejump/personal'
  );
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
    '/api/stackroom/puddlejump/import',
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
    `/api/stackroom/libraries/${libraryId}/export`,
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
  const response = await axiosInstance.get(
    '/api/stackroom/puddlejump/health'
  );

  return response.data;
}

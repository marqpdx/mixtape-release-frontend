// packages/api/src/clients/stackroom/puddlejumpApi.ts

// Puddlejump API client
// Handles Puddlejump bundle import/export operations

import {
  PuddlejumpImportResponse,
  PuddlejumpValidationError,
  PersonalPuddlejump,
  PuddlejumpItem,
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
 * Export a Library as Puddlejump bundle
 * (Phase 5 - not yet implemented)
 */
export async function exportPuddlejumpBundle(
  libraryId: string
): Promise<Blob> {
  const response = await axiosInstance.get(
    `/api/stackroom/puddlejump/export/${libraryId}/`,
    {
      responseType: 'blob',
    }
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

// packages/api/src/clients/stackroom/stackroomApi.ts

// Stackroom API client
// Semantic retrieval and IR operations

import {
  RetrieveRequest,
  RetrievalResponse,
  RetrievalError,
  Library,
  SourceFile,
  EmbeddingModel,
} from '@mixtape/core/types/stackroomTypes';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';

// ============================================================================
// RETRIEVAL API FUNCTIONS
// ============================================================================

/**
 * Search a library using semantic retrieval
 *
 * @param request - Retrieval parameters
 * @returns Retrieval response with ranked chunk results
 * @throws RetrievalError if request fails
 */
export async function searchLibrary(
  request: RetrieveRequest
): Promise<RetrievalResponse> {
  try {
    const response = await axiosInstance.post<RetrievalResponse>(
      '/api/stackroom/retrieve',
      request
    );
    return response.data;
  } catch (error: any) {
    // Handle API errors
    if (error.response?.data) {
      const errorData = error.response.data as RetrievalError;
      throw new Error(errorData.detail || 'Search failed');
    }
    throw error;
  }
}

// ============================================================================
// LIBRARY API FUNCTIONS
// ============================================================================

/**
 * Fetch all libraries accessible to the current user
 */
export async function fetchLibraries(params?: {
  scope?: string;
  sponsor_type?: 'group' | 'user';
  sponsor_id?: string;
  sponsor_username?: string;
}): Promise<Library[]> {
  const response = await axiosInstance.get<Library[]>('/api/stackroom/libraries', {
    params,
  });
  return response.data;
}

/**
 * Fetch public libraries for a user (reader view)
 */
export async function fetchPublicLibrariesByUsername(
  username: string,
  scope = 'writing'
): Promise<Library[]> {
  const response = await axiosInstance.get<Library[]>('/api/stackroom/libraries/public', {
    params: { username, scope },
  });
  return response.data;
}

/**
 * Fetch a single library by ID
 */
export async function fetchLibrary(libraryId: string): Promise<Library> {
  const response = await axiosInstance.get<Library>(`/api/stackroom/libraries/${libraryId}`);
  return response.data;
}

/**
 * Create a new library
 */
export async function createLibrary(data: {
  title: string;
  summary?: string;
  body?: string;
  sponsor_type: 'group' | 'user';
  sponsor_id: string;
  scope?: string;
  visibility?: 'public' | 'members' | 'unlisted' | 'private';
}): Promise<Library> {
  // Map frontend naming to backend naming
  const payload = {
    title: data.title,
    name: data.title,
    summary: data.summary,
    body: data.body,
    tenant_type: data.sponsor_type,
    tenant_id: data.sponsor_id,
    scope: data.scope,
    visibility: data.visibility,
  };
  const response = await axiosInstance.post<Library>('/api/stackroom/libraries', payload);
  return response.data;
}

/**
 * Update/rename a library
 */
export async function updateLibrary(
  libraryId: string,
  data: {
    title?: string;
    summary?: string;
    body?: string;
    visibility?: 'public' | 'members' | 'unlisted' | 'private';
  }
): Promise<Library> {
  const payload = {
    name: data.title,
    summary: data.summary,
    body: data.body,
    visibility: data.visibility,
  };
  const response = await axiosInstance.patch<Library>(`/api/stackroom/libraries/${libraryId}`, payload);
  return response.data;
}

/**
 * Fetch placements for a library (shelf)
 */
export async function fetchLibraryPlacements(libraryId: string) {
  const response = await axiosInstance.get(`/api/stackroom/libraries/${libraryId}/placements`);
  return response.data as Array<{
    id: string;
    piece_id: string;
    piece_slug: string;
    piece_title: string;
    piece_body_json: any;
    piece_status: string;
    published_at: string | null;
    visibility: string;
    order_index?: number;
    created_at: string;
    updated_at: string;
    display?: {
      title?: string;
      excerpt?: string;
      is_excerpt?: boolean;
      body_json?: any;
    };
  }>;
}

export async function addLibraryPlacement(libraryId: string, pieceId: string) {
  const response = await axiosInstance.post<{ id: string }>(
    `/api/stackroom/libraries/${libraryId}/placements/manage`,
    { piece_id: pieceId }
  );
  return response.data;
}

export async function removeLibraryPlacement(libraryId: string, placementId: string) {
  await axiosInstance.delete(
    `/api/stackroom/libraries/${libraryId}/placements/${placementId}`
  );
}

export async function reorderLibraryPlacements(libraryId: string, order: string[]) {
  await axiosInstance.post(`/api/stackroom/libraries/${libraryId}/placements/reorder`, {
    order,
  });
}

// ============================================================================
// SOURCE FILE API FUNCTIONS
// ============================================================================

/**
 * Fetch source files for a library
 */
export async function fetchSourceFiles(libraryId: string): Promise<SourceFile[]> {
  const response = await axiosInstance.get<SourceFile[]>(
    `/api/stackroom/libraries/${libraryId}/source-files`
  );
  return response.data;
}

/**
 * Fetch full content of a source file
 */
export async function fetchSourceFileContent(sourceFileId: string): Promise<{ text: string }> {
  const response = await axiosInstance.get<{ text: string }>(
    `/api/stackroom/source-files/${sourceFileId}/content`
  );
  return response.data;
}

/**
 * Fetch full content of an artifact
 */
export async function fetchArtifactContent(artifactId: string): Promise<{ text: string }> {
  const response = await axiosInstance.get<{ text: string }>(
    `/api/stackroom/artifacts/${artifactId}/content`
  );
  return response.data;
}

// ============================================================================
// EMBEDDING MODEL API FUNCTIONS
// ============================================================================

/**
 * Fetch available embedding models
 */
export async function fetchEmbeddingModels(): Promise<EmbeddingModel[]> {
  const response = await axiosInstance.get<EmbeddingModel[]>('/api/stackroom/embedding-models');
  return response.data;
}

/**
 * Get the default embedding model
 */
export function getDefaultEmbeddingModel(): { name: string; version: string } {
  return {
    name: 'all-mpnet-base-v2',
    version: '1',
  };
}

// ============================================================================
// INGESTION API FUNCTIONS
// ============================================================================

/**
 * Upload a file for ingestion (Stackroom workflow - immediate processing)
 *
 * NOTE: This triggers immediate text extraction, chunking, and embedding.
 * For Collection uploads (deferred processing), use uploadToCollection instead.
 *
 * @param libraryId - Library to upload to
 * @param file - File to upload
 * @param onProgress - Progress callback
 */
export async function uploadFile(
  libraryId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ source_file_id: string; ingestion_run_id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('library_id', libraryId);

  try {
    const response = await axiosInstance.post<{ source_file_id: string; ingestion_run_id: string }>(
      '/api/stackroom/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Clamp to 0-100 range to avoid UI errors
            onProgress(Math.min(100, Math.max(0, progress)));
          }
        },
      }
    );
    return response.data;
  } catch (error: any) {
    // Handle 409 Conflict - file already exists
    if (error.response?.status === 409) {
      const duplicateError: any = new Error('File already exists in library');
      duplicateError.isDuplicate = true;
      duplicateError.source_file_id = error.response.data.source_file_id;
      throw duplicateError;
    }

    if (error.response?.data) {
      throw new Error(error.response.data.detail || 'Upload failed');
    }
    throw error;
  }
}

/**
 * Upload a file to a Collection (curation workflow - deferred processing)
 *
 * This is the Collection-focused upload that:
 * - Creates file metadata only
 * - Saves file for later processing
 * - Returns immediately (fast upload)
 * - Background task processes files asynchronously
 *
 * Use this for Collections where users care about curation, not immediate indexing.
 * For Stackroom uploads where indexing is immediate, use uploadFile instead.
 *
 * @param collectionId - Collection to upload to
 * @param file - File to upload
 * @param onProgress - Progress callback
 */
export async function uploadToCollection(
  collectionId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ source_file_id: string; filename: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axiosInstance.post<{ source_file_id: string; filename: string; status: string }>(
      `/api/collections/${collectionId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            // Clamp to 0-100 range to avoid UI errors
            onProgress(Math.min(100, Math.max(0, progress)));
          }
        },
      }
    );
    return response.data;
  } catch (error: any) {
    // Handle 409 Conflict - file already exists
    if (error.response?.status === 409) {
      const duplicateError: any = new Error('File already exists in collection');
      duplicateError.isDuplicate = true;
      duplicateError.source_file_id = error.response.data.source_file_id;
      throw duplicateError;
    }

    if (error.response?.data) {
      throw new Error(error.response.data.detail || 'Upload failed');
    }
    throw error;
  }
}

/**
 * Get ingestion run status
 */
export async function getIngestionRunStatus(runId: string): Promise<{
  id: string;
  status: 'running' | 'success' | 'partial' | 'failed';
  progress?: number;
  error?: string;
}> {
  const response = await axiosInstance.get(`/api/stackroom/ingestion/${runId}/status`);
  return response.data;
}

// ============================================================================
// ACTIVITY API FUNCTIONS
// ============================================================================

/**
 * Get library activity data (dev/admin tool)
 */
export async function fetchLibraryActivity(libraryId: string): Promise<any> {
  const response = await axiosInstance.get(`/api/stackroom/libraries/${libraryId}/activity`);
  return response.data;
}

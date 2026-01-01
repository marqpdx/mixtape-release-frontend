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
import { axiosInstance } from '../../lib/axiosInstance';

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
export async function fetchLibraries(): Promise<Library[]> {
  const response = await axiosInstance.get<Library[]>('/api/stackroom/libraries');
  return response.data;
}

/**
 * Fetch a single library by ID
 */
export async function fetchLibrary(libraryId: string): Promise<Library> {
  const response = await axiosInstance.get<Library>(`/api/stackroom/libraries/${libraryId}`);
  return response.data;
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
 * Upload a file for ingestion
 *
 * NOTE: This requires a simplified upload endpoint on the backend
 * that handles the full ingestion process. Current backend API
 * expects clients to orchestrate the ingestion steps.
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

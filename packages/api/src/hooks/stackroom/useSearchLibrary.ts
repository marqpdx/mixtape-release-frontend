// src/hooks/stackroom/useSearchLibrary.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import * as stackroomApi from '@mixtape/api/clients/stackroom/stackroomApi';
import {
  RetrieveRequest,
  RetrievalResponse,
  ChunkResult,
} from '@mixtape/core/types/stackroomTypes';

// Query key factories for consistent caching
export const stackroomQueryKeys = {
  all: ['stackroom'] as const,
  searches: () => [...stackroomQueryKeys.all, 'search'] as const,
  search: (request: Partial<RetrieveRequest>) => [...stackroomQueryKeys.searches(), request] as const,
  libraries: () => [...stackroomQueryKeys.all, 'libraries'] as const,
  library: (id: string) => [...stackroomQueryKeys.libraries(), id] as const,
};

// Hook return type interfaces
export interface UseSearchLibraryResult {
  results: ChunkResult[];
  isLoading: boolean;
  isSearching: boolean;
  error: Error | null;
  search: (request: RetrieveRequest) => Promise<void>;
  clear: () => void;
  timing?: RetrievalResponse['timing'];
  model?: string;
  collection?: string;
}

export interface UseLibrariesResult {
  libraries: any[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to search a library with semantic retrieval
 *
 * This hook manages search state and caching. It's designed to work with
 * debounced input from SearchInput component.
 *
 * @example
 * ```tsx
 * const { results, isSearching, search } = useSearchLibrary();
 *
 * // Trigger search
 * await search({
 *   query: "machine learning",
 *   library_id: libraryId,
 *   limit: 10,
 * });
 * ```
 */
export const useSearchLibrary = (): UseSearchLibraryResult => {
  const [currentRequest, setCurrentRequest] = useState<RetrieveRequest | null>(null);
  const queryClient = useQueryClient();

  // Use useQuery with enabled flag based on whether we have a request
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: currentRequest ? stackroomQueryKeys.search(currentRequest) : ['stackroom', 'empty'],
    queryFn: () => {
      if (!currentRequest) {
        return Promise.resolve({ results: [], query: '', model: '', collection: '' } as RetrievalResponse);
      }
      return stackroomApi.searchLibrary(currentRequest);
    },
    enabled: !!currentRequest,
    staleTime: 5 * 60 * 1000, // 5 minutes - align with backend cache
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const search = useCallback(async (request: RetrieveRequest) => {
    setCurrentRequest(request);
    // The query will automatically refetch due to the dependency on currentRequest
  }, []);

  const clear = useCallback(() => {
    setCurrentRequest(null);
  }, []);

  return {
    results: data?.results || [],
    isLoading: isLoading && !!currentRequest,
    isSearching: isLoading && !!currentRequest,
    error: error as Error | null,
    search,
    clear,
    timing: data?.timing,
    model: data?.model,
    collection: data?.collection,
  };
};

/**
 * Hook to fetch user's accessible libraries
 */
export const useLibraries = (): UseLibrariesResult => {
  const {
    data: libraries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: stackroomQueryKeys.libraries(),
    queryFn: () => stackroomApi.fetchLibraries(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    libraries,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to fetch a single library
 */
export const useLibrary = (libraryId: string | null) => {
  const {
    data: library = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: libraryId ? stackroomQueryKeys.library(libraryId) : ['stackroom', 'empty'],
    queryFn: () => {
      if (!libraryId) return Promise.resolve(null);
      return stackroomApi.fetchLibrary(libraryId);
    },
    enabled: !!libraryId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    library,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to fetch artifact content (full text)
 */
export const useArtifactContent = (artifactId: string | null) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: artifactId ? [...stackroomQueryKeys.all, 'artifact', artifactId, 'content'] : ['stackroom', 'empty'],
    queryFn: () => {
      if (!artifactId) return Promise.resolve({ text: '' });
      return stackroomApi.fetchArtifactContent(artifactId);
    },
    enabled: !!artifactId,
    staleTime: 10 * 60 * 1000, // 10 minutes - content doesn't change often
    refetchOnWindowFocus: false,
  });

  return {
    text: data?.text || '',
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to fetch source file content (full extracted text)
 */
export const useSourceFileContent = (sourceFileId: string | null) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: sourceFileId
      ? [...stackroomQueryKeys.all, 'source-file', sourceFileId, 'content']
      : ['stackroom', 'empty'],
    queryFn: () => {
      if (!sourceFileId) return Promise.resolve({ text: '' });
      return stackroomApi.fetchSourceFileContent(sourceFileId);
    },
    enabled: !!sourceFileId,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    text: data?.text || '',
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to create a new library
 */
export const useCreateLibrary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      summary?: string;
      body?: string;
      sponsor_type: 'group' | 'user';
      sponsor_id: string;
    }) => stackroomApi.createLibrary(data),
    onSuccess: () => {
      // Invalidate libraries query to refresh the list
      queryClient.invalidateQueries({ queryKey: stackroomQueryKeys.libraries() });
    },
  });
};

/**
 * Hook to update/rename a library
 */
export const useUpdateLibrary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ libraryId, data }: {
      libraryId: string;
      data: {
        title?: string;
        summary?: string;
        body?: string;
      };
    }) => stackroomApi.updateLibrary(libraryId, data),
    onSuccess: (updatedLibrary) => {
      // Invalidate libraries query to refresh the list
      queryClient.invalidateQueries({ queryKey: stackroomQueryKeys.libraries() });
      // Invalidate the specific library query
      queryClient.invalidateQueries({ queryKey: stackroomQueryKeys.library(updatedLibrary.id) });
    },
  });
};

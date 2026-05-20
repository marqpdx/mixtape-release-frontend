// Puddlejump hooks
// React hooks for Puddlejump bundle import/export operations

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as puddlejumpApi from '@mixtape/api/clients/puddlejump/puddlejumpApi';
import { PuddlejumpImportResponse, PersonalPuddlejump } from '@mixtape/core/types/puddlejump';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import { collectionQueryKeys } from '../stackroom/useCollections';

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const puddlejumpQueryKeys = {
  all: ['puddlejump'] as const,
  health: () => [...puddlejumpQueryKeys.all, 'health'] as const,
  personal: () => [...puddlejumpQueryKeys.all, 'personal'] as const,
  group: (groupSlug: string) => [...puddlejumpQueryKeys.all, 'group', groupSlug] as const,
  versions: (sourceFileId: string) => [...puddlejumpQueryKeys.all, 'versions', sourceFileId] as const,
  diff: (sourceFileId: string) => [...puddlejumpQueryKeys.all, 'diff', sourceFileId] as const,
  checkout: (sourceFileId: string) => [...puddlejumpQueryKeys.all, 'checkout', sourceFileId] as const,
};

// ============================================================================
// PUDDLEJUMP MUTATION HOOKS
// ============================================================================

/**
 * Hook to import a Puddlejump bundle
 *
 * @example
 * ```tsx
 * const importMutation = usePuddlejumpImport({
 *   onSuccess: (result) => {
 *     console.log('Imported:', result.library_id);
 *     navigate(`/collections/${result.library_slug}`);
 *   },
 *   onError: (error) => {
 *     toast.error('Import failed: ' + error.message);
 *   }
 * });
 *
 * const handleUpload = async (file: File) => {
 *   await importMutation.mutateAsync({
 *     file,
 *     conflictStrategy: 'replace',
 *     autoIngest: true
 *   });
 * };
 * ```
 */
export const usePuddlejumpImport = (options?: {
  onSuccess?: (result: PuddlejumpImportResponse) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      conflictStrategy = 'replace',
      autoIngest = true,
    }: {
      file: File;
      conflictStrategy?: 'replace' | 'version' | 'skip';
      autoIngest?: boolean;
    }) => puddlejumpApi.importPuddlejumpBundle(file, conflictStrategy, autoIngest),
    onSuccess: (result) => {
      // Invalidate collections list (new collection added)
      queryClient.invalidateQueries({ queryKey: collectionQueryKeys.lists() });

      // Call user-provided success handler
      options?.onSuccess?.(result);
    },
    onError: (error) => {
      // Call user-provided error handler
      options?.onError?.(error as Error);
    },
  });
};

/**
 * Hook to export a Library as Puddlejump Canon bundle
 */
export const usePuddlejumpExport = () => {
  return useMutation({
    mutationFn: ({
      libraryId,
      includeNonCanonical = false,
    }: {
      libraryId: string;
      includeNonCanonical?: boolean;
    }) => puddlejumpApi.exportPuddlejumpBundle(libraryId, includeNonCanonical),
  });
};

// ============================================================================
// CANON GOVERNANCE HOOKS
// ============================================================================

/**
 * Hook to fetch version history for a source file
 */
export const useVersionHistory = (sourceFileId: string | null) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: puddlejumpQueryKeys.versions(sourceFileId ?? ''),
    queryFn: () => puddlejumpApi.fetchVersions(sourceFileId!),
    enabled: !!sourceFileId,
    staleTime: 10_000,
  });

  return {
    versions: data?.versions ?? [],
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to submit a new version
 */
export const useSubmitVersion = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceFileId,
      ...data
    }: {
      sourceFileId: string;
      content: string;
      change_summary?: string;
      ai_assisted?: boolean;
      ai_agent?: string;
      ai_summary?: string;
    }) => puddlejumpApi.submitVersion(sourceFileId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: puddlejumpQueryKeys.versions(variables.sourceFileId),
      });
      queryClient.invalidateQueries({
        queryKey: puddlejumpQueryKeys.diff(variables.sourceFileId),
      });
      options?.onSuccess?.();
    },
    onError: (error) => options?.onError?.(error as Error),
  });
};

/**
 * Hook to approve a version as Canon
 */
export const useApproveCanon = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceFileId,
      ...data
    }: {
      sourceFileId: string;
      version_id: string;
      notes?: string;
    }) => puddlejumpApi.approveCanon(sourceFileId, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: puddlejumpQueryKeys.versions(variables.sourceFileId),
      });
      queryClient.invalidateQueries({
        queryKey: puddlejumpQueryKeys.diff(variables.sourceFileId),
      });
      options?.onSuccess?.();
    },
    onError: (error) => options?.onError?.(error as Error),
  });
};

/**
 * Hook to get diff data for Canon approval
 */
export const useCanonDiff = (sourceFileId: string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: puddlejumpQueryKeys.diff(sourceFileId ?? ''),
    queryFn: () => puddlejumpApi.fetchDiff(sourceFileId!),
    enabled: !!sourceFileId,
    staleTime: 5_000,
  });

  return {
    diff: data ?? null,
    isLoading,
    error: error as Error | null,
  };
};

/**
 * Hook to check out a source file (soft checkout)
 */
export const useCheckout = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceFileId: string) => puddlejumpApi.checkoutFile(sourceFileId),
    onSuccess: (_result, sourceFileId) => {
      queryClient.invalidateQueries({
        queryKey: puddlejumpQueryKeys.checkout(sourceFileId),
      });
      options?.onSuccess?.();
    },
    onError: (error) => options?.onError?.(error as Error),
  });
};

/**
 * Hook to release checkout
 */
export const useCheckin = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceFileId: string) => puddlejumpApi.checkinFile(sourceFileId),
    onSuccess: (_result, sourceFileId) => {
      queryClient.invalidateQueries({
        queryKey: puddlejumpQueryKeys.checkout(sourceFileId),
      });
      options?.onSuccess?.();
    },
    onError: (error) => options?.onError?.(error as Error),
  });
};

/**
 * Hook to get checkout status
 */
export const useCheckoutStatus = (sourceFileId: string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: puddlejumpQueryKeys.checkout(sourceFileId ?? ''),
    queryFn: () => puddlejumpApi.fetchCheckoutStatus(sourceFileId!),
    enabled: !!sourceFileId,
    staleTime: 15_000,
    refetchInterval: 30_000, // Poll every 30s to show live checkout status
  });

  return {
    checkout: data?.checkout ?? null,
    isLoading,
    error: error as Error | null,
  };
};

// ============================================================================
// PUDDLEJUMP QUERY HOOKS
// ============================================================================

/**
 * Hook to check Puddlejump API health
 *
 * @example
 * ```tsx
 * const { health, isLoading } = usePuddlejumpHealth();
 * console.log(health?.phase); // "Phase 2: Import processing"
 * ```
 */
export const usePuddlejumpHealth = () => {
  const {
    data: health = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: puddlejumpQueryKeys.health(),
    queryFn: () => puddlejumpApi.checkPuddlejumpHealth(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  return {
    health,
    isLoading,
    error: error as Error | null,
  };
};

/**
 * Hook to get the user's personal Puddlejump library
 *
 * Automatically creates one if it doesn't exist.
 *
 * @example
 * ```tsx
 * const { puddlejump, isLoading, error } = usePersonalPuddlejump();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <div>
 *     <h1>{puddlejump.title}</h1>
 *     <p>{puddlejump.file_count} files</p>
 *     {puddlejump.items.map(item => (
 *       <FileRow key={item.id} item={item} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export const usePersonalPuddlejump = () => {
  const {
    data: puddlejump = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: puddlejumpQueryKeys.personal(),
    queryFn: () => puddlejumpApi.getPersonalPuddlejump(),
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  return {
    puddlejump,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to get a group's Puddlejump library manifest.
 * Requires `manage_puddlejump` permission in the group.
 */
export const useGroupPuddlejump = (groupSlug: string | null) => {
  const {
    data: library = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: puddlejumpQueryKeys.group(groupSlug ?? ''),
    queryFn: async () => {
      const response = await axiosInstance.get<PersonalPuddlejump>(
        `/api/puddlejump/${groupSlug}/`
      );
      return response.data;
    },
    enabled: !!groupSlug,
    staleTime: 60 * 1000,
  });

  return {
    library,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

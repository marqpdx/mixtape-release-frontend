// Puddlejump hooks
// React hooks for Puddlejump bundle import/export operations

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as puddlejumpApi from '@mixtape/api/clients/stackroom/puddlejumpApi';
import { PuddlejumpImportResponse, PersonalPuddlejump } from '@mixtape/core/types/puddlejump';
import { collectionQueryKeys } from './useCollections';

// ============================================================================
// QUERY KEY FACTORIES
// ============================================================================

export const puddlejumpQueryKeys = {
  all: ['puddlejump'] as const,
  health: () => [...puddlejumpQueryKeys.all, 'health'] as const,
  personal: () => [...puddlejumpQueryKeys.all, 'personal'] as const,
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
 * Hook to export a Library as Puddlejump bundle
 * (Phase 5 - not yet implemented)
 *
 * @example
 * ```tsx
 * const exportMutation = usePuddlejumpExport();
 *
 * const handleExport = async (libraryId: string) => {
 *   const blob = await exportMutation.mutateAsync(libraryId);
 *   // Trigger download
 *   const url = URL.createObjectURL(blob);
 *   const a = document.createElement('a');
 *   a.href = url;
 *   a.download = `collection-${Date.now()}.zip`;
 *   a.click();
 * };
 * ```
 */
export const usePuddlejumpExport = () => {
  return useMutation({
    mutationFn: (libraryId: string) => puddlejumpApi.exportPuddlejumpBundle(libraryId),
  });
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

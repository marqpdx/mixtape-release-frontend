// packages/api/src/hooks/workbench/useMillDraft.ts

import { useQuery } from '@tanstack/react-query';
import { workbenchApi, MillDraftDetail } from '../../clients/workbench/workbenchApi';

interface UseMillDraftOptions {
  draftId: string;
  enabled?: boolean;
}

interface UseMillDraftReturn {
  draft: MillDraftDetail | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch a single MillDraft by ID with React Query caching
 *
 * Benefits:
 * - Automatic caching (5 minute stale time)
 * - Background refetching
 * - Request deduplication
 * - Automatic retry on failure
 */
export function useMillDraft({ draftId, enabled = true }: UseMillDraftOptions): UseMillDraftReturn {
  const {
    data: draft = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['milldraft', draftId],

    queryFn: async () => {
      console.log('🔄 Fetching MillDraft:', draftId);
      return await workbenchApi.getDraft(draftId);
    },

    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes

    enabled: enabled && !!draftId,

    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    draft,
    isLoading,
    error: error as Error | null,
    refetch: () => { refetch(); },
  };
}

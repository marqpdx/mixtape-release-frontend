// packages/api/src/hooks/workbench/useMillDrafts.ts

import { useQuery } from '@tanstack/react-query';
import {
  workbenchApi,
  MillDraftListItem,
  MillDraftListParams,
  SponsorType,
} from '../../clients/workbench/workbenchApi';

interface UseMillDraftsOptions extends MillDraftListParams {
  enabled?: boolean;
}

interface UseMillDraftsReturn {
  drafts: MillDraftListItem[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch MillDrafts with React Query caching
 *
 * Benefits:
 * - Automatic caching (2 minute stale time)
 * - Background refetching
 * - Request deduplication
 * - Automatic retry on failure
 */
export function useMillDrafts(options: UseMillDraftsOptions): UseMillDraftsReturn {
  const { sponsor_type, sponsor_id, status, content_profile, source_type, enabled = true } = options;

  const {
    data: drafts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['milldrafts', sponsor_type, sponsor_id, status, content_profile, source_type],

    queryFn: async () => {
      console.log('🔄 Fetching MillDrafts:', options);
      return await workbenchApi.listDrafts({
        sponsor_type,
        sponsor_id,
        status,
        content_profile,
        source_type,
      });
    },

    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes

    enabled: enabled && !!sponsor_type && !!sponsor_id,

    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    drafts,
    isLoading,
    error: error as Error | null,
    refetch: () => { refetch(); },
  };
}

/**
 * Hook to fetch Review Queue (candidates only)
 */
export function useReviewQueue(
  sponsor_type: SponsorType,
  sponsor_id: string,
  options?: { enabled?: boolean }
): UseMillDraftsReturn {
  const enabled = options?.enabled ?? true;

  const {
    data: drafts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['review-queue', sponsor_type, sponsor_id],

    queryFn: async () => {
      console.log('🔄 Fetching Review Queue:', { sponsor_type, sponsor_id });
      return await workbenchApi.getReviewQueue({ sponsor_type, sponsor_id });
    },

    staleTime: 1 * 60 * 1000, // 1 minute (more frequent for queue)
    gcTime: 3 * 60 * 1000,    // 3 minutes

    enabled: enabled && !!sponsor_type && !!sponsor_id,

    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    drafts,
    isLoading,
    error: error as Error | null,
    refetch: () => { refetch(); },
  };
}

/**
 * Hook to fetch Active Drafts (in-progress drafts)
 */
export function useActiveDrafts(
  sponsor_type: SponsorType,
  sponsor_id: string,
  options?: { enabled?: boolean }
): UseMillDraftsReturn {
  const enabled = options?.enabled ?? true;

  const {
    data: drafts = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['active-drafts', sponsor_type, sponsor_id],

    queryFn: async () => {
      console.log('🔄 Fetching Active Drafts:', { sponsor_type, sponsor_id });
      return await workbenchApi.listDrafts({
        sponsor_type,
        sponsor_id,
        status: 'active',
      });
    },

    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 3 * 60 * 1000,    // 3 minutes

    enabled: enabled && !!sponsor_type && !!sponsor_id,

    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    drafts,
    isLoading,
    error: error as Error | null,
    refetch: () => { refetch(); },
  };
}

// packages/api/src/hooks/workbench/useContentProfiles.ts

import { useQuery } from '@tanstack/react-query';
import { workbenchApi, ContentProfileConfig } from '../../clients/workbench/workbenchApi';

interface UseContentProfilesReturn {
  profiles: ContentProfileConfig[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch all enabled content profiles with React Query caching
 *
 * Benefits:
 * - Automatic caching (30 minute stale time - configs rarely change)
 * - Background refetching
 * - Request deduplication
 * - Automatic retry on failure
 */
export function useContentProfiles(options?: { enabled?: boolean }): UseContentProfilesReturn {
  const enabled = options?.enabled ?? true;

  const {
    data: profiles = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['content-profiles'],

    queryFn: async () => {
      console.log('🔄 Fetching content profiles');
      return await workbenchApi.listProfiles();
    },

    staleTime: 30 * 60 * 1000, // 30 minutes (configs rarely change)
    gcTime: 60 * 60 * 1000,    // 60 minutes

    enabled,

    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    profiles,
    isLoading,
    error: error as Error | null,
    refetch: () => { refetch(); },
  };
}

interface UseContentProfileOptions {
  profileName: string;
  enabled?: boolean;
}

interface UseContentProfileReturn {
  profile: ContentProfileConfig | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch a specific content profile configuration
 */
export function useContentProfile({
  profileName,
  enabled = true,
}: UseContentProfileOptions): UseContentProfileReturn {
  const {
    data: profile = null,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['content-profile', profileName],

    queryFn: async () => {
      console.log('🔄 Fetching content profile:', profileName);
      return await workbenchApi.getProfile(profileName);
    },

    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 60 minutes

    enabled: enabled && !!profileName,

    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    profile,
    isLoading,
    error: error as Error | null,
    refetch: () => { refetch(); },
  };
}

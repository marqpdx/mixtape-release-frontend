// src/hooks/almanac/useCalendarOccurrences.ts
// ✅ React Query version with automatic caching and background refetching

import { useQuery } from '@tanstack/react-query';
import { almanacApi, CalendarOccurrence } from '../../clients/almanac/almanacApi';

interface UseCalendarOccurrencesOptions {
  groupSlug: string;
  startDate: Date;
  endDate: Date;
  filters?: {
    decorator?: string;
    kind?: 'event' | 'gathering';
  };
  enabled?: boolean; // Allow disabling the query
}

interface UseCalendarOccurrencesReturn {
  occurrences: CalendarOccurrence[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch calendar occurrences with React Query caching
 *
 * Benefits:
 * - Automatic caching (5 minute stale time)
 * - Background refetching
 * - Request deduplication
 * - Automatic retry on failure
 */
export function useCalendarOccurrences({
  groupSlug,
  startDate,
  endDate,
  filters,
  enabled = true,
}: UseCalendarOccurrencesOptions): UseCalendarOccurrencesReturn {
  const {
    data: occurrences = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    // ✅ Unique query key based on all parameters
    queryKey: ['calendar', groupSlug, startDate.toISOString(), endDate.toISOString(), filters],

    // ✅ Query function to fetch data
    queryFn: async () => {
      console.log('🔄 Fetching calendar occurrences:', { groupSlug, startDate, endDate, filters });
      return await almanacApi.getGroupCalendar(groupSlug, startDate, endDate, filters);
    },

    // ✅ Cache configuration
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 min
    gcTime: 10 * 60 * 1000,   // 10 minutes - keep in cache for 10 min

    // ✅ Only fetch if enabled and we have required params
    enabled: enabled && !!groupSlug && !!startDate && !!endDate,

    // ✅ Retry configuration
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    occurrences,
    isLoading,
    error: error as Error | null,
    refetch: () => { refetch(); },
  };
}

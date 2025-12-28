// src/hooks/useEventRSVPBreakdown.ts

import { useState, useCallback, useEffect } from 'react';
import * as almanacApi from '@mixtape/api/clients/almanac/almanacApi';

export interface RSVPBreakdown {
  going: number;
  maybe: number;
  not_going: number;
}

export function useEventRSVPBreakdown(groupSlug: string, eventId: string) {
  const [breakdown, setBreakdown] = useState<RSVPBreakdown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBreakdown = useCallback(async () => {
    if (!groupSlug || !eventId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📊 Fetching RSVP breakdown:', { groupSlug, eventId });

      const data = await almanacApi.fetchGroupEventRSVPBreakdown(groupSlug, eventId);

      console.log('✅ RSVP breakdown fetched:', data);
      setBreakdown(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch RSVP breakdown';
      console.error('❌ Error fetching RSVP breakdown:', errorMessage);
      setError(errorMessage);
      // Fallback to 0s if endpoint doesn't exist
      setBreakdown({ going: 0, maybe: 0, not_going: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [groupSlug, eventId]);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  return { breakdown, isLoading, error, refetch: fetchBreakdown };
}

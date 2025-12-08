// src/hooks/useEventAttendees.ts

import { useState, useCallback, useEffect } from 'react';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';

export interface EventAttendee {
  id: string;
  name: string;
  status: 'going' | 'maybe' | 'not_going';
  rsvp_date: string;
  notes?: string;
}

export function useEventAttendees(groupSlug: string, eventId: string) {
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendees = useCallback(async () => {
    if (!groupSlug || !eventId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('👥 bbb Fetching attendees:', { groupSlug, eventId });

      const response = await axiosInstance.get(
        `/api/groups/${groupSlug}/events/${eventId}/attendees`
      );

      console.log('✅ bbb Raw response:', response.data);

      // Check if response is paginated (has 'results' key)
      const data = response.data.results || response.data;

      console.log('✅ bbb Extracted data:', data);
      console.log('✅ bbb First attendee:', data[0]);

      setAttendees(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch attendees';
      console.error('❌ bbb Error fetching attendees:', errorMessage);
      setError(errorMessage);
      setAttendees([]);
    } finally {
      setIsLoading(false);
    }
  }, [groupSlug, eventId]);

  useEffect(() => {
    fetchAttendees();
  }, [fetchAttendees]);

  return { attendees, isLoading, error, refetch: fetchAttendees };
}
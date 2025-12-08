// src/hooks/useEventRSVP.ts

import { useState } from 'react';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import { toaster } from "@/components/ui/toaster";


interface RSVPPayload {
  status: 'going' | 'maybe' | 'not_going';
  registration_notes?: string;
  limit_to?: number | null;
}

interface RSVPResponse {
  attendees_created: number;
  status: string;
  limit: number | null;
}

export function useEventRSVP() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitRSVP = async (
    groupSlug: string,
    eventId: string,
    payload: RSVPPayload
  ): Promise<RSVPResponse | null> => {
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('📝 Submitting RSVP:', { groupSlug, eventId, payload });

      const response = await axiosInstance.post(
        `/api/groups/${groupSlug}/events/${eventId}/rsvp`,
        payload
      );

      toaster.create({
        title: 'Could not load editor',
        description: `You're marked as "${payload.status}" for this event!`,
        type: 'error'
      });

      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit RSVP';
      console.error('❌ RSVP failed:', errorMessage);
      setError(errorMessage);

      toaster.create({
        title: 'Could not load editor',
        description: errorMessage,
        type: 'error'
      });

      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError(null);

  return {
    submitRSVP,
    isSubmitting,
    error,
    clearError,
  };
}
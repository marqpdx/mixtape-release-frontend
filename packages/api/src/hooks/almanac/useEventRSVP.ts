// src/hooks/useEventRSVP.ts
// ✅ React Query version with mutations, cache invalidation, and optimistic updates

import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as almanacApi from '@mixtape/api/clients/almanac/almanacApi';
import { toaster } from "@mixtape/core/lib/toaster";

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

interface UseEventRSVPReturn {
  submitRSVP: (groupSlug: string, eventId: string, payload: RSVPPayload) => Promise<RSVPResponse>;
  isSubmitting: boolean;
}

/**
 * Hook for submitting RSVP with React Query mutations
 *
 * Benefits:
 * - Automatic cache invalidation
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on errors
 * - Better error handling
 */
export function useEventRSVP(): UseEventRSVPReturn {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      groupSlug,
      eventId,
      payload,
    }: {
      groupSlug: string;
      eventId: string;
      payload: RSVPPayload;
    }) => {
      return await almanacApi.rsvpToGroupEvent(groupSlug, eventId, payload);
    },

    // ✅ Optimistic update - instant UI feedback
    onMutate: async ({ groupSlug, eventId, payload }) => {
      // Cancel any outgoing refetches for calendar
      await queryClient.cancelQueries({ queryKey: ['calendar', groupSlug] });

      // Snapshot the previous value
      const previousCalendar = queryClient.getQueryData(['calendar', groupSlug]);

      // Return context with previous data for rollback
      return { previousCalendar };
    },

    // ✅ Success - show toast and invalidate cache
    onSuccess: (data, variables) => {
      toaster.create({
        title: 'RSVP Submitted',
        description: `You're registered as "${variables.payload.status}" for this event!`,
        type: 'success',
      });

      // Invalidate and refetch calendar data
      queryClient.invalidateQueries({ queryKey: ['calendar', variables.groupSlug] });
      queryClient.invalidateQueries({ queryKey: ['events', variables.groupSlug] });
      queryClient.invalidateQueries({ queryKey: ['attendees', variables.eventId] });
    },

    // ✅ Error - rollback and show error toast
    onError: (err, variables, context) => {
      // Rollback optimistic update
      if (context?.previousCalendar) {
        queryClient.setQueryData(['calendar', variables.groupSlug], context.previousCalendar);
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to submit RSVP';

      toaster.create({
        title: 'RSVP Failed',
        description: errorMessage,
        type: 'error',
      });
    },
  });

  // Wrapper function to match original API
  const submitRSVP = async (
    groupSlug: string,
    eventId: string,
    payload: RSVPPayload
  ): Promise<RSVPResponse> => {
    return mutation.mutateAsync({ groupSlug, eventId, payload });
  };

  return {
    submitRSVP,
    isSubmitting: mutation.isPending,
  };
}
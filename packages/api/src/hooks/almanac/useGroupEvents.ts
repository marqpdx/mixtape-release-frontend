// src/hooks/almanac/useGroupEvents.ts - AUTO-LOADS ON MOUNT

import { useState, useCallback, useEffect } from 'react';
import * as almanacApi from '../../clients/almanac/almanacApi';
import { EventResponse, EventCreatePayload } from '../../clients/almanac/almanacApi';

interface UseGroupEventsReturn {
  // State
  events: EventResponse[];
  isLoading: boolean;
  error: string | null;

  // Methods
  loadEvents: (params?: { status?: 'draft' | 'published' | 'archived'; kind?: 'event' | 'gathering'; decorator?: string }) => Promise<void>;
  createEvent: (payload: EventCreatePayload) => Promise<EventResponse>;
  deleteEvent: (eventId: string) => Promise<void>;
  updateEvent: (eventId: string, payload: Partial<EventCreatePayload>) => Promise<EventResponse>;
  getEvent: (eventId: string) => Promise<EventResponse>;
  publishEvent: (eventId: string) => Promise<EventResponse>;
  unpublishEvent: (eventId: string) => Promise<EventResponse>;

  // Utilities
  clearError: () => void;
}

export function useGroupEvents(groupSlug: string): UseGroupEventsReturn {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =========================================================================
  // LIST EVENTS
  // =========================================================================

  const loadEvents = useCallback(
    async (params?: {
      status?: 'draft' | 'published' | 'archived';
      kind?: 'event' | 'gathering';
      decorator?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('🔄 Loading events for group:', groupSlug, 'params:', params);
        const data = await almanacApi.fetchGroupEvents(groupSlug, params);
        console.log('✅ Parsed events:', data);
        setEvents(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load events';
        console.error('❌ Failed to load events:', errorMessage);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [groupSlug]
  );

  // ✅ AUTO-LOAD events on mount or when groupSlug changes
  // ✅ With request cancellation to prevent race conditions
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log('🎯 useGroupEvents mounted/changed, loading for:', groupSlug);
        const data = await almanacApi.fetchGroupEvents(groupSlug);

        if (!cancelled) {
          console.log('✅ Parsed events:', data);
          setEvents(data);
        }
      } catch (err: any) {
        // Don't set error if request was aborted
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') {
          console.log('🚫 Request cancelled for:', groupSlug);
          return;
        }

        if (!cancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load events';
          console.error('❌ Failed to load events:', errorMessage);
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchEvents();

    // Cleanup: cancel request when component unmounts or groupSlug changes
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [groupSlug]);

  // =========================================================================
  // CREATE EVENT
  // =========================================================================

  const createEvent = useCallback(
    async (payload: EventCreatePayload): Promise<EventResponse> => {
      setError(null);
      try {
        const newEvent = await almanacApi.createGroupEvent(groupSlug, payload);
        console.log('✅ Event created:', newEvent);
        setEvents(prev => [newEvent, ...prev]);
        return newEvent;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
        console.error('❌ Failed to create event:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [groupSlug]
  );

  // =========================================================================
  // UPDATE EVENT
  // =========================================================================

  const updateEvent = useCallback(
    async (eventId: string, payload: Partial<EventCreatePayload>): Promise<EventResponse> => {
      setError(null);
      try {
        const updatedEvent = await almanacApi.updateGroupEvent(groupSlug, eventId, payload);
        console.log('✅ Event updated:', updatedEvent);
        setEvents(prev =>
          prev.map(event => (event.id === eventId ? updatedEvent : event))
        );
        return updatedEvent;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
        console.error('❌ Failed to update event:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [groupSlug]
  );

  // =========================================================================
  // DELETE EVENT
  // =========================================================================

  const deleteEvent = useCallback(
    async (eventId: string): Promise<void> => {
      setError(null);
      try {
        console.log('🗑️ Deleting event:', eventId);
        await almanacApi.deleteGroupEvent(groupSlug, eventId);
        setEvents(prev => prev.filter(e => e.id !== eventId));
        console.log('✅ Event deleted');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
        console.error('❌ Failed to delete event:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [groupSlug]
  );

  // =========================================================================
  // GET SINGLE EVENT
  // =========================================================================

  const getEvent = useCallback(
    async (eventId: string): Promise<EventResponse> => {
      setError(null);
      try {
        return await almanacApi.fetchGroupEvent(groupSlug, eventId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch event';
        console.error('❌ Failed to fetch event:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [groupSlug]
  );

  // =========================================================================
  // PUBLISH EVENT
  // =========================================================================

  const publishEvent = useCallback(
    async (eventId: string): Promise<EventResponse> => {
      setError(null);
      try {
        console.log('🚀 Publishing event:', eventId);
        const updatedEvent = await almanacApi.publishGroupEvent(groupSlug, eventId);
        console.log('✅ Event published, response:', updatedEvent);
        console.log('   Status:', updatedEvent.status);
        console.log('   Published at:', updatedEvent.published_at);
        setEvents(prev =>
          prev.map(event => (event.id === eventId ? updatedEvent : event))
        );
        return updatedEvent;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to publish event';
        console.error('❌ Failed to publish event:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [groupSlug]
  );

  // =========================================================================
  // UNPUBLISH EVENT
  // =========================================================================

  const unpublishEvent = useCallback(
    async (eventId: string): Promise<EventResponse> => {
      setError(null);
      try {
        console.log('🔄 Unpublishing event:', eventId);
        const updatedEvent = await almanacApi.unpublishGroupEvent(groupSlug, eventId);
        console.log('✅ Event unpublished, response:', updatedEvent);
        console.log('   Status:', updatedEvent.status);
        setEvents(prev =>
          prev.map(event => (event.id === eventId ? updatedEvent : event))
        );
        return updatedEvent;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to unpublish event';
        console.error('❌ Failed to unpublish event:', errorMessage);
        setError(errorMessage);
        throw err;
      }
    },
    [groupSlug]
  );

  // =========================================================================
  // UTILITIES
  // =========================================================================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    events,
    isLoading,
    error,
    loadEvents,
    createEvent,
    deleteEvent,
    updateEvent,
    getEvent,
    publishEvent,
    unpublishEvent,
    clearError,
  };
}
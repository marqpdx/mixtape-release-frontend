// src/components/groups/GroupEventsWorkArea.tsx - UPDATED

/**
 * Updated Group Events Management WorkArea
 * NOW INCLUDES: Filtering, RSVP breakdown, attendee list, event details, sharing
 */

import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Badge,
  Menu,
  IconButton,
  Spinner,
  Dialog,
} from '@chakra-ui/react';
import {
  IconPlus,
  IconUsers,
  IconEdit,
  IconTrash,
  IconCopy,
  IconDots,
} from '@tabler/icons-react';
import { useColorModeValue } from '@components/ui/color-mode';
import { ErrorAlert } from '@components/ui/alerts/ErrorAlert';
import { Divider } from '@components/common/Divider';
import { GroupEventCreateWorkArea } from './GroupEventCreateWorkArea';
import { GroupEventEditWorkArea } from './GroupEventEditWorkArea';
import { EventCard } from '../events/EventCard';
import { EventFilters, EventFilterOptions } from '../events/EventFilters';
import { useGroupEvents } from '@hooks/useGroupEvents';
import { EventResponse } from 'lib/almanacApi';
import { createStandaloneToast } from "@chakra-ui/toast";

const { toast } = createStandaloneToast();

interface GroupEventsWorkAreaProps {
  groupSlug: string;
}

export function GroupEventsWorkArea({ groupSlug }: GroupEventsWorkAreaProps) {
  // Modals & editing
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventResponse | null>(null);
  const [deleteConfirmEventId, setDeleteConfirmEventId] = useState<string | null>(null);

  // Filtering
  const [filters, setFilters] = useState<EventFilterOptions>({
    status: 'all',
    type: 'all',
    dateRange: 'all',
    search: '',
  });

  // Fetch events
  const {
    events,
    isLoading,
    error,
    loadEvents,
    createEvent,
    deleteEvent,
    publishEvent,
    unpublishEvent,
    clearError,
  } = useGroupEvents(groupSlug);

  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // =========================================================================
  // HELPERS
  // =========================================================================

  const isGathering = (event: EventResponse): boolean => {
    return !!event.gathering_extension;
  };

  const getEventStartDate = (event: EventResponse): Date | null => {
    const startStr = event.next_occurrence?.start || event.series?.next_occurrence?.start;
    return startStr ? new Date(startStr) : null;
  };

  const getEventEndDate = (event: EventResponse): Date | null => {
    const endStr = event.next_occurrence?.end || event.series?.next_occurrence?.end;
    return endStr ? new Date(endStr) : null;
  };

  const getAttendeeCount = (event: EventResponse): number => {
    return event.next_occurrence?.attendee_count ||
           (event.upcoming_occurrences?.[0]?.attendee_count) ||
           0;
  };

  // =========================================================================
  // FILTERING LOGIC
  // =========================================================================

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Status filter
      if (filters.status !== 'all' && event.status !== filters.status) {
        return false;
      }

      // Type filter
      if (filters.type === 'gathering' && !isGathering(event)) return false;
      if (filters.type === 'single' && isGathering(event)) return false;

      // Date range filter
      if (filters.dateRange === 'upcoming') {
        const startDate = getEventStartDate(event);
        if (!startDate || startDate <= new Date() || event.status !== 'published') return false;
      }
      if (filters.dateRange === 'past') {
        const endDate = getEventEndDate(event);
        if (!endDate || endDate > new Date() || event.status !== 'published') return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          event.title.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [events, filters]);

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setDeleteConfirmEventId(null);

      toast({
        title: 'Event deleted',
        description: 'The event has been permanently removed',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      // Error is shown from hook error state
    }
  };

  const handleDuplicateEvent = async (event: EventResponse) => {
    try {
      const eventType = isGathering(event) ? 'gathering' : 'single';

      const newEvent = await createEvent({
        event_type: eventType,
        title: `${event.title} (Copy)`,
        description: event.description,
        location: event.location,
        event_format: event.event_format,
        max_attendees: event.max_attendees || undefined,
        registration_required: event.registration_required,
        registration_deadline_hours: event.registration_deadline_hours,
        decorators: event.decorators.map((dec) => ({
          slug: dec.decorator.slug,
          context_data: {},
        })),
      });

      toast({
        title: 'Event duplicated',
        description: `${newEvent.title} created as draft`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch {
      // Error is shown from hook error state
    }
  };

  const handlePublishEvent = async (eventId: string) => {
    try {
      await publishEvent(eventId);

      toast({
        title: 'Event published',
        description: 'Your event is now live',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Publish failed',
        description: err instanceof Error ? err.message : 'Could not publish event',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleUnpublishEvent = async (eventId: string) => {
    try {
      await unpublishEvent(eventId);

      toast({
        title: 'Event unpublished',
        description: 'Your event is now in draft status',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Unpublish failed',
        description: err instanceof Error ? err.message : 'Could not unpublish event',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleEventCreated = async () => {
    setCreateModalOpen(false);
    clearError();
    loadEvents();
  };

  const handleEventUpdated = async () => {
    setEditingEvent(null);
    clearError();
    loadEvents();
  };

  // =========================================================================
  // CATEGORY COUNTS
  // =========================================================================

  const draftEvents = filteredEvents.filter((e) => e.status === 'draft');
  const upcomingEvents = filteredEvents.filter((e) => {
    const startDate = getEventStartDate(e);
    return startDate && startDate > new Date() && e.status === 'published';
  });
  const pastEvents = filteredEvents.filter((e) => {
    const endDate = getEventEndDate(e);
    return endDate && endDate <= new Date() && e.status === 'published';
  });

  // =========================================================================
  // RENDER
  // =========================================================================

  return (
    <Box p={6} bg={bgColor} minH="100vh">
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" gap={1}>
            <Text fontSize="2xl" fontWeight="bold">
              Group Events
            </Text>
            <Text color="gray.600">
              Manage events and gatherings for your community
            </Text>
          </VStack>

          <Button
            colorScheme="green"
            onClick={() => {
              clearError();
              setCreateModalOpen(true);
            }}
          >
            <IconPlus />
            Create Event
          </Button>
        </HStack>

        {/* Error Display */}
        {error && <ErrorAlert description={error} />}

        {/* Filters */}
        {!isLoading && (
          <EventFilters
            filters={filters}
            onFiltersChange={setFilters}
          />
        )}

        {/* Loading State */}
        {isLoading ? (
          <Box textAlign="center" py={12}>
            <Spinner size="lg" color="green.500" mb={4} />
            <Text color="gray.600">Loading events...</Text>
          </Box>
        ) : filteredEvents.length === 0 ? (
          <Box textAlign="center" py={12}>
            <Text color="gray.600" fontSize="lg">
              No events found matching your filters
            </Text>
            {filters.search || filters.status !== 'all' || filters.type !== 'all' || filters.dateRange !== 'all' ? (
              <Button
                mt={4}
                variant="outline"
                onClick={() =>
                  setFilters({
                    status: 'all',
                    type: 'all',
                    dateRange: 'all',
                    search: '',
                  })
                }
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                mt={4}
                colorScheme="green"
                onClick={() => setCreateModalOpen(true)}
              >
                Create Your First Event
              </Button>
            )}
          </Box>
        ) : (
          <>
            {/* Draft Events */}
            {draftEvents.length > 0 && (
              <VStack align="stretch" gap={3}>
                <Text fontSize="lg" fontWeight="semibold">
                  Drafts ({draftEvents.length})
                </Text>

                <VStack align="stretch" gap={3}>
                  {draftEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      groupSlug={groupSlug}
                      onDelete={(id) => setDeleteConfirmEventId(id)}
                      onEdit={setEditingEvent}
                      onDuplicate={handleDuplicateEvent}
                      onPublish={handlePublishEvent}
                      onUnpublish={handleUnpublishEvent}
                      attendeeCount={getAttendeeCount(event)}
                      isDraft
                    />
                  ))}
                </VStack>
              </VStack>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <VStack align="stretch" gap={3}>
                <Text fontSize="lg" fontWeight="semibold">
                  Upcoming Events ({upcomingEvents.length})
                </Text>

                <VStack align="stretch" gap={3}>
                  {upcomingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      groupSlug={groupSlug}
                      onDelete={(id) => setDeleteConfirmEventId(id)}
                      onEdit={setEditingEvent}
                      onDuplicate={handleDuplicateEvent}
                      onPublish={handlePublishEvent}
                      onUnpublish={handleUnpublishEvent}
                      attendeeCount={getAttendeeCount(event)}
                    />
                  ))}
                </VStack>
              </VStack>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
              <>
                <Divider />

                <VStack align="stretch" gap={3}>
                  <Text fontSize="lg" fontWeight="semibold">
                    Past Events ({pastEvents.length})
                  </Text>

                  <VStack align="stretch" gap={3}>
                    {pastEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        groupSlug={groupSlug}
                        onDelete={(id) => setDeleteConfirmEventId(id)}
                        onEdit={setEditingEvent}
                        onDuplicate={handleDuplicateEvent}
                        onPublish={handlePublishEvent}
                        onUnpublish={handleUnpublishEvent}
                        attendeeCount={getAttendeeCount(event)}
                        isPast
                      />
                    ))}
                  </VStack>
                </VStack>
              </>
            )}
          </>
        )}

        {/* Create Event Modal */}
        {createModalOpen && (
          <GroupEventCreateWorkArea
            groupSlug={groupSlug}
            isOpen={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onEventCreated={handleEventCreated}
          />
        )}

        {/* Edit Event Modal */}
        {editingEvent && (
          <GroupEventEditWorkArea
            groupSlug={groupSlug}
            event={editingEvent}
            isOpen={!!editingEvent}
            onClose={() => setEditingEvent(null)}
            onEventUpdated={handleEventUpdated}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmEventId && (
          <Dialog.Root
            open={!!deleteConfirmEventId}
            onOpenChange={() => setDeleteConfirmEventId(null)}
          >
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>Delete Event?</Dialog.Header>
                <Dialog.Body>
                  <Text>
                    Are you sure you want to permanently delete this event? This action cannot be undone.
                  </Text>
                </Dialog.Body>
                <Dialog.Footer>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmEventId(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={() => deleteConfirmEventId && handleDeleteEvent(deleteConfirmEventId)}
                  >
                    Delete Event
                  </Button>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Dialog.Root>
        )}
      </VStack>
    </Box>
  );
}
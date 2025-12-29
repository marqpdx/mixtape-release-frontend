// src/components/almanac/EventPublishedList.tsx
'use client';

import { Box, Button, HStack, Spinner, Table, Text, VStack, Badge } from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGroupEvents, unpublishGroupEvent } from '@mixtape/api/clients/almanac/almanacApi';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { formatDateTime } from '@/lib/utils/dateFormatters';
import { toaster } from '@mixtape/core/lib/toaster';

interface EventPublishedListProps {
  groupSlug: string;
  onViewEvent?: (eventSlug: string) => void;
}

export function EventPublishedList({ groupSlug, onViewEvent }: EventPublishedListProps) {
  const queryClient = useQueryClient();

  // Fetch published events
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['almanac', 'events', 'published', groupSlug],
    queryFn: () => fetchGroupEvents(groupSlug, { status: 'published' }),
  });

  // Unpublish mutation
  const unpublishMutation = useMutation({
    mutationFn: (eventSlug: string) => unpublishGroupEvent(groupSlug, eventSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almanac', 'events', 'published', groupSlug] });
      queryClient.invalidateQueries({ queryKey: ['almanac', 'events', 'drafts', groupSlug] });
      toaster.create({
        title: 'Event Unpublished',
        description: 'Event moved back to drafts',
        type: 'success',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Unpublish Failed',
        description: error.message || 'Could not unpublish event',
        type: 'error',
        duration: 5000,
      });
    },
  });

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={4} color="gray.500">Loading published events...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <MixtapeAlert
        status="error"
        title="Failed to Load Events"
        description={(error as Error).message}
      />
    );
  }

  if (!events || events.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="lg" color="gray.600" mb={4}>
          No published events
        </Text>
        <Text fontSize="sm" color="gray.500">
          Publish a draft event to see it here.
        </Text>
      </Box>
    );
  }

  // Separate upcoming and past events
  const now = new Date();
  const upcomingEvents = events.filter((event: any) => {
    const eventDate = event.next_occurrence?.start;
    return eventDate && new Date(eventDate) >= now;
  });
  const pastEvents = events.filter((event: any) => {
    const eventDate = event.next_occurrence?.start;
    return eventDate && new Date(eventDate) < now;
  });

  return (
    <VStack align="stretch" gap={6}>
      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <Box>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="xl" fontWeight="bold">Upcoming Events</Text>
            <Badge colorScheme="green">{upcomingEvents.length} upcoming</Badge>
          </HStack>

          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Title</Table.ColumnHeader>
                  <Table.ColumnHeader>Start</Table.ColumnHeader>
                  <Table.ColumnHeader>Location</Table.ColumnHeader>
                  <Table.ColumnHeader>Format</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {upcomingEvents.map((event: any) => (
                  <Table.Row key={event.id}>
                    <Table.Cell fontWeight="medium">{event.title}</Table.Cell>
                    <Table.Cell>
                      {event.next_occurrence?.start
                        ? formatDateTime(event.next_occurrence.start)
                        : 'No date set'}
                    </Table.Cell>
                    <Table.Cell>{event.location || '—'}</Table.Cell>
                    <Table.Cell>
                      <Badge size="sm" variant="subtle">
                        {event.event_format}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack justify="flex-end" gap={2}>
                        {onViewEvent && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onViewEvent(event.slug)}
                          >
                            View
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          colorScheme="orange"
                          onClick={() => unpublishMutation.mutate(event.slug)}
                          loading={unpublishMutation.isPending}
                        >
                          Unpublish
                        </Button>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <Box>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="xl" fontWeight="bold">Past Events</Text>
            <Badge colorScheme="gray">{pastEvents.length} past</Badge>
          </HStack>

          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Title</Table.ColumnHeader>
                  <Table.ColumnHeader>Date</Table.ColumnHeader>
                  <Table.ColumnHeader>Location</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="right">Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {pastEvents.map((event: any) => (
                  <Table.Row key={event.id} opacity={0.7}>
                    <Table.Cell fontWeight="medium">{event.title}</Table.Cell>
                    <Table.Cell>
                      {event.next_occurrence?.start
                        ? formatDateTime(event.next_occurrence.start)
                        : 'No date set'}
                    </Table.Cell>
                    <Table.Cell>{event.location || '—'}</Table.Cell>
                    <Table.Cell>
                      <HStack justify="flex-end" gap={2}>
                        {onViewEvent && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onViewEvent(event.slug)}
                          >
                            View
                          </Button>
                        )}
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>
      )}
    </VStack>
  );
}

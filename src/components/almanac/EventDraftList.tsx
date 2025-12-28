// src/components/almanac/EventDraftList.tsx
'use client';

import { Box, Button, HStack, Spinner, Table, Text, VStack, Badge } from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGroupEvents, publishGroupEvent, deleteGroupEvent } from '@mixtape/api/clients/almanac/almanacApi';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { formatDateTime } from '@/lib/utils/dateFormatters';
import { toaster } from '@/components/ui/toaster';

interface EventDraftListProps {
  groupSlug: string;
  onViewEvent?: (eventSlug: string) => void;
}

export function EventDraftList({ groupSlug, onViewEvent }: EventDraftListProps) {
  const queryClient = useQueryClient();

  // Fetch draft events
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['almanac', 'events', 'drafts', groupSlug],
    queryFn: () => fetchGroupEvents(groupSlug, { status: 'draft' }),
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: (eventSlug: string) => publishGroupEvent(groupSlug, eventSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almanac', 'events', 'drafts', groupSlug] });
      queryClient.invalidateQueries({ queryKey: ['almanac', 'events', 'published', groupSlug] });
      toaster.create({
        title: 'Event Published',
        description: 'Event is now visible to members',
        type: 'success',
        duration: 3000,

      });
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Publish Failed',
        description: error.message || 'Could not publish event',
        type: 'error',
        duration: 5000,

      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (eventSlug: string) => deleteGroupEvent(groupSlug, eventSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almanac', 'events', 'drafts', groupSlug] });
      toaster.create({
        title: 'Event Deleted',
        description: 'Event has been successfully deleted',
        type: 'success',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Delete Failed',
        description: error.message || 'Could not delete event',
        type: 'error',
        duration: 5000,
      });
    },
  });

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={4} color="gray.500">Loading draft events...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <MixtapeAlert
        status="error"
        title="Failed to Load Drafts"
        description={(error as Error).message}
      />
    );
  }

  if (!events || events.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text fontSize="lg" color="gray.600" mb={4}>
          No draft events
        </Text>
        <Text fontSize="sm" color="gray.500">
          Create events using the Mill or create a new event manually.
        </Text>
      </Box>
    );
  }

  // DEBUG: Log the first event to see its structure
  if (events && events.length > 0) {
    console.log('[EventDraftList] First event data:', JSON.stringify(events[0], null, 2));
  }

  return (
    <VStack align="stretch" gap={4}>
      <HStack justify="space-between">
        <Text fontSize="xl" fontWeight="bold">Draft Events</Text>
        <Badge colorScheme="orange">{events.length} draft{events.length !== 1 ? 's' : ''}</Badge>
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
            {events.map((event: any) => (
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
                      colorScheme="green"
                      onClick={() => publishMutation.mutate(event.slug)}
                      loading={publishMutation.isPending}
                    >
                      Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => {
                        if (confirm(`Delete "${event.title}"?`)) {
                          deleteMutation.mutate(event.slug);
                        }
                      }}
                      loading={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </VStack>
  );
}

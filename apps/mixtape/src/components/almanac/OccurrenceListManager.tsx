// src/components/almanac/OccurrenceListManager.tsx
'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
  Table,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { formatDateTime } from '@/lib/utils/dateFormatters';
import { toaster } from '@mixtape/core/lib/toaster';
import { OccurrenceEditModal } from './OccurrenceEditModal';
import { OccurrenceAttendeesModal } from './OccurrenceAttendeesModal';

interface OccurrenceListManagerProps {
  groupSlug: string;
  eventSlug: string;
  seriesId: string;
}

interface Occurrence {
  id: string;
  start: string;
  end: string;
  effective_title: string;
  effective_location: string;
  title_override?: string;
  location_override?: string;
  is_cancelled: boolean;
  cancellation_reason?: string;
  attendee_count: number;
  is_full: boolean;
  is_past: boolean;
  is_happening_now: boolean;
}

export function OccurrenceListManager({ groupSlug, eventSlug, seriesId }: OccurrenceListManagerProps) {
  const queryClient = useQueryClient();
  const [editingOccurrence, setEditingOccurrence] = useState<Occurrence | null>(null);
  const [viewingAttendeesFor, setViewingAttendeesFor] = useState<Occurrence | null>(null);

  // Fetch all occurrences for this series
  const { data: occurrences, isLoading, error } = useQuery<Occurrence[]>({
    queryKey: ['almanac', 'series', seriesId, 'occurrences'],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupSlug}/almanac/${eventSlug}/occurrences`);
      if (!response.ok) throw new Error('Failed to fetch occurrences');
      return response.json();
    },
  });

  // Cancel occurrence mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ occurrenceId, reason }: { occurrenceId: string; reason: string }) => {
      const response = await fetch(
        `/api/groups/${groupSlug}/almanac/${eventSlug}/occurrences/${occurrenceId}/cancel`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancellation_reason: reason }),
        }
      );
      if (!response.ok) throw new Error('Failed to cancel occurrence');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almanac', 'series', seriesId, 'occurrences'] });
      toaster.create({
        title: 'Occurrence Cancelled',
        description: 'The occurrence has been cancelled successfully',
        type: 'success',
        duration: 3000,
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Could not cancel occurrence';
      toaster.create({
        title: 'Cancellation Failed',
        description: message,
        type: 'error',
        duration: 5000,
      });
    },
  });

  const handleCancel = (occurrenceId: string) => {
    const reason = prompt('Enter cancellation reason (optional):');
    if (reason !== null) {
      cancelMutation.mutate({ occurrenceId, reason: reason || 'Cancelled by organizer' });
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={4} color="gray.500">Loading occurrences...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <MixtapeAlert
        status="error"
        title="Failed to Load Occurrences"
        description={(error as Error).message}
      />
    );
  }

  if (!occurrences || occurrences.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500">No occurrences found</Text>
      </Box>
    );
  }

  // Separate upcoming and past occurrences
  const upcoming = occurrences.filter(o => !o.is_past);
  const past = occurrences.filter(o => o.is_past);

  return (
    <VStack align="stretch" gap={6}>
      {/* Summary */}
      <HStack gap={4}>
        <Box>
          <Text fontSize="sm" color="gray.600">Total Occurrences</Text>
          <Text fontSize="2xl" fontWeight="bold">{occurrences.length}</Text>
        </Box>
        <Box>
          <Text fontSize="sm" color="gray.600">Upcoming</Text>
          <Text fontSize="2xl" fontWeight="bold" color="blue.600">{upcoming.length}</Text>
        </Box>
        <Box>
          <Text fontSize="sm" color="gray.600">Past</Text>
          <Text fontSize="2xl" fontWeight="bold" color="gray.500">{past.length}</Text>
        </Box>
        <Box>
          <Text fontSize="sm" color="gray.600">Cancelled</Text>
          <Text fontSize="2xl" fontWeight="bold" color="red.600">
            {occurrences.filter(o => o.is_cancelled).length}
          </Text>
        </Box>
      </HStack>

      {/* Upcoming Occurrences */}
      {upcoming.length > 0 && (
        <Box>
          <Text fontWeight="semibold" mb={3} fontSize="lg">Upcoming Occurrences</Text>
          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Date & Time</Table.ColumnHeader>
                  <Table.ColumnHeader>Title</Table.ColumnHeader>
                  <Table.ColumnHeader>Location</Table.ColumnHeader>
                  <Table.ColumnHeader>RSVPs</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Actions</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {upcoming.map((occurrence) => (
                  <Table.Row key={occurrence.id}>
                    <Table.Cell>
                      <VStack align="start" gap={0}>
                        <Text fontWeight="medium" fontSize="sm">
                          {formatDateTime(occurrence.start)}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {new Date(occurrence.end).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </Text>
                      </VStack>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm">{occurrence.effective_title}</Text>
                      {occurrence.title_override && (
                        <Badge size="sm" colorScheme="purple" ml={2}>Custom</Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm">{occurrence.effective_location || '-'}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack>
                        {occurrence.attendee_count > 0 ? (
                          <Button
                            size="xs"
                            variant="ghost"
                            colorScheme="blue"
                            onClick={() => setViewingAttendeesFor(occurrence)}
                          >
                            {occurrence.attendee_count}
                          </Button>
                        ) : (
                          <Text fontSize="sm">0</Text>
                        )}
                        {occurrence.is_full && (
                          <Badge colorScheme="red" size="sm">Full</Badge>
                        )}
                      </HStack>
                    </Table.Cell>
                    <Table.Cell>
                      {occurrence.is_cancelled ? (
                        <Badge colorScheme="red">Cancelled</Badge>
                      ) : occurrence.is_happening_now ? (
                        <Badge colorScheme="green">Happening Now</Badge>
                      ) : (
                        <Badge colorScheme="blue">Scheduled</Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1}>
                        {!occurrence.is_past && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setEditingOccurrence(occurrence)}
                          >
                            Edit
                          </Button>
                        )}
                        {!occurrence.is_cancelled && !occurrence.is_past && (
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="red"
                            onClick={() => handleCancel(occurrence.id)}
                            loading={cancelMutation.isPending}
                          >
                            Cancel
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

      {/* Past Occurrences */}
      {past.length > 0 && (
        <Box>
          <Text fontWeight="semibold" mb={3} fontSize="lg" color="gray.600">
            Past Occurrences
          </Text>
          <Box overflowX="auto">
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Date & Time</Table.ColumnHeader>
                  <Table.ColumnHeader>Title</Table.ColumnHeader>
                  <Table.ColumnHeader>Attendees</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {past.map((occurrence) => (
                  <Table.Row key={occurrence.id} opacity={0.7}>
                    <Table.Cell>
                      <Text fontSize="sm">{formatDateTime(occurrence.start)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm">{occurrence.effective_title}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="sm">{occurrence.attendee_count}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      {occurrence.is_cancelled ? (
                        <Badge colorScheme="red">Cancelled</Badge>
                      ) : (
                        <Badge>Completed</Badge>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </Box>
      )}

      {/* Edit Occurrence Modal */}
      {editingOccurrence && (
        <OccurrenceEditModal
          groupSlug={groupSlug}
          eventSlug={eventSlug}
          seriesId={seriesId}
          occurrence={editingOccurrence}
          isOpen={!!editingOccurrence}
          onClose={() => setEditingOccurrence(null)}
        />
      )}

      {/* View Attendees Modal */}
      {viewingAttendeesFor && (
        <OccurrenceAttendeesModal
          groupSlug={groupSlug}
          eventSlug={eventSlug}
          occurrence={viewingAttendeesFor}
          isOpen={!!viewingAttendeesFor}
          onClose={() => setViewingAttendeesFor(null)}
        />
      )}
    </VStack>
  );
}

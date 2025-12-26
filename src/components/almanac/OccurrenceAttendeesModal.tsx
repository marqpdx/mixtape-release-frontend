// src/components/almanac/OccurrenceAttendeesModal.tsx
'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
  Table,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { formatDateTime } from '@/lib/utils/dateFormatters';
import type { EventAttendee } from '@/lib/almanac/almanacApi';

interface OccurrenceAttendeesModalProps {
  groupSlug: string;
  eventSlug: string;
  occurrence: {
    id: string;
    effective_title: string;
    start: string;
    attendee_count: number;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function OccurrenceAttendeesModal({
  groupSlug,
  eventSlug,
  occurrence,
  isOpen,
  onClose,
}: OccurrenceAttendeesModalProps) {
  // Fetch attendees for this occurrence
  const { data: attendees, isLoading, error } = useQuery<EventAttendee[]>({
    queryKey: ['almanac', 'occurrence', occurrence.id, 'attendees'],
    queryFn: async () => {
      const response = await fetch(
        `/api/groups/${groupSlug}/almanac/${eventSlug}/occurrences/${occurrence.id}/attendees`
      );
      if (!response.ok) throw new Error('Failed to fetch attendees');
      return response.json();
    },
    enabled: isOpen,
  });

  // Group attendees by status
  const goingCount = attendees?.filter(a => a.status === 'going' || a.status === 'attended').length || 0;
  const maybeCount = attendees?.filter(a => a.status === 'maybe').length || 0;
  const notGoingCount = attendees?.filter(a => a.status === 'not_going').length || 0;
  const attendedCount = attendees?.filter(a => a.status === 'attended').length || 0;

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      going: { label: 'Going', colorScheme: 'green' },
      maybe: { label: 'Maybe', colorScheme: 'yellow' },
      not_going: { label: 'Not Going', colorScheme: 'gray' },
      attended: { label: 'Attended', colorScheme: 'blue' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, colorScheme: 'gray' };
    return <Badge colorScheme={config.colorScheme}>{config.label}</Badge>;
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="xl">
      <DialogBackdrop />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Attendees - {occurrence.effective_title}</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <VStack align="stretch" gap={4}>
            {/* Occurrence Info */}
            <Box>
              <Text fontSize="sm" color="gray.600">
                {formatDateTime(occurrence.start)}
              </Text>
            </Box>

            {/* Summary Stats */}
            <HStack gap={4} p={3} bg="gray.50" borderRadius="md">
              <Box>
                <Text fontSize="xs" color="gray.600">Total RSVPs</Text>
                <Text fontSize="xl" fontWeight="bold">{occurrence.attendee_count}</Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.600">Going</Text>
                <Text fontSize="xl" fontWeight="bold" color="green.600">{goingCount}</Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.600">Maybe</Text>
                <Text fontSize="xl" fontWeight="bold" color="yellow.600">{maybeCount}</Text>
              </Box>
              {attendedCount > 0 && (
                <Box>
                  <Text fontSize="xs" color="gray.600">Attended</Text>
                  <Text fontSize="xl" fontWeight="bold" color="blue.600">{attendedCount}</Text>
                </Box>
              )}
            </HStack>

            {/* Attendee List */}
            {isLoading && (
              <Box textAlign="center" py={10}>
                <Spinner size="lg" />
                <Text mt={4} color="gray.500">Loading attendees...</Text>
              </Box>
            )}

            {error && (
              <MixtapeAlert
                status="error"
                title="Failed to Load Attendees"
                description={(error as Error).message}
              />
            )}

            {attendees && attendees.length === 0 && (
              <Box textAlign="center" py={10}>
                <Text color="gray.500">No RSVPs yet</Text>
              </Box>
            )}

            {attendees && attendees.length > 0 && (
              <Box overflowX="auto">
                <Table.Root size="sm" variant="outline">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>Name</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>RSVP Date</Table.ColumnHeader>
                      <Table.ColumnHeader>Notes</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {attendees.map((attendee) => (
                      <Table.Row key={attendee.id}>
                        <Table.Cell>
                          <Text fontWeight="medium">{attendee.name}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          {getStatusBadge(attendee.status)}
                          {attendee.checked_in_at && (
                            <Badge ml={2} colorScheme="purple" size="sm">
                              Checked In
                            </Badge>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm" color="gray.600">
                            {formatDateTime(attendee.rsvp_date)}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text fontSize="sm" color="gray.600">
                            {attendee.notes || '-'}
                          </Text>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </VStack>
        </DialogBody>
      </DialogContent>
    </DialogRoot>
  );
}

// src/components/almanac/AttendeeList.tsx
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
  Checkbox,
} from '@chakra-ui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGroupEventAttendees, checkInAttendee, type EventAttendee } from '@mixtape/api/clients/almanac/almanacApi';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { formatDateTime } from '@/lib/utils/dateFormatters';
import { toaster } from '@mixtape/core/lib/toaster';

interface AttendeeListProps {
  groupSlug: string;
  eventSlug: string;
}

export function AttendeeList({ groupSlug, eventSlug }: AttendeeListProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCheckedIn, setShowCheckedIn] = useState<boolean>(false);

  // Fetch attendees
  const { data: attendees, isLoading, error } = useQuery({
    queryKey: ['almanac', 'attendees', groupSlug, eventSlug],
    queryFn: () => fetchGroupEventAttendees(groupSlug, eventSlug),
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (attendeeId: string) => checkInAttendee(groupSlug, eventSlug, attendeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almanac', 'attendees', groupSlug, eventSlug] });
      toaster.create({
        title: 'Attendee Checked In',
        description: 'Attendee has been successfully checked in',
        type: 'success',
        duration: 3000,
      });
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Check-in Failed',
        description: error.message || 'Could not check in attendee',
        type: 'error',
        duration: 5000,
      });
    },
  });

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={4} color="gray.500">Loading attendees...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <MixtapeAlert
        status="error"
        title="Failed to Load Attendees"
        description={(error as Error).message}
      />
    );
  }

  if (!attendees || attendees.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="gray.500">No RSVPs yet</Text>
      </Box>
    );
  }

  // Filter attendees
  const filteredAttendees = attendees.filter(attendee => {
    if (statusFilter !== 'all' && attendee.status !== statusFilter) {
      return false;
    }
    if (showCheckedIn && !attendee.checked_in_at) {
      return false;
    }
    return true;
  });

  // Count by status
  const counts = {
    going: attendees.filter(a => a.status === 'going').length,
    maybe: attendees.filter(a => a.status === 'maybe').length,
    not_going: attendees.filter(a => a.status === 'not_going').length,
    attended: attendees.filter(a => a.status === 'attended').length,
    checked_in: attendees.filter(a => a.checked_in_at).length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'going':
        return 'green';
      case 'maybe':
        return 'yellow';
      case 'not_going':
        return 'red';
      case 'attended':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'going':
        return 'Going';
      case 'maybe':
        return 'Maybe';
      case 'not_going':
        return 'Not Going';
      case 'attended':
        return 'Attended';
      default:
        return status;
    }
  };

  const exportToCSV = () => {
    if (!attendees || attendees.length === 0) return;

    // CSV headers
    const headers = ['Name', 'Status', 'RSVP Date', 'Occurrence', 'Checked In', 'Check-in Time', 'Notes'];

    // CSV rows
    const rows = attendees.map(attendee => [
      attendee.name,
      getStatusLabel(attendee.status),
      new Date(attendee.rsvp_date).toLocaleString(),
      attendee.occurrence_title,
      attendee.checked_in_at ? 'Yes' : 'No',
      attendee.checked_in_at ? new Date(attendee.checked_in_at).toLocaleString() : '',
      attendee.notes || '',
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendees-${eventSlug}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toaster.create({
      title: 'Export Successful',
      description: 'Attendee list has been exported to CSV',
      type: 'success',
      duration: 3000,
    });
  };

  return (
    <VStack align="stretch" gap={4}>
      {/* Summary Stats */}
      <HStack gap={4} flexWrap="wrap">
        <Box>
          <Text fontSize="sm" color="gray.600">Total RSVPs</Text>
          <Text fontSize="2xl" fontWeight="bold">{attendees.length}</Text>
        </Box>
        <Box>
          <Text fontSize="sm" color="gray.600">Going</Text>
          <Text fontSize="2xl" fontWeight="bold" color="green.600">{counts.going}</Text>
        </Box>
        <Box>
          <Text fontSize="sm" color="gray.600">Maybe</Text>
          <Text fontSize="2xl" fontWeight="bold" color="yellow.600">{counts.maybe}</Text>
        </Box>
        <Box>
          <Text fontSize="sm" color="gray.600">Checked In</Text>
          <Text fontSize="2xl" fontWeight="bold" color="blue.600">{counts.checked_in}</Text>
        </Box>
      </HStack>

      {/* Filters & Actions */}
      <HStack justify="space-between" flexWrap="wrap" gap={3}>
        <HStack gap={3} flexWrap="wrap">
          <Text fontWeight="medium" fontSize="sm">Filter by status:</Text>
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'solid' : 'outline'}
            onClick={() => setStatusFilter('all')}
          >
            All ({attendees.length})
          </Button>
        <Button
          size="sm"
          variant={statusFilter === 'going' ? 'solid' : 'outline'}
          colorScheme="green"
          onClick={() => setStatusFilter('going')}
        >
          Going ({counts.going})
        </Button>
        <Button
          size="sm"
          variant={statusFilter === 'maybe' ? 'solid' : 'outline'}
          colorScheme="yellow"
          onClick={() => setStatusFilter('maybe')}
        >
          Maybe ({counts.maybe})
        </Button>
          <Button
            size="sm"
            variant={statusFilter === 'attended' ? 'solid' : 'outline'}
            colorScheme="blue"
            onClick={() => setStatusFilter('attended')}
          >
            Attended ({counts.attended})
          </Button>

          <Checkbox.Root
            checked={showCheckedIn}
            onCheckedChange={() => setShowCheckedIn(!showCheckedIn)}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label>Show only checked in</Checkbox.Label>
          </Checkbox.Root>
        </HStack>

        <Button
          size="sm"
          variant="outline"
          colorScheme="blue"
          onClick={exportToCSV}
        >
          Export to CSV
        </Button>
      </HStack>

      {/* Attendee List */}
      <Box overflowX="auto">
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Name</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader>RSVP Date</Table.ColumnHeader>
              <Table.ColumnHeader>Occurrence</Table.ColumnHeader>
              <Table.ColumnHeader>Checked In</Table.ColumnHeader>
              <Table.ColumnHeader>Notes</Table.ColumnHeader>
              <Table.ColumnHeader>Actions</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredAttendees.map((attendee) => (
              <Table.Row key={attendee.id}>
                <Table.Cell>
                  <Text fontWeight="medium">{attendee.name}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge colorScheme={getStatusColor(attendee.status)}>
                    {getStatusLabel(attendee.status)}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text fontSize="sm" color="gray.600">
                    {formatDateTime(attendee.rsvp_date)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text fontSize="sm">{attendee.occurrence_title}</Text>
                </Table.Cell>
                <Table.Cell>
                  {attendee.checked_in_at ? (
                    <HStack>
                      <Badge colorScheme="blue">Checked In</Badge>
                      <Text fontSize="xs" color="gray.500">
                        {formatDateTime(attendee.checked_in_at)}
                      </Text>
                    </HStack>
                  ) : (
                    <Text fontSize="sm" color="gray.400">-</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {attendee.notes ? (
                    <Text fontSize="sm" lineClamp={2}>{attendee.notes}</Text>
                  ) : (
                    <Text fontSize="sm" color="gray.400">-</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  {!attendee.checked_in_at && attendee.status === 'going' && (
                    <Button
                      size="xs"
                      colorScheme="blue"
                      onClick={() => checkInMutation.mutate(attendee.id)}
                      loading={checkInMutation.isPending}
                    >
                      Check In
                    </Button>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {filteredAttendees.length === 0 && (
        <Box textAlign="center" py={6}>
          <Text color="gray.500">No attendees match the selected filters</Text>
        </Box>
      )}
    </VStack>
  );
}

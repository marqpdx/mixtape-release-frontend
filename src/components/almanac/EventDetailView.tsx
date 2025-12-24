// src/components/almanac/EventDetailView.tsx
'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  Spinner,
  Heading,
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchGroupEvent, publishGroupEvent, unpublishGroupEvent } from '@/lib/almanac/almanacApi';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { formatDateTime } from '@/lib/utils/dateFormatters';
import { toaster } from '@/components/ui/toaster';
import { Divider } from '../common/Divider';
import { EventEditForm } from './EventEditForm';

interface EventDetailViewProps {
  groupSlug: string;
  eventSlug: string;
  onEdit?: () => void;
  onBack?: () => void;
}

export function EventDetailView({ groupSlug, eventSlug, onEdit, onBack }: EventDetailViewProps) {
  const queryClient = useQueryClient();
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Fetch event
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['almanac', 'event', groupSlug, eventSlug],
    queryFn: () => fetchGroupEvent(groupSlug, eventSlug),
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: () => publishGroupEvent(groupSlug, eventSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almanac', 'event', groupSlug, eventSlug] });
      queryClient.invalidateQueries({ queryKey: ['almanac', 'events'] });
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

  // Unpublish mutation
  const unpublishMutation = useMutation({
    mutationFn: () => unpublishGroupEvent(groupSlug, eventSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almanac', 'event', groupSlug, eventSlug] });
      queryClient.invalidateQueries({ queryKey: ['almanac', 'events'] });
      toaster.create({
        title: 'Event Unpublished',
        description: 'Event is no longer visible',
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
        <Text mt={4} color="gray.500">Loading event...</Text>
      </Box>
    );
  }

  if (error || !event) {
    return (
      <MixtapeAlert
        status="error"
        title="Failed to Load Event"
        description={(error as Error)?.message || 'Event not found'}
      />
    );
  }

  // DEBUG: Log event data to see its structure
  console.log('[EventDetailView] Event data:', JSON.stringify(event, null, 2));

  const isDraft = event.status === 'draft';
  const isPublished = event.status === 'published';

  return (
    <VStack align="stretch" gap={6}>
      {/* Header */}
      <HStack justify="space-between">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
        )}
        <HStack gap={2} ml="auto">
          <Badge colorScheme={isDraft ? 'orange' : isPublished ? 'green' : 'gray'}>
            {event.status}
          </Badge>
        </HStack>
      </HStack>

      {/* Title & Meta */}
      <Box>
        <Heading size="lg" mb={2}>{event.title}</Heading>
        <HStack gap={4} color="gray.600" fontSize="sm">
          <Text>📅 {formatDateTime(event.series?.next_occurrence?.start)}</Text>
          {event.location && <Text>📍 {event.location}</Text>}
          <Badge>{event.event_format}</Badge>
        </HStack>
      </Box>

      <Divider />

      {/* Description */}
      {event.description && (
        <Box>
          <Text fontWeight="semibold" mb={2}>Description</Text>
          <Text whiteSpace="pre-wrap">{event.description}</Text>
        </Box>
      )}

      {/* Event Details */}
      <Box>
        <Text fontWeight="semibold" mb={2}>Event Details</Text>
        <VStack align="stretch" gap={2} fontSize="sm">
          {event.series?.default_duration_minutes && (
            <HStack>
              <Text fontWeight="medium" minW="140px">Duration:</Text>
              <Text>{event.series.default_duration_minutes} minutes</Text>
            </HStack>
          )}
          {event.max_attendees && (
            <HStack>
              <Text fontWeight="medium" minW="140px">Max Attendees:</Text>
              <Text>{event.max_attendees}</Text>
            </HStack>
          )}
          {event.registration_required !== undefined && (
            <HStack>
              <Text fontWeight="medium" minW="140px">Registration:</Text>
              <Text>{event.registration_required ? 'Required' : 'Not required'}</Text>
            </HStack>
          )}
        </VStack>
      </Box>

      <Divider />

      {/* Actions */}
      <HStack gap={3}>
        {isDraft && (
          <>
            <Button
              colorScheme="green"
              onClick={() => publishMutation.mutate()}
              loading={publishMutation.isPending}
            >
              Publish Event
            </Button>
            <Button variant="outline" onClick={() => setIsEditDrawerOpen(true)}>
              Edit
            </Button>
          </>
        )}

        {isPublished && (
          <>
            <Button
              variant="outline"
              colorScheme="orange"
              onClick={() => unpublishMutation.mutate()}
              loading={unpublishMutation.isPending}
            >
              Unpublish
            </Button>
            <Button variant="outline" onClick={() => setIsEditDrawerOpen(true)}>
              Edit
            </Button>
          </>
        )}
      </HStack>

      {/* Edit Dialog */}
      <DialogRoot
        open={isEditDrawerOpen}
        onOpenChange={(e) => setIsEditDrawerOpen(e.open)}
        size="lg"
      >
        <DialogBackdrop />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <EventEditForm
              groupSlug={groupSlug}
              event={event}
              onSuccess={() => setIsEditDrawerOpen(false)}
              onCancel={() => setIsEditDrawerOpen(false)}
            />
          </DialogBody>
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
}

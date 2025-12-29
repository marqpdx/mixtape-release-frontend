// src/components/almanac/OccurrenceEditModal.tsx
'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  Input,
  Stack,
  Field,
} from '@chakra-ui/react';
import {
  DialogRoot,
  DialogBackdrop,
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toaster } from '@mixtape/core/lib/toaster';

interface OccurrenceEditModalProps {
  groupSlug: string;
  eventSlug: string;
  seriesId: string;
  occurrence: {
    id: string;
    start: string;
    end: string;
    effective_title: string;
    effective_location: string;
    title_override?: string;
    location_override?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

export function OccurrenceEditModal({
  groupSlug,
  eventSlug,
  seriesId,
  occurrence,
  isOpen,
  onClose,
}: OccurrenceEditModalProps) {
  const queryClient = useQueryClient();

  // Form state
  const [titleOverride, setTitleOverride] = useState(occurrence.title_override || '');
  const [locationOverride, setLocationOverride] = useState(occurrence.location_override || '');
  const [startDate, setStartDate] = useState(
    new Date(occurrence.start).toISOString().slice(0, 16)
  );
  const [endDate, setEndDate] = useState(
    new Date(occurrence.end).toISOString().slice(0, 16)
  );

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: {
      title_override?: string;
      location_override?: string;
      start?: string;
      end?: string;
    }) => {
      const response = await fetch(
        `/api/groups/${groupSlug}/almanac/${eventSlug}/occurrences/${occurrence.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update occurrence');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almanac', 'series', seriesId, 'occurrences'] });
      queryClient.invalidateQueries({ queryKey: ['almanac', 'calendar'] });
      toaster.create({
        title: 'Occurrence Updated',
        description: 'The occurrence has been updated successfully',
        type: 'success',
        duration: 3000,
      });
      onClose();
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Update Failed',
        description: error.message || 'Could not update occurrence',
        type: 'error',
        duration: 5000,
      });
    },
  });

  const handleSubmit = () => {
    const data: any = {};

    // Only send fields that have been modified
    if (titleOverride !== (occurrence.title_override || '')) {
      data.title_override = titleOverride || null;
    }

    if (locationOverride !== (occurrence.location_override || '')) {
      data.location_override = locationOverride || null;
    }

    const originalStart = new Date(occurrence.start).toISOString().slice(0, 16);
    const originalEnd = new Date(occurrence.end).toISOString().slice(0, 16);

    if (startDate !== originalStart) {
      data.start = new Date(startDate).toISOString();
    }

    if (endDate !== originalEnd) {
      data.end = new Date(endDate).toISOString();
    }

    // Validate
    if (new Date(startDate) >= new Date(endDate)) {
      toaster.create({
        title: 'Validation Error',
        description: 'End time must be after start time',
        type: 'error',
        duration: 5000,
      });
      return;
    }

    updateMutation.mutate(data);
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()} size="lg">
      <DialogBackdrop />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Occurrence</DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <VStack align="stretch" gap={4}>
            <Field.Root>
              <Field.Label>Title Override (optional)</Field.Label>
              <Input
                value={titleOverride}
                onChange={(e) => setTitleOverride(e.target.value)}
                placeholder={occurrence.effective_title}
              />
              <Field.HelperText>
                Leave blank to use the series default title
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label>Location Override (optional)</Field.Label>
              <Input
                value={locationOverride}
                onChange={(e) => setLocationOverride(e.target.value)}
                placeholder={occurrence.effective_location || 'No location'}
              />
              <Field.HelperText>
                Leave blank to use the series default location
              </Field.HelperText>
            </Field.Root>

            <Field.Root>
              <Field.Label>Start Date & Time</Field.Label>
              <Input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Field.Root>

            <Field.Root>
              <Field.Label>End Date & Time</Field.Label>
              <Input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Field.Root>
          </VStack>
        </DialogBody>
        <DialogFooter>
          <Stack direction="row" gap={2}>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              loading={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </Stack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}

// src/components/almanac/EventEditForm.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Input,
  Textarea,
  Field,
  NativeSelectRoot,
  NativeSelectField,
} from '@chakra-ui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateGroupEvent } from '@mixtape/api/clients/almanac/almanacApi';
import { toaster } from '@mixtape/core/lib/toaster';
import type { EventResponse } from '@mixtape/api/clients/almanac/almanacApi';
import { useGroup } from '@mixtape/api/hooks/groups/useGroups';

interface EventEditFormProps {
  groupSlug: string;
  event: EventResponse;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EventEditForm({ groupSlug, event, onSuccess, onCancel }: EventEditFormProps) {
  const queryClient = useQueryClient();

  // Fetch group data to check if this is a circle
  const { group } = useGroup(groupSlug);
  const isCircle = group?.group_type === 'circle';
  const parentGroup = group?.sponsor_group;

  // Form state
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    location: event.location || '',
    event_format: event.event_format || 'workshop',
    max_attendees: event.max_attendees?.toString() || '',
    registration_required: event.registration_required,
    visible_to_parent: event.visible_to_parent || false,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateGroupEvent(groupSlug, event.slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['almanac', 'event', groupSlug, event.slug] });
      queryClient.invalidateQueries({ queryKey: ['almanac', 'events'] });
      toaster.create({
        title: 'Event Updated',
        description: 'Changes saved successfully',
        type: 'success',
        duration: 3000,
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toaster.create({
        title: 'Update Failed',
        description: error.message || 'Could not update event',
        type: 'error',
        duration: 5000,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      event_format: formData.event_format,
      max_attendees: formData.max_attendees ? parseInt(formData.max_attendees, 10) : null,
      registration_required: formData.registration_required,
      visible_to_parent: formData.visible_to_parent,
    };

    updateMutation.mutate(payload);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack align="stretch" gap={4}>
        {/* Title */}
        <Field.Root required>
          <Field.Label>Event Title</Field.Label>
          <Input
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="e.g., Weekly Meditation"
            required
          />
        </Field.Root>

        {/* Location */}
        <Field.Root>
          <Field.Label>Location</Field.Label>
          <Input
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="e.g., Main Hall"
          />
        </Field.Root>

        {/* Event Format */}
        <Field.Root required>
          <Field.Label>Event Format</Field.Label>
          <NativeSelectRoot>
            <NativeSelectField
              value={formData.event_format}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChange('event_format', e.target.value)}
            >
              <option value="workshop">Workshop</option>
              <option value="lecture">Lecture</option>
              <option value="discussion">Discussion</option>
              <option value="field_trip">Field Trip</option>
              <option value="social">Social</option>
              <option value="ceremony">Ceremony</option>
              <option value="practice">Practice</option>
              <option value="work_party">Work Party</option>
            </NativeSelectField>
          </NativeSelectRoot>
        </Field.Root>

        {/* Description */}
        <Field.Root>
          <Field.Label>Description</Field.Label>
          <Textarea
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange('description', e.target.value)}
            placeholder="Event description..."
            rows={5}
          />
        </Field.Root>

        {/* Max Attendees */}
        <Field.Root>
          <Field.Label>Max Attendees (optional)</Field.Label>
          <Input
            type="number"
            value={formData.max_attendees}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('max_attendees', e.target.value)}
            placeholder="Leave empty for unlimited"
            min="1"
          />
          <Field.HelperText>Maximum number of people who can attend</Field.HelperText>
        </Field.Root>

        {/* Registration Required - checkbox */}
        <Field.Root>
          <label>
            <input
              type="checkbox"
              checked={formData.registration_required}
              onChange={(e) => handleChange('registration_required', e.target.checked)}
              style={{ marginRight: '8px' }}
            />
            Registration Required
          </label>
          <Field.HelperText>
            Require RSVP before attending
          </Field.HelperText>
        </Field.Root>

        {/* Visible to Parent - checkbox (circles only) */}
        {isCircle && parentGroup && (
          <Field.Root>
            <label>
              <input
                type="checkbox"
                checked={formData.visible_to_parent}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('visible_to_parent', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              Also add to {parentGroup.title} calendar
            </label>
            <Field.HelperText>
              Make this event visible on the parent community's calendar
            </Field.HelperText>
          </Field.Root>
        )}

        {/* Note about date/time */}
        <Box p={3} bg="blue.50" borderRadius="md" fontSize="sm" color="blue.800">
          <strong>Note:</strong> To change the date/time, delete this draft and create a new event via Mill.
          Editing dates for existing events will be added in a future update.
        </Box>

        {/* Actions */}
        <HStack justify="flex-end" gap={3} pt={4}>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            colorScheme="blue"
            loading={updateMutation.isPending}
          >
            Save Changes
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

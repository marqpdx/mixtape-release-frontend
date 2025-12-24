// src/components/almanac/EventCreateModal.tsx

"use client";

import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  Stack,
  Text,
  Flex,
  RadioGroup,
  Fieldset,
  Dialog,
} from '@chakra-ui/react';
import { Input } from '@/theme/recipes/input.recipe';
import { DatePickerInput } from '@/components/forms/DatePickerField';
import { toaster } from '@/components/ui/toaster';
import * as almanacApi from '@/lib/almanac/almanacApi';
import type { EventCreatePayload } from '@/lib/almanac/almanacApi';

interface EventCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupSlug: string;
  onSuccess?: () => void;
}

interface EventFormValues {
  title: string;
  description: string;
  location: string;
  event_format: 'in_person' | 'virtual' | 'hybrid';
  event_type: 'single' | 'adhoc_series' | 'gathering';
  start_time: Date | null;
  end_time: Date | null;
  max_attendees: number | null;
  registration_required: boolean;
  registration_deadline_hours: number | null;
}

export default function EventCreateModal({
  isOpen,
  onClose,
  groupSlug,
  onSuccess,
}: EventCreateModalProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<EventFormValues>({
    defaultValues: {
      title: '',
      description: '',
      location: '',
      event_format: 'in_person',
      event_type: 'single',
      start_time: null,
      end_time: null,
      max_attendees: null,
      registration_required: false,
      registration_deadline_hours: null,
    },
  });

  const eventType = watch('event_type');
  const eventFormat = watch('event_format');
  const startTime = watch('start_time');

  const onSubmit = async (data: EventFormValues) => {
    try {
      // Convert form data to API payload
      const payload: EventCreatePayload = {
        event_type: data.event_type,
        title: data.title,
        description: data.description,
        location: data.location || '',
        event_format: data.event_format,
        max_attendees: data.max_attendees || undefined,
        registration_required: data.registration_required,
        registration_deadline_hours: data.registration_deadline_hours || undefined,
      };

      // Add start/end times for single events
      if (data.event_type === 'single' && data.start_time && data.end_time) {
        payload.start_time = data.start_time.toISOString();
        payload.end_time = data.end_time.toISOString();
      }

      // Create event
      await almanacApi.createGroupEvent(groupSlug, payload);

      toaster.create({
        title: 'Event Created',
        description: `${data.title} has been created successfully`,
        type: 'success',
      });

      // Reset form and close
      reset();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to create event:', err);
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create event',
        type: 'error',
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && handleClose()}
      size="lg"
    >
      <Dialog.Content>
        <Dialog.Header>Create New Event</Dialog.Header>
        <Dialog.CloseTrigger />

        <Dialog.Body>
          <form id="event-create-form" onSubmit={handleSubmit(onSubmit)}>
            <Stack gap={4}>
              {/* Event Type */}
              <Fieldset.Root>
                <Fieldset.Legend fontWeight="medium" mb={2}>
                  Event Type
                </Fieldset.Legend>
                <RadioGroup.Root
                  value={eventType}
                  onValueChange={(details) => setValue('event_type', details.value as any)}
                >
                  <Stack direction="row" gap={4}>
                    <RadioGroup.Item value="single">
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                      <RadioGroup.ItemText>Single Event</RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="adhoc_series">
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                      <RadioGroup.ItemText>Multiple Dates</RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="gathering">
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                      <RadioGroup.ItemText>Multi-day Gathering</RadioGroup.ItemText>
                    </RadioGroup.Item>
                  </Stack>
                </RadioGroup.Root>
              </Fieldset.Root>

              {/* Title */}
              <Box>
                <Text fontWeight="medium" mb={2}>
                  Event Title *
                </Text>
                <Input
                  {...register('title', {
                    required: 'Event title is required',
                  })}
                  placeholder="Weekly Workshop"
                  size="md"
                />
                {errors.title && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors.title.message}
                  </Text>
                )}
              </Box>

              {/* Description */}
              <Box>
                <Text fontWeight="medium" mb={2}>
                  Description *
                </Text>
                <Input
                  {...register('description', {
                    required: 'Description is required',
                  })}
                  placeholder="Join us for an engaging workshop on..."
                  size="md"
                />
                {errors.description && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors.description.message}
                  </Text>
                )}
              </Box>

              {/* Location */}
              <Box>
                <Text fontWeight="medium" mb={2}>
                  Location
                </Text>
                <Input
                  {...register('location')}
                  placeholder="Community Center, Room 101"
                  size="md"
                />
              </Box>

              {/* Event Format */}
              <Fieldset.Root>
                <Fieldset.Legend fontWeight="medium" mb={2}>
                  Format
                </Fieldset.Legend>
                <RadioGroup.Root
                  value={eventFormat}
                  onValueChange={(details) => setValue('event_format', details.value as any)}
                >
                  <Stack direction="row" gap={4}>
                    <RadioGroup.Item value="in_person">
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                      <RadioGroup.ItemText>In Person</RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="virtual">
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                      <RadioGroup.ItemText>Virtual</RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="hybrid">
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                      <RadioGroup.ItemText>Hybrid</RadioGroup.ItemText>
                    </RadioGroup.Item>
                  </Stack>
                </RadioGroup.Root>
              </Fieldset.Root>

              {/* Date/Time for Single Events */}
              {eventType === 'single' && (
                <>
                  <DatePickerInput
                    name="start_time"
                    control={control}
                    label="Start Date & Time"
                    isRequired={true}
                    placeholder="Select start date and time"
                  />

                  <DatePickerInput
                    name="end_time"
                    control={control}
                    label="End Date & Time"
                    isRequired={true}
                    placeholder="Select end date and time"
                    validateFn={(value: Date | null) => {
                      if (!value || !startTime) return true;
                      if (new Date(value) <= new Date(startTime)) {
                        return 'End time must be after start time';
                      }
                      return true;
                    }}
                  />
                </>
              )}

              {/* Note for other event types */}
              {eventType !== 'single' && (
                <Box p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                  <Text fontSize="sm" color="blue.700">
                    {eventType === 'adhoc_series'
                      ? 'You can add multiple date slots after creating the event.'
                      : 'You can configure gathering details after creating the event.'}
                  </Text>
                </Box>
              )}

              {/* Capacity */}
              <Box>
                <Text fontWeight="medium" mb={2}>
                  Max Attendees (Optional)
                </Text>
                <Input
                  type="number"
                  {...register('max_attendees', {
                    valueAsNumber: true,
                    min: { value: 1, message: 'Must be at least 1' },
                  })}
                  placeholder="Leave empty for unlimited"
                  size="md"
                />
                {errors.max_attendees && (
                  <Text color="red.500" fontSize="sm" mt={1}>
                    {errors.max_attendees.message}
                  </Text>
                )}
              </Box>
            </Stack>
          </form>
        </Dialog.Body>

        <Dialog.Footer>
          <Flex justify="flex-end" gap={3}>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="event-create-form"
              colorScheme="green"
              loading={isSubmitting}
            >
              Create Event
            </Button>
          </Flex>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>
  );
}

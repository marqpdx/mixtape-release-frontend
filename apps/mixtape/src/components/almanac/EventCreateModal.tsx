// src/components/almanac/EventCreateModal.tsx

"use client";

import { useState } from 'react';
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
  HStack,
  type RadioGroupValueChangeDetails,
} from '@chakra-ui/react';
import { Input } from '@/theme/recipes/input.recipe';
import { DatePickerInput } from '@/components/forms/DatePickerField';
import { toaster } from '@mixtape/core/lib/toaster';
import * as almanacApi from '@mixtape/api/clients/almanac/almanacApi';
import type { EventCreatePayload } from '@mixtape/api/clients/almanac/almanacApi';
import { RecurrenceFeaturelet, type RecurrenceConfig } from './RecurrenceFeaturelet';
import { configToRRule } from '@/lib/almanac/recurrenceUtils';

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
  const [isRecurrenceOpen, setIsRecurrenceOpen] = useState(false);
  const [recurrenceConfig, setRecurrenceConfig] = useState<RecurrenceConfig | null>(null);

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

  const handleRecurrenceSave = (config: RecurrenceConfig) => {
    setRecurrenceConfig(config);
    toaster.create({
      title: 'Recurrence Configured',
      description: 'Your recurrence pattern has been saved',
      type: 'success',
      duration: 2000,
    });
  };

  const getRecurrencePreview = () => {
    if (!recurrenceConfig || !recurrenceConfig.pattern) return null;

    let text = '';
    const { pattern, frequency, daysOfWeek, endType, endDate, occurrenceCount } = recurrenceConfig;

    if (pattern === 'daily') {
      text = frequency === 1 ? 'Daily' : `Every ${frequency} days`;
    } else if (pattern === 'weekly') {
      text = frequency === 1 ? 'Weekly' : `Every ${frequency} weeks`;
      if (daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDays = daysOfWeek.map(d => dayNames[d]);
        text += ` on ${selectedDays.join(', ')}`;
      }
    } else if (pattern === 'monthly') {
      text = frequency === 1 ? 'Monthly' : `Every ${frequency} months`;
    } else if (pattern === 'yearly') {
      text = frequency === 1 ? 'Yearly' : `Every ${frequency} years`;
    }

    if (endType === 'on_date' && endDate) {
      text += `, until ${new Date(endDate).toLocaleDateString()}`;
    } else if (endType === 'after_count' && occurrenceCount) {
      text += `, ${occurrenceCount} times`;
    }

    return text;
  };

  const onSubmit = async (data: EventFormValues) => {
    try {
      // Check if we have a recurrence configuration
      const hasRecurrence = recurrenceConfig?.pattern && recurrenceConfig.pattern !== 'custom';

      // Convert form data to API payload
      const payload: EventCreatePayload = {
        event_type: hasRecurrence ? 'recurring' : data.event_type,
        title: data.title,
        description: data.description,
        location: data.location || '',
        event_format: data.event_format,
        max_attendees: data.max_attendees || undefined,
        registration_required: data.registration_required,
        registration_deadline_hours: data.registration_deadline_hours || undefined,
      };

      // Add start/end times for single events
      if (data.event_type === 'single' && data.start_time && data.end_time && !hasRecurrence) {
        payload.start_time = data.start_time.toISOString();
        payload.end_time = data.end_time.toISOString();
      }

      // Add recurrence info if configured
      if (hasRecurrence && recurrenceConfig && data.start_time && data.end_time) {
        const rrule = configToRRule(recurrenceConfig);
        if (rrule) {
          payload.rrule = rrule;
          payload.start_time = data.start_time.toISOString();
          payload.end_time = data.end_time.toISOString();
          payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          // Calculate duration in minutes
          const durationMs = data.end_time.getTime() - data.start_time.getTime();
          payload.default_duration_minutes = Math.round(durationMs / (1000 * 60));
        }
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
      onOpenChange={({ open }: { open: boolean }) => !open && handleClose()}
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
                  onValueChange={(details: RadioGroupValueChangeDetails) =>
                    setValue('event_type', details.value as EventFormValues['event_type'])
                  }
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
                  onValueChange={(details: RadioGroupValueChangeDetails) =>
                    setValue('event_format', details.value as EventFormValues['event_format'])
                  }
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

              {/* Recurrence Configuration */}
              {eventType !== 'gathering' && (
                <Box>
                  <HStack justify="space-between" align="center" mb={2}>
                    <Text fontWeight="medium">Recurrence (Optional)</Text>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="blue"
                      onClick={() => setIsRecurrenceOpen(true)}
                    >
                      {recurrenceConfig?.pattern ? 'Edit Recurrence' : 'Set Up Recurrence'}
                    </Button>
                  </HStack>

                  {recurrenceConfig?.pattern && (
                    <Box p={3} bg="blue.50" borderRadius="md" border="1px solid" borderColor="blue.200">
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="blue.900">
                          {getRecurrencePreview()}
                        </Text>
                        <Button
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => setRecurrenceConfig(null)}
                        >
                          Clear
                        </Button>
                      </HStack>
                    </Box>
                  )}

                  {!recurrenceConfig?.pattern && (
                    <Text fontSize="sm" color="gray.600">
                      Click the button to configure recurring event patterns
                    </Text>
                  )}
                </Box>
              )}

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

      {/* Recurrence Featurelet */}
      <RecurrenceFeaturelet
        isOpen={isRecurrenceOpen}
        onClose={() => setIsRecurrenceOpen(false)}
        onSave={handleRecurrenceSave}
        initialConfig={recurrenceConfig || undefined}
      />
    </Dialog.Root>
  );
}

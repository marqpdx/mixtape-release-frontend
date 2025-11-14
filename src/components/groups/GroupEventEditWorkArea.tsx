// src/components/groups/GroupEventEditWorkArea.tsx

/**
 * Group Event Edit WorkArea
 * Form for editing existing events with pre-populated data
 * Reuses most of the logic from GroupEventCreateWorkArea
 */

import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Textarea,
  Card,
  Tabs,
  Field,
  NumberInput,
  Switch,
  Select,
  IconButton,
  Separator,
  createListCollection,
  Box,
  Grid,
} from '@chakra-ui/react';
import { IconPlus, IconTrash, IconAlertCircle, IconClock } from '@tabler/icons-react';
import AdminModal from '../admin/AdminModal';
import { ErrorAlert } from '@components/ui/alerts/ErrorAlert';
import { InfoAlert } from '@components/ui/alerts/InfoAlert';
import { useColorModeValue } from '@components/ui/color-mode';
import { createStandaloneToast } from "@chakra-ui/toast";
import { almanacApi, EventCreatePayload, EventResponse } from 'lib/almanacApi';
import { useGroupEvents } from '@hooks/useGroupEvents';

const { toast } = createStandaloneToast();

// Create collections for Select components
const eventTypeCollection = createListCollection({
  items: [
    { label: "📅 Single Event", value: "single" },
    { label: "🔄 Custom Date Series", value: "adhoc_series" },
    { label: "🏕️ Gathering/Retreat", value: "gathering" },
  ],
});

const formatCollection = createListCollection({
  items: [
    { label: "Workshop", value: "workshop" },
    { label: "Lecture", value: "lecture" },
    { label: "Discussion", value: "discussion" },
    { label: "Field Trip", value: "field_trip" },
    { label: "Social", value: "social" },
    { label: "Ceremony", value: "ceremony" },
    { label: "Practice", value: "practice" },
    { label: "Work Party", value: "work_party" },
  ],
});

// Types
interface GroupEventFormData {
  event_type: 'single' | 'adhoc_series' | 'gathering';
  title: string;
  description: string;
  location: string;
  event_format: string;
  max_attendees?: number;
  registration_required: boolean;
  is_public: boolean;
  start_date?: string;
  start_time?: string;
  end_date?: string;
  end_time?: string;
  adhoc_slots: Array<{
    start: string;
    end: string;
  }>;
  decorators: Array<{
    slug: string;
  }>;
  gathering_data: {
    accommodation_available: boolean;
    meals_included: boolean;
  };
}

const mockDecorators = [
  { slug: 'is_potluck', name: 'Potluck', icon: '🍽️' },
  { slug: 'is_instructional', name: 'Instructional', icon: '🧑‍🏫' },
  { slug: 'is_open_to_public', name: 'Open to Public', icon: '🌐' },
  { slug: 'is_circle_gathering', name: 'Circle Gathering', icon: '🧭' },
  { slug: 'is_performance', name: 'Performance', icon: '🎵' },
  { slug: 'is_reading_group', name: 'Reading Group', icon: '📖' },
];

interface GroupEventEditWorkAreaProps {
  groupSlug: string;
  event: EventResponse;
  isOpen?: boolean;
  onClose?: () => void;
  onEventUpdated?: (event: EventResponse) => void;
}

export function GroupEventEditWorkArea({
  groupSlug,
  event,
  isOpen = true,
  onClose = () => {},
  onEventUpdated,
}: GroupEventEditWorkAreaProps) {
  const [formData, setFormData] = useState<GroupEventFormData>({
    event_type: 'single',
    title: '',
    description: '',
    location: '',
    event_format: 'workshop',
    registration_required: false,
    is_public: true,
    adhoc_slots: [],
    decorators: [],
    gathering_data: {
      accommodation_available: false,
      meals_included: false,
    }
  });

  const [selectedDecorators, setSelectedDecorators] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // Duration presets in minutes
  const durationPresets = [
    { label: '1 hour', minutes: 60 },
    { label: '90 min', minutes: 90 },
    { label: '2 hours', minutes: 120 },
    { label: '4 hours', minutes: 240 },
  ];

  const [daysOffset, setDaysOffset] = useState<string>('');

  // =========================================================================
  // INITIALIZATION - Load event data on mount
  // =========================================================================

  useEffect(() => {
    if (event && isOpen) {
      // Parse start and end dates/times from event
      const startDate = event.series?.next_occurrence?.start;
      const endDate = event.series?.next_occurrence?.end;

      let startDateStr = '';
      let startTimeStr = '';
      let endDateStr = '';
      let endTimeStr = '';

      if (startDate) {
        const startDateTime = new Date(startDate);
        startDateStr = startDateTime.toISOString().split('T')[0];
        startTimeStr = startDateTime.toTimeString().slice(0, 5);
      }

      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateStr = endDateTime.toISOString().split('T')[0];
        endTimeStr = endDateTime.toTimeString().slice(0, 5);
      }

      // Initialize decorators
      const decoratorSlugs = new Set(
        event.decorators.map(d => d.decorator.slug)
      );
      setSelectedDecorators(decoratorSlugs);

      setFormData({
        event_type: event.series ? 'single' : 'single', // Simplified for now
        title: event.title,
        description: event.description,
        location: event.location,
        event_format: event.event_format,
        max_attendees: event.max_attendees,
        registration_required: event.registration_required,
        is_public: true, // TODO: get from event if available
        start_date: startDateStr,
        start_time: startTimeStr,
        end_date: endDateStr,
        end_time: endTimeStr,
        adhoc_slots: [],
        decorators: Array.from(decoratorSlugs).map(slug => ({ slug })),
        gathering_data: {
          accommodation_available: event.gathering_extension?.accommodation_available || false,
          meals_included: event.gathering_extension?.meals_included || false,
        }
      });
    }
  }, [event, isOpen]);

  // =========================================================================
  // HELPERS
  // =========================================================================

  const getDateFromOffset = (offset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
  };

  const getCurrentTimeWithMinutes = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = '00';
    return `${hours}:${minutes}`;
  };

  const applyStartDatePreset = (offset: number) => {
    const dateStr = getDateFromOffset(offset);
    setFormData(prev => ({
      ...prev,
      start_date: dateStr,
      start_time: prev.start_time || getCurrentTimeWithMinutes()
    }));
  };

  const applyStartDateWithCustomOffset = () => {
    if (daysOffset && !isNaN(Number(daysOffset))) {
      const dateStr = getDateFromOffset(Number(daysOffset));
      setFormData(prev => ({
        ...prev,
        start_date: dateStr,
        start_time: prev.start_time || getCurrentTimeWithMinutes()
      }));
      setDaysOffset('');
    }
  };

  const calculateEndTime = (minutesToAdd: number): { date: string; time: string } | null => {
    if (!formData.start_date || !formData.start_time) return null;

    const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
    const endDateTime = new Date(startDateTime.getTime() + minutesToAdd * 60 * 1000);

    const endDateStr = endDateTime.toISOString().split('T')[0];
    const endTimeStr = endDateTime.toTimeString().slice(0, 5);

    return { date: endDateStr, time: endTimeStr };
  };

  const applyDurationPreset = (minutes: number) => {
    const result = calculateEndTime(minutes);
    if (result) {
      setFormData(prev => ({
        ...prev,
        end_date: result.date,
        end_time: result.time
      }));
    }
  };

  // =========================================================================
  // VALIDATION
  // =========================================================================

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Event title is required');
      return false;
    }

    if (!formData.description.trim()) {
      setError('Event description is required');
      return false;
    }

    if (formData.event_type === 'single' || formData.event_type === 'gathering') {
      if (!formData.start_date || !formData.start_time) {
        setError('Start date and time are required');
        return false;
      }
      if (!formData.end_date || !formData.end_time) {
        setError('End date and time are required');
        return false;
      }

      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      if (endDateTime <= startDateTime) {
        setError('End time must be after start time');
        return false;
      }
    }

    return true;
  };

  // =========================================================================
  // BUILD PAYLOAD & SUBMIT
  // =========================================================================

  const buildPayload = (): Partial<EventCreatePayload> => {
    const decoratorPayload = Array.from(selectedDecorators).map(slug => ({ slug }));

    const basePayload: Partial<EventCreatePayload> = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      event_format: formData.event_format,
      registration_required: formData.registration_required,
      decorators: decoratorPayload,
    };

    if (formData.max_attendees) {
      basePayload.max_attendees = formData.max_attendees;
    }

    if (formData.event_type === 'single' || formData.event_type === 'gathering') {
      basePayload.start_time = `${formData.start_date}T${formData.start_time}:00Z`;
      basePayload.end_time = `${formData.end_date}T${formData.end_time}:00Z`;
    }

    if (formData.event_type === 'gathering') {
      basePayload.gathering_data = {
        accommodation_available: formData.gathering_data.accommodation_available,
        meals_included: formData.gathering_data.meals_included,
      };
    }

    return basePayload;
  };

  const handleSubmit = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = buildPayload();
      const updatedEvent = await almanacApi.updateEvent(event.id, payload);

      toast({
        title: 'Event updated successfully',
        description: `${updatedEvent.title} has been updated`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      onEventUpdated?.(updatedEvent);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update event';
      setError(errorMessage);

      toast({
        title: 'Error updating event',
        description: errorMessage,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // FORM HANDLERS
  // =========================================================================

  const toggleDecorator = (slug: string) => {
    const newSelected = new Set(selectedDecorators);
    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }
    setSelectedDecorators(newSelected);
  };

  return (
    <AdminModal
      title={`Edit Event: ${event.title}`}
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitText="Update Event"
      size="3xl"
    >
      <VStack align="stretch" gap={5} pb={4}>
        {error && <ErrorAlert description={error} />}

        <InfoAlert description="Changes will be saved to your event. Draft events won't appear to the public until published." />

        {/* REQUIRED FIELDS FIRST */}
        <VStack align="stretch" gap={4} p={4} bg={bgColor} borderRadius="lg" border="1px" borderColor="gray.200">
          <HStack gap={2}>
            <IconAlertCircle size={18} color="green.500" />
            <Text fontSize="sm" fontWeight="semibold">Event Details</Text>
          </HStack>

          {/* Title */}
          <Field.Root>
            <Field.Label fontWeight="semibold">Event Title *</Field.Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Soil Biology Workshop"
              size="lg"
              autoFocus
            />
          </Field.Root>

          {/* Description */}
          <Field.Root>
            <Field.Label fontWeight="semibold">Description *</Field.Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What will happen? What will people learn?"
              minHeight="80px"
              size="lg"
            />
          </Field.Root>

          {/* Date/Time */}
          <Separator />
          <Text fontSize="sm" fontWeight="semibold" color="gray.600">When is this event?</Text>

          <VStack align="stretch" gap={2} minH="120px">
            <Field.Root>
              <Field.Label fontSize="sm">Start Date *</Field.Label>
              <Input
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                size="md"
              />
            </Field.Root>
            <HStack gap={1} wrap="wrap">
              <Button
                size="xs"
                variant="ghost"
                colorScheme="green"
                onClick={() => applyStartDatePreset(0)}
                fontSize="xs"
              >
                Today
              </Button>
              <Button
                size="xs"
                variant="ghost"
                colorScheme="green"
                onClick={() => applyStartDatePreset(1)}
                fontSize="xs"
              >
                Tomorrow
              </Button>
            </HStack>
          </VStack>

          <Grid gridTemplateColumns="1fr 1fr" gap={3} minH="80px">
            <Field.Root>
              <Field.Label fontSize="sm">Start Time *</Field.Label>
              <Input
                type="time"
                value={formData.start_time || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                size="md"
              />
            </Field.Root>
            <Field.Root>
              <Field.Label fontSize="sm">End Time *</Field.Label>
              <Input
                type="time"
                value={formData.end_time || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                size="md"
              />
            </Field.Root>
          </Grid>

          <VStack align="stretch" gap={2} minH="100px">
            <Field.Root>
              <Field.Label fontSize="sm">End Date *</Field.Label>
              <Input
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                size="md"
              />
            </Field.Root>
            <HStack gap={1} wrap="wrap">
              <IconClock size={14} />
              {durationPresets.map((preset) => (
                <Button
                  key={preset.minutes}
                  size="xs"
                  variant="ghost"
                  colorScheme="green"
                  onClick={() => applyDurationPreset(preset.minutes)}
                  fontSize="xs"
                >
                  {preset.label}
                </Button>
              ))}
            </HStack>
          </VStack>
        </VStack>

        {/* OPTIONAL FIELDS */}
        <Tabs.Root defaultValue="details">
          <Tabs.List>
            <Tabs.Trigger value="details">Details</Tabs.Trigger>
            <Tabs.Trigger value="advanced">Advanced</Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.List>

          {/* Details Tab */}
          <Tabs.Content value="details">
            <VStack align="stretch" gap={4}>
              <Field.Root>
                <Field.Label>Location</Field.Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Community Garden, Online, etc."
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Format</Field.Label>
                <Select.Root
                  collection={formatCollection}
                  value={[formData.event_format]}
                  onValueChange={({ value }) =>
                    setFormData(prev => ({ ...prev, event_format: value[0] || 'workshop' }))
                  }
                >
                  <Select.Trigger>
                    <Select.ValueText />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Content>
                    {formatCollection.items.map((item) => (
                      <Select.Item key={item.value} item={item}>
                        {item.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label>Max Attendees</Field.Label>
                <NumberInput.Root
                  value={formData.max_attendees?.toString() || ''}
                  onValueChange={(e) => setFormData(prev => ({
                    ...prev,
                    max_attendees: e.valueAsNumber || undefined
                  }))}
                  min={1}
                >
                  <NumberInput.Input placeholder="Leave empty for unlimited" />
                </NumberInput.Root>
              </Field.Root>

              <VStack align="stretch" gap={3}>
                <HStack justify="space-between">
                  <Text>Require registration</Text>
                  <Switch.Root
                    checked={formData.registration_required}
                    onCheckedChange={(checked: { checked: boolean }) =>
                      setFormData(prev => ({ ...prev, registration_required: checked.checked }))
                    }
                  >
                    <Switch.Thumb />
                  </Switch.Root>
                </HStack>
              </VStack>

              {formData.event_type === 'gathering' && (
                <>
                  <Separator />
                  <Text fontWeight="semibold" fontSize="sm">Gathering Options</Text>
                  <VStack align="stretch" gap={3}>
                    <HStack justify="space-between">
                      <Text>Accommodation provided</Text>
                      <Switch.Root
                        checked={formData.gathering_data.accommodation_available}
                        onCheckedChange={(checked: { checked: boolean }) =>
                          setFormData(prev => ({
                            ...prev,
                            gathering_data: {
                              accommodation_available: checked.checked,
                              meals_included: prev.gathering_data.meals_included,
                            }
                          }))
                        }
                      >
                        <Switch.Thumb />
                      </Switch.Root>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Meals included</Text>
                      <Switch.Root
                        checked={formData.gathering_data.meals_included}
                        onCheckedChange={(checked: { checked: boolean }) =>
                          setFormData(prev => ({
                            ...prev,
                            gathering_data: {
                              accommodation_available: prev.gathering_data.accommodation_available,
                              meals_included: checked.checked,
                            }
                          }))
                        }
                      >
                        <Switch.Thumb />
                      </Switch.Root>
                    </HStack>
                  </VStack>
                </>
              )}
            </VStack>
          </Tabs.Content>

          {/* Advanced Tab */}
          <Tabs.Content value="advanced">
            <VStack align="stretch" gap={4}>
              <Field.Root>
                <Field.Label>Event Characteristics</Field.Label>
                <Field.HelperText mb={3}>Select tags that describe your event</Field.HelperText>
                <VStack align="stretch" gap={2}>
                  {mockDecorators.map((decorator) => (
                    <HStack
                      key={decorator.slug}
                      justify="space-between"
                      p={3}
                      border="1px"
                      borderColor={selectedDecorators.has(decorator.slug) ? 'green.200' : 'gray.200'}
                      borderRadius="md"
                      bg={selectedDecorators.has(decorator.slug) ? 'green.50' : 'transparent'}
                      cursor="pointer"
                      onClick={() => toggleDecorator(decorator.slug)}
                    >
                      <HStack>
                        <Text fontSize="lg">{decorator.icon}</Text>
                        <Text fontWeight="medium" fontSize="sm">{decorator.name}</Text>
                      </HStack>
                      <Switch.Root
                        checked={selectedDecorators.has(decorator.slug)}
                        readOnly
                      >
                        <Switch.Thumb />
                      </Switch.Root>
                    </HStack>
                  ))}
                </VStack>
              </Field.Root>
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </VStack>
    </AdminModal>
  );
}
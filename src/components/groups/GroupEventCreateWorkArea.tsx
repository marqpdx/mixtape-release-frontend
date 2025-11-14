// src/components/groups/GroupEventCreateWorkArea.tsx

import React, { useState } from 'react';
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
import { almanacApi, EventCreatePayload } from 'lib/almanacApi';

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

interface GroupEventCreateWorkAreaProps {
  groupSlug: string;
  isOpen?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
  onEventCreated?: (event: any) => void;
}

export function GroupEventCreateWorkArea({
  groupSlug,
  isOpen = true,
  onClose = () => {},
  onSuccess,
  onEventCreated
}: GroupEventCreateWorkAreaProps) {
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

  // Start date quick select
  const [daysOffset, setDaysOffset] = useState<string>('');

  const getDateFromOffset = (offset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().split('T')[0];
  };

  const getCurrentTimeWithMinutes = (): string => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = '00'; // Default to :00
    return `${hours}:${minutes}`;
  };

  const applyStartDatePreset = (offset: number) => {
    const dateStr = getDateFromOffset(offset);
    // If start time not set, also set current time with :00 minutes
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

      // Validate that end is after start
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      if (endDateTime <= startDateTime) {
        setError('End time must be after start time');
        return false;
      }
    }

    if (formData.event_type === 'adhoc_series') {
      if (formData.adhoc_slots.length === 0) {
        setError('At least one session is required');
        return false;
      }
      if (formData.adhoc_slots.some(slot => !slot.start || !slot.end)) {
        setError('All sessions must have start and end times');
        return false;
      }
    }

    return true;
  };

  // =========================================================================
  // BUILD PAYLOAD & SUBMIT
  // =========================================================================

  const buildPayload = (): EventCreatePayload => {
    const decoratorPayload = Array.from(selectedDecorators).map(slug => ({ slug }));

    const basePayload: EventCreatePayload = {
      event_type: formData.event_type,
      title: formData.title,
      description: formData.description,  // ✅ Changed from 'body' to 'description'
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

    if (formData.event_type === 'adhoc_series') {
      basePayload.adhoc_slots = formData.adhoc_slots;
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
      const newEvent = await almanacApi.createEvent(payload, groupSlug);

      toast({
        title: 'Event created successfully',
        description: `${newEvent.title} has been created`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      onEventCreated?.(newEvent);
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create event';
      setError(errorMessage);

      toast({
        title: 'Error creating event',
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

  const addAdHocSlot = () => {
    setFormData(prev => ({
      ...prev,
      adhoc_slots: [...prev.adhoc_slots, { start: '', end: '' }]
    }));
  };

  const removeAdHocSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      adhoc_slots: prev.adhoc_slots.filter((_, i) => i !== index)
    }));
  };

  const toggleDecorator = (slug: string) => {
    const newSelected = new Set(selectedDecorators);
    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }
    setSelectedDecorators(newSelected);
  };

  // Calculate end time based on duration preset
  const calculateEndTime = (minutesToAdd: number): { date: string; time: string } | null => {
    if (!formData.start_date || !formData.start_time) return null;

    const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
    const endDateTime = new Date(startDateTime.getTime() + minutesToAdd * 60 * 1000);

    // Extract date and time, accounting for timezone changes
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

  // Get suggested end time display
  const suggestedEndTime = formData.start_time ?
    new Date(new Date(`2000-01-01T${formData.start_time}`).getTime() + 60 * 60 * 1000)
      .toTimeString()
      .slice(0, 5)
    : '';

  return (
    <AdminModal
      title="Create Group Event"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitText="Create Event"
      size="3xl"
    >
      <VStack align="stretch" gap={5} pb={4}>
        {error && <ErrorAlert description={error} />}

        {/* REQUIRED FIELDS FIRST - Always visible */}
        <VStack align="stretch" gap={4} p={4} bg={bgColor} borderRadius="lg" border="1px" borderColor="gray.200">
          <HStack gap={2}>
            <IconAlertCircle size={18} color="green.500" />
            <Text fontSize="sm" fontWeight="semibold">Required Information</Text>
          </HStack>

          {/* Event Type - CRITICAL */}
          <Field.Root>
            <Field.Label fontWeight="semibold">Event Type *</Field.Label>
            <Select.Root
              collection={eventTypeCollection}
              value={[formData.event_type]}
              onValueChange={({ value }) =>
                setFormData(prev => ({ ...prev, event_type: value[0] as any }))
              }
              size="lg"
            >
              <Select.Trigger>
                <Select.ValueText placeholder="Select event type" />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Content>
                {eventTypeCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Field.Root>

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

          {/* CONDITIONAL: Date/Time based on event type */}
          {(formData.event_type === 'single' || formData.event_type === 'gathering') && (
            <>
              <Separator />
              <Text fontSize="sm" fontWeight="semibold" color="gray.600">When is this event?</Text>

              {/* Start Date - Fixed Height Container */}
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
                {/* Start Date Quick Select - Always visible but small */}
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
                  <HStack gap={0.5}>
                    <Input
                      type="number"
                      placeholder="Days"
                      value={daysOffset}
                      onChange={(e) => setDaysOffset(e.target.value)}
                      size="xs"
                      maxW="60px"
                      min="0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          applyStartDateWithCustomOffset();
                        }
                      }}
                    />
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="green"
                      onClick={applyStartDateWithCustomOffset}
                      fontSize="xs"
                      px={2}
                    >
                      Go
                    </Button>
                  </HStack>
                </HStack>
              </VStack>

              {/* Start/End Times - Fixed Height Container */}
              <Grid gridTemplateColumns="1fr 1fr" gap={3} minH="80px">
                <Field.Root>
                  <Field.Label fontSize="sm">Start Time *</Field.Label>
                  <Input
                    type="time"
                    value={formData.start_time || ''}
                    onChange={(e) => {
                      let timeValue = e.target.value;
                      // Ensure minutes are :00 if just hour is provided
                      if (timeValue && timeValue.length === 2) {
                        timeValue = `${timeValue}:00`;
                      }
                      setFormData(prev => ({ ...prev, start_time: timeValue }));
                    }}
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

              {/* End Date - Fixed Height Container */}
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
                {/* Duration Presets - Always visible but small */}
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
            </>
          )}

          {formData.event_type === 'adhoc_series' && (
            <>
              <Separator />
              <HStack justify="space-between">
                <Text fontSize="sm" fontWeight="semibold" color="gray.600">Sessions *</Text>
                <Button size="sm" colorScheme="green" onClick={addAdHocSlot}>
                  <IconPlus />
                  Add Session
                </Button>
              </HStack>

              {formData.adhoc_slots.map((slot, index) => (
                <HStack key={index} gap={2}>
                  <Input
                    type="datetime-local"
                    value={slot.start}
                    onChange={(e) => {
                      const newSlots = [...formData.adhoc_slots];
                      newSlots[index] = { ...slot, start: e.target.value };
                      setFormData(prev => ({ ...prev, adhoc_slots: newSlots }));
                    }}
                    placeholder="Start"
                    size="sm"
                    flex={1}
                  />
                  <Input
                    type="datetime-local"
                    value={slot.end}
                    onChange={(e) => {
                      const newSlots = [...formData.adhoc_slots];
                      newSlots[index] = { ...slot, end: e.target.value };
                      setFormData(prev => ({ ...prev, adhoc_slots: newSlots }));
                    }}
                    placeholder="End"
                    size="sm"
                    flex={1}
                  />
                  <IconButton
                    size="sm"
                    variant="ghost"
                    onClick={() => removeAdHocSlot(index)}
                    aria-label="Remove session"
                  >
                    <IconTrash />
                  </IconButton>
                </HStack>
              ))}

              {formData.adhoc_slots.length === 0 && (
                <Text fontSize="sm" color="orange.600">
                  Add at least one session
                </Text>
              )}
            </>
          )}
        </VStack>

        {/* OPTIONAL FIELDS - Collapsible section */}
        <Tabs.Root defaultValue="details">
          <Tabs.List>
            <Tabs.Trigger value="details">Details</Tabs.Trigger>
            <Tabs.Trigger value="advanced">Advanced</Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.List>

          {/* Details Tab */}
          <Tabs.Content value="details">
            <VStack align="stretch" gap={4}>
              {/* Location and Format - Stack vertically to avoid dropdown pushing content */}
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
                <HStack justify="space-between">
                  <Text>Open to public</Text>
                  <Switch.Root
                    checked={formData.is_public}
                    onCheckedChange={(checked: { checked: boolean }) =>
                      setFormData(prev => ({ ...prev, is_public: checked.checked }))
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
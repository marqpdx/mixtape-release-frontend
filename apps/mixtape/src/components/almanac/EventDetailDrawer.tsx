// src/components/Calendar/EventDetailDrawer.tsx - WITH RSVP FORM (Chakra UI v3)

import React, { useState } from 'react';
import {
  Drawer,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Button,
  Heading,
  Skeleton,
  Textarea,
  RadioGroup,
  NumberInput,
  Field,
  type RadioGroupValueChangeDetails,
} from '@chakra-ui/react';
import { CalendarOccurrence } from '@mixtape/api/clients/almanac/almanacApi';
import { useColorModeValue } from '@components/ui/color-mode';
import { Divider } from '@components/common/Divider';
import { useEventRSVP } from '@hooks/almanac/useEventRSVP';
import { toaster } from '@mixtape/core/lib/toaster';

interface EventDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  occurrence: CalendarOccurrence | null;
  isLoading?: boolean;
  groupSlug?: string;
  onRSVPSuccess?: () => void;
}

export const EventDetailDrawer: React.FC<EventDetailDrawerProps> = ({
  isOpen,
  onClose,
  occurrence,
  isLoading = false,
  groupSlug = '',
  onRSVPSuccess,
}) => {
  const { submitRSVP, isSubmitting } = useEventRSVP();
  const [showRSVPForm, setShowRSVPForm] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<'going' | 'maybe' | 'not_going'>('going');
  const [rsvpNotes, setRsvpNotes] = useState('');
  const [limitTo, setLimitTo] = useState<number | undefined>();
  const [limitToError, setLimitToError] = useState<string | null>(null);

  // Debug: Log groupSlug when drawer opens
  React.useEffect(() => {
    if (isOpen) {
      console.log('🎯 EventDetailDrawer opened with groupSlug:', groupSlug || '(empty!)', 'event:', occurrence?.title);
    }
  }, [isOpen, groupSlug, occurrence?.title]);

  // ✅ Validate limitTo input
  const handleLimitToChange = (details: { valueAsNumber: number }) => {
    const value = details.valueAsNumber;

    // Clear if empty/invalid
    if (!value || isNaN(value)) {
      setLimitTo(undefined);
      setLimitToError(null);
      return;
    }

    // Validate range (1-52 is reasonable for weekly events up to 1 year)
    if (value < 1) {
      setLimitTo(1);
      setLimitToError('Minimum is 1 session');
      toaster.create({
        title: 'Value Adjusted',
        description: 'Minimum limit is 1 session',
        type: 'info',
        duration: 3000,
      });
    } else if (value > 52) {
      setLimitTo(52);
      setLimitToError('Maximum is 52 sessions');
      toaster.create({
        title: 'Value Adjusted',
        description: 'Maximum limit is 52 sessions (1 year)',
        type: 'info',
        duration: 3000,
      });
    } else {
      setLimitTo(value);
      setLimitToError(null);
    }
  };

  if (!occurrence && !isLoading) return null;

  const startDate = occurrence
    ? new Date(occurrence.start).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      })
    : '';

  const startTime = occurrence
    ? new Date(occurrence.start).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  const endTime = occurrence
    ? new Date(occurrence.end).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  const capacityPercent =
    occurrence && occurrence.capacity && occurrence.attendee_count
      ? Math.round((occurrence.attendee_count / occurrence.capacity) * 100)
      : 0;

  const handleRSVPSubmit = async () => {
    if (!occurrence) return;

    // Validate groupSlug
    if (!groupSlug) {
      console.error('❌ groupSlug is required to submit RSVP but was:', groupSlug);
      toaster.create({
        title: 'Configuration Error',
        description: 'Group information missing. Please refresh the page and try again.',
        type: 'error',
        duration: 5000,
      });
      return;
    }

    console.log('📝 Submitting RSVP with:', { groupSlug, eventId: occurrence.event_id, status: rsvpStatus });

    const result = await submitRSVP(groupSlug, occurrence.event_id, {
      status: rsvpStatus,
      registration_notes: rsvpNotes,
      limit_to: limitTo ?? null,
    });

    if (result) {
      setShowRSVPForm(false);
      setRsvpNotes('');
      setLimitTo(undefined);
      onRSVPSuccess?.();
    }
  };

  const drawerBg = useColorModeValue('white', 'gray.800');
  const sectionBg = useColorModeValue('gray.50', 'gray.900');

  return (
    <Drawer.Root open={isOpen} onOpenChange={() => onClose()} placement="end" size="md">
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content bg={drawerBg}>
          <Drawer.CloseTrigger />
          <Drawer.Header>Event Details</Drawer.Header>

          <Drawer.Body>
            <VStack align="stretch" gap={6}>
              {isLoading || !occurrence ? (
                <VStack gap={4}>
                  <Skeleton h="8" w="80%" />
                  <Skeleton h="6" w="60%" />
                  <Skeleton h="6" w="70%" />
                </VStack>
              ) : (
                <>
                  {/* Title */}
                  <VStack align="stretch" gap={2}>
                    <Heading size="md">{occurrence.title}</Heading>
                    <Text fontSize="sm" color="gray.600">
                      {occurrence.sponsor_display}
                    </Text>
                  </VStack>

                  <Divider />

                  {/* Date & Time */}
                  <Box bg={sectionBg} p={4} borderRadius="md">
                    <VStack align="stretch" gap={3}>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" mb={1}>
                          Date
                        </Text>
                        <Text fontSize="sm">{startDate}</Text>
                      </Box>
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" mb={1}>
                          Time
                        </Text>
                        <Text fontSize="sm">
                          {startTime} – {endTime}
                        </Text>
                      </Box>
                      {occurrence.location && (
                        <Box>
                          <Text fontWeight="bold" fontSize="sm" mb={1}>
                            Location
                          </Text>
                          <Text fontSize="sm">{occurrence.location}</Text>
                        </Box>
                      )}
                    </VStack>
                  </Box>

                  <Divider />

                  {/* Status & Format */}
                  <HStack gap={3} wrap="wrap">
                    <Badge colorScheme="blue" fontSize="xs">
                      {occurrence.event_format}
                    </Badge>
                    <Badge
                      colorScheme={
                        occurrence.event_status === 'published' ? 'green' : 'gray'
                      }
                      fontSize="xs"
                    >
                      {occurrence.event_status}
                    </Badge>
                    {occurrence.kind === 'gathering' && (
                      <Badge colorScheme="purple" fontSize="xs">
                        Gathering
                      </Badge>
                    )}
                  </HStack>

                  <Divider />

                  {/* Capacity */}
                  {occurrence.capacity && (
                    <Box bg={sectionBg} p={4} borderRadius="md">
                      <VStack align="stretch" gap={2}>
                        <Text fontWeight="bold" fontSize="sm">
                          Capacity
                        </Text>
                        <HStack justify="space-between">
                          <Text fontSize="sm">
                            {occurrence.attendee_count} / {occurrence.capacity}{' '}
                            attendees
                          </Text>
                          <Badge
                            colorScheme={occurrence.is_full ? 'red' : 'green'}
                          >
                            {occurrence.is_full ? 'FULL' : `${100 - capacityPercent}% available`}
                          </Badge>
                        </HStack>
                        <Box bg="gray.200" h="2" borderRadius="full" overflow="hidden">
                          <Box
                            bg="green.500"
                            h="full"
                            w={`${capacityPercent}%`}
                            transition="width 0.3s"
                          />
                        </Box>
                      </VStack>
                    </Box>
                  )}

                  {/* Decorators */}
                  {occurrence.decorators.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" mb={2}>
                          Features
                        </Text>
                        <VStack align="stretch" gap={2}>
                          {occurrence.decorators.map(dec => (
                            <Box
                              key={dec.slug}
                              bg={sectionBg}
                              p={3}
                              borderRadius="md"
                              borderLeft="3px solid"
                              borderColor="green.500"
                            >
                              <HStack gap={2} mb={1}>
                                {dec.icon && (
                                  <Text fontSize="lg">{dec.icon}</Text>
                                )}
                                <Heading size="xs">{dec.name}</Heading>
                              </HStack>
                              {dec.context_data && Object.keys(dec.context_data).length > 0 && (
                                <VStack align="stretch" gap={1} mt={2}>
                                  {Object.entries(dec.context_data).map(([key, value]) => (
                                    <Text key={key} fontSize="xs" color="gray.600">
                                      <strong>{key}:</strong> {String(value)}
                                    </Text>
                                  ))}
                                </VStack>
                              )}
                            </Box>
                          ))}
                        </VStack>
                      </Box>
                    </>
                  )}

                  {/* Gathering-specific info */}
                  {occurrence.kind === 'gathering' && (
                    <>
                      <Divider />
                      <Box bg={sectionBg} p={4} borderRadius="md">
                        <VStack align="stretch" gap={2}>
                          {occurrence.accommodation_available && (
                            <HStack>
                              <Text fontSize="sm">🏠 Accommodation available</Text>
                            </HStack>
                          )}
                          {occurrence.meals_included && (
                            <HStack>
                              <Text fontSize="sm">🍽️ Meals included</Text>
                            </HStack>
                          )}
                        </VStack>
                      </Box>
                    </>
                  )}

                  <Divider />

                  {/* RSVP Form or Button */}
                  {!showRSVPForm ? (
                    <Button
                      w="full"
                      colorScheme="green"
                      size="md"
                      onClick={() => setShowRSVPForm(true)}
                    >
                      RSVP to Event
                    </Button>
                  ) : (
                    <Box bg={sectionBg} p={4} borderRadius="md">
                      <VStack align="stretch" gap={4}>
                        <Heading size="sm">RSVP Status</Heading>

                        {/* Status radio group - Chakra UI v3 */}
                        <RadioGroup.Root
                          value={rsvpStatus}
                          onValueChange={(details: RadioGroupValueChangeDetails) =>
                            setRsvpStatus(details.value as typeof rsvpStatus)
                          }
                        >
                          <VStack align="start" gap={2}>
                            <RadioGroup.Item value="going">
                              <RadioGroup.ItemHiddenInput />
                              <RadioGroup.ItemIndicator />
                              <RadioGroup.ItemText>Going 🎉</RadioGroup.ItemText>
                            </RadioGroup.Item>
                            <RadioGroup.Item value="maybe">
                              <RadioGroup.ItemHiddenInput />
                              <RadioGroup.ItemIndicator />
                              <RadioGroup.ItemText>Maybe 🤔</RadioGroup.ItemText>
                            </RadioGroup.Item>
                            <RadioGroup.Item value="not_going">
                              <RadioGroup.ItemHiddenInput />
                              <RadioGroup.ItemIndicator />
                              <RadioGroup.ItemText>Not Going</RadioGroup.ItemText>
                            </RadioGroup.Item>
                          </VStack>
                        </RadioGroup.Root>

                        {/* Notes */}
                        <Field.Root>
                          <Field.Label fontSize="sm">Notes (optional)</Field.Label>
                          <Textarea
                            placeholder="Any dietary restrictions, questions, etc."
                            value={rsvpNotes}
                            onChange={(e) => setRsvpNotes(e.target.value)}
                            size="sm"
                            rows={3}
                          />
                        </Field.Root>

                        {/* Limit to next N sessions - Chakra UI v3 */}
                        <Field.Root invalid={!!limitToError}>
                          <Field.Label fontSize="sm">
                            Limit to next N sessions (optional)
                          </Field.Label>
                          <NumberInput.Root
                            value={limitTo?.toString() ?? ''}
                            onValueChange={handleLimitToChange}
                            min={1}
                            max={52}
                          >
                            <NumberInput.Control>
                              <NumberInput.DecrementTrigger />
                              <NumberInput.Input placeholder="Leave blank for all sessions" />
                              <NumberInput.IncrementTrigger />
                            </NumberInput.Control>
                          </NumberInput.Root>
                          {limitToError && (
                            <Field.ErrorText fontSize="xs">{limitToError}</Field.ErrorText>
                          )}
                          <Field.HelperText fontSize="xs">
                            Max 52 sessions (1 year). Leave blank to RSVP to all.
                          </Field.HelperText>
                        </Field.Root>

                        {/* Submit buttons */}
                        <HStack gap={2} w="full">
                          <Button
                            flex={1}
                            colorScheme="green"
                            onClick={handleRSVPSubmit}
                            loading={isSubmitting}
                          >
                            Submit RSVP
                          </Button>
                          <Button
                            flex={1}
                            variant="outline"
                            onClick={() => setShowRSVPForm(false)}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  )}

                  <Divider />

                  {/* Share URL */}
                  <Box bg={sectionBg} p={3} borderRadius="md">
                    <Text fontSize="xs" color="gray.600" mb={1}>
                      📎 Share this event:
                    </Text>
                    <Text fontSize="xs" fontFamily="mono" wordBreak="break-all">
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/groups/${groupSlug}/events/${occurrence.event_id}`}
                    </Text>
                  </Box>

                  {/* Close button */}
                  <Button w="full" variant="outline" onClick={onClose}>
                    Close
                  </Button>
                </>
              )}
            </VStack>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
};

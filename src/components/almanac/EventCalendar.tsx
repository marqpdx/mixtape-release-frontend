// src/components/almanac/EventCalendar.tsx

'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Spinner, Text, HStack, VStack, Button, Badge, Checkbox } from '@chakra-ui/react';
import {
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogCloseTrigger,
} from '@/components/ui/dialog';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery } from '@tanstack/react-query';
import { almanacApi } from '@/lib/almanac/almanacApi';
import type { CalendarOccurrence } from '@/lib/almanac/almanacApi';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';
import { EventDetailView } from './EventDetailView';

interface EventCalendarProps {
  groupSlug: string;
  onViewEvent?: (eventSlug: string) => void;
}

export function EventCalendar({ groupSlug, onViewEvent }: EventCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0), // End of next month
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventSlug, setSelectedEventSlug] = useState<string | null>(null);

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    formats: [] as string[],
    kinds: [] as string[],
    decorators: [] as string[],
  });

  // Fetch calendar occurrences
  const { data: occurrences, isLoading, error } = useQuery({
    queryKey: ['almanac', 'calendar', groupSlug, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: () => almanacApi.getGroupCalendar(groupSlug, dateRange.start, dateRange.end),
  });

  // Handle paginated response from backend
  const occurrencesList: CalendarOccurrence[] = Array.isArray(occurrences)
    ? occurrences
    : ((occurrences as any)?.results || []);

  // Extract available filter options from data
  const availableFormats: string[] = Array.from(new Set(occurrencesList.map((o: CalendarOccurrence) => o.event_format).filter(Boolean)));
  const availableKinds: string[] = Array.from(new Set(occurrencesList.map((o: CalendarOccurrence) => o.kind).filter(Boolean)));
  const availableDecorators: string[] = Array.from(
    new Set(
      occurrencesList.flatMap((o: CalendarOccurrence) =>
        (o.decorators || []).map(d => d.slug)
      )
    )
  );

  // Apply filters
  const filteredOccurrences = occurrencesList.filter((occurrence: CalendarOccurrence) => {
    // Filter by format
    if (filters.formats.length > 0 && !filters.formats.includes(occurrence.event_format)) {
      return false;
    }

    // Filter by kind
    if (filters.kinds.length > 0 && !filters.kinds.includes(occurrence.kind)) {
      return false;
    }

    // Filter by decorators
    if (filters.decorators.length > 0) {
      const occurrenceDecorators = (occurrence.decorators || []).map(d => d.slug);
      const hasMatchingDecorator = filters.decorators.some(d => occurrenceDecorators.includes(d));
      if (!hasMatchingDecorator) {
        return false;
      }
    }

    return true;
  });

  // DEBUG: Log calendar data
  console.log('[EventCalendar] Debug Info:', {
    groupSlug,
    dateRange,
    occurrences,
    occurrencesCount: occurrencesList.length,
    filteredCount: filteredOccurrences.length,
    filters,
    isLoading,
    error,
  });

  // Convert occurrences to FullCalendar events
  const events = filteredOccurrences.map((occurrence: CalendarOccurrence) => ({
    id: occurrence.id,
    title: occurrence.title,
    start: occurrence.start,
    end: occurrence.end,
    extendedProps: {
      eventId: occurrence.event_id,
      eventSlug: occurrence.event_slug,
      location: occurrence.location,
      kind: occurrence.kind,
      eventFormat: occurrence.event_format,
      decorators: occurrence.decorators,
    },
  }));

  console.log('[EventCalendar] Converted events for FullCalendar:', events);

  // Handle date range changes
  const handleDatesSet = (arg: any) => {
    setDateRange({
      start: arg.start,
      end: arg.end,
    });
  };

  // Handle event click - open detail modal
  const handleEventClick = (clickInfo: any) => {
    const eventSlug = clickInfo.event.extendedProps.eventSlug;

    console.log('Event clicked:', eventSlug);

    if (eventSlug) {
      setSelectedEventSlug(eventSlug);
      setIsModalOpen(true);
    }
  };

  // Handle event hover - show tooltip
  const handleEventMouseEnter = (info: any) => {
    const event = info.event;
    const props = event.extendedProps;

    // Create tooltip content
    const tooltip = document.createElement('div');
    tooltip.className = 'fc-event-tooltip';
    tooltip.innerHTML = `
      <div style="
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        max-width: 300px;
        z-index: 1000;
      ">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">
          ${event.title}
        </div>
        <div style="font-size: 13px; color: #4a5568; margin-bottom: 4px;">
          📅 ${new Date(event.start).toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })}
        </div>
        ${props.location ? `
          <div style="font-size: 13px; color: #4a5568; margin-bottom: 4px;">
            📍 ${props.location}
          </div>
        ` : ''}
        <div style="font-size: 12px; color: #718096; margin-top: 8px;">
          Click for full details
        </div>
      </div>
    `;

    // Position tooltip near cursor
    tooltip.style.position = 'absolute';
    tooltip.style.zIndex = '9999';
    document.body.appendChild(tooltip);

    // Store tooltip reference on the element
    info.el.tooltipElement = tooltip;

    // Update position on mouse move
    const updatePosition = (e: MouseEvent) => {
      tooltip.style.left = (e.pageX + 15) + 'px';
      tooltip.style.top = (e.pageY + 15) + 'px';
    };

    info.el.addEventListener('mousemove', updatePosition);
    info.el.updatePosition = updatePosition;
  };

  const handleEventMouseLeave = (info: any) => {
    // Remove tooltip
    if (info.el.tooltipElement) {
      document.body.removeChild(info.el.tooltipElement);
      info.el.tooltipElement = null;
    }

    // Remove event listener
    if (info.el.updatePosition) {
      info.el.removeEventListener('mousemove', info.el.updatePosition);
      info.el.updatePosition = null;
    }
  };

  // Filter handlers
  const toggleFilter = (type: 'formats' | 'kinds' | 'decorators', value: string) => {
    setFilters(prev => {
      const current = prev[type];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [type]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({ formats: [], kinds: [], decorators: [] });
  };

  const hasActiveFilters = filters.formats.length > 0 || filters.kinds.length > 0 || filters.decorators.length > 0;

  if (isLoading && !occurrences) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="lg" />
        <Text mt={4} color="gray.500">Loading calendar...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <MixtapeAlert
        status="error"
        title="Failed to Load Calendar"
        description={(error as Error).message}
      />
    );
  }

  return (
    <>
      <VStack align="stretch" gap={4}>
        {/* Filter Controls */}
        <HStack justify="space-between" align="center">
          <Button
            size="sm"
            variant={showFilters ? 'solid' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? '🔽' : '▶️'} Filters
            {hasActiveFilters && (
              <Badge ml={2} colorScheme="blue" variant="solid">
                {filters.formats.length + filters.kinds.length + filters.decorators.length}
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </HStack>

        {/* Filter Panel */}
        {showFilters && (
          <Box
            p={4}
            bg="gray.50"
            borderRadius="md"
            border="1px solid"
            borderColor="gray.200"
          >
            <VStack align="stretch" gap={4}>
              {/* Format Filters */}
              {availableFormats.length > 0 && (
                <Box>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">
                    Event Format
                  </Text>
                  <HStack gap={3} flexWrap="wrap">
                    {availableFormats.map((format) => (
                      <Checkbox.Root
                        key={format}
                        checked={filters.formats.includes(format)}
                        onCheckedChange={() => toggleFilter('formats', format)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label>{format.replace('_', ' ')}</Checkbox.Label>
                      </Checkbox.Root>
                    ))}
                  </HStack>
                </Box>
              )}

              {/* Kind Filters */}
              {availableKinds.length > 0 && (
                <Box>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">
                    Event Type
                  </Text>
                  <HStack gap={3} flexWrap="wrap">
                    {availableKinds.map((kind) => (
                      <Checkbox.Root
                        key={kind}
                        checked={filters.kinds.includes(kind)}
                        onCheckedChange={() => toggleFilter('kinds', kind)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label>{kind}</Checkbox.Label>
                      </Checkbox.Root>
                    ))}
                  </HStack>
                </Box>
              )}

              {/* Decorator Filters */}
              {availableDecorators.length > 0 && (
                <Box>
                  <Text fontWeight="semibold" mb={2} fontSize="sm">
                    Decorators
                  </Text>
                  <HStack gap={3} flexWrap="wrap">
                    {availableDecorators.map((decorator) => (
                      <Checkbox.Root
                        key={decorator}
                        checked={filters.decorators.includes(decorator)}
                        onCheckedChange={() => toggleFilter('decorators', decorator)}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control>
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                        <Checkbox.Label>{decorator.replace('_', ' ')}</Checkbox.Label>
                      </Checkbox.Root>
                    ))}
                  </HStack>
                </Box>
              )}
            </VStack>
          </Box>
        )}

        <Box>
          <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          events={events}
          eventClick={handleEventClick}
          eventMouseEnter={handleEventMouseEnter}
          eventMouseLeave={handleEventMouseLeave}
          datesSet={handleDatesSet}
          height="auto"
          eventColor="#3182ce"
          eventDisplay="block"
          displayEventTime={true}
          displayEventEnd={false}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
        />
        </Box>
      </VStack>

      {/* Event Detail Modal */}
      {selectedEventSlug && (
        <DialogRoot
          open={isModalOpen}
          onOpenChange={(e) => setIsModalOpen(e.open)}
          size="xl"
        >
          <DialogBackdrop />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Event Details</DialogTitle>
              <DialogCloseTrigger />
            </DialogHeader>
            <DialogBody>
              <EventDetailView
                groupSlug={groupSlug}
                eventSlug={selectedEventSlug}
                onBack={() => setIsModalOpen(false)}
              />
            </DialogBody>
          </DialogContent>
        </DialogRoot>
      )}
    </>
  );
}

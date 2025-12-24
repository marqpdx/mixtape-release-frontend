// src/components/almanac/EventCalendar.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Spinner, Text } from '@chakra-ui/react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useQuery } from '@tanstack/react-query';
import { almanacApi } from '@/lib/almanac/almanacApi';
import type { CalendarOccurrence } from '@/lib/almanac/almanacApi';
import { MixtapeAlert } from '@/components/ui/alerts/MixtapeAlert';

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

  // Fetch calendar occurrences
  const { data: occurrences, isLoading, error } = useQuery({
    queryKey: ['almanac', 'calendar', groupSlug, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: () => almanacApi.getGroupCalendar(groupSlug, dateRange.start, dateRange.end),
  });

  // Convert occurrences to FullCalendar events
  const events = Array.isArray(occurrences)
    ? occurrences.map((occurrence: CalendarOccurrence) => ({
        id: occurrence.id,
        title: occurrence.title,
        start: occurrence.start,
        end: occurrence.end,
        extendedProps: {
          eventId: occurrence.event_id,
          location: occurrence.location,
          kind: occurrence.kind,
        },
      }))
    : [];

  // Handle date range changes
  const handleDatesSet = (arg: any) => {
    setDateRange({
      start: arg.start,
      end: arg.end,
    });
  };

  // Handle event click
  const handleEventClick = (clickInfo: any) => {
    const eventId = clickInfo.event.extendedProps.eventId;
    if (onViewEvent && eventId) {
      // Extract slug from event ID or use event ID as slug
      // For now, we'll need to fetch the event to get the slug
      // This is a limitation - we may want to include slug in CalendarOccurrence
      console.log('Event clicked:', eventId);
      // TODO: Navigate to event detail view
      // onViewEvent(eventSlug);
    }
  };

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
  );
}

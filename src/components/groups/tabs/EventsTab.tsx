// src/components/groups/tabs/EventsTab.tsx - CLEAN VERSION

import { Box, Heading, Text, HStack, VStack, Button } from "@chakra-ui/react";
import { IconPlus, IconRefresh } from "@tabler/icons-react";
import { CalendarContainer } from "@components/Calendar";
import { OccurrencesList } from "@components/Calendar/OccurrencesList";
import { CalendarOccurrence } from "lib/almanacApi";
import { useState, useMemo } from "react";
import { useGroupEvents } from "@hooks/useGroupEvents";
import { EventDetailDrawer } from "@components/Calendar/EventDetailDrawer";

interface EventsTabProps {
  group: any;
  isOrganizerOrMember?: boolean;
}

export function EventsTab({ group, isOrganizerOrMember }: EventsTabProps) {
  // Hook auto-loads via its own useEffect - just use it!
  const { events, isLoading, loadEvents, error } = useGroupEvents(group.slug);

  // State for drawer
  const [selectedOccurrence, setSelectedOccurrence] = useState<CalendarOccurrence | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  console.log('🏷️ ccc EventsTab rendering for group:', group);

  // State for calendar month view
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Convert EventResponse to CalendarOccurrence format
  const occurrences = useMemo<CalendarOccurrence[]>(() => {
    return events
      .filter(e => e.status === 'published' && e.next_occurrence)
      .map(event => ({
        id: event.id,
        series_id: '',
        event_id: event.id,
        title: event.title,
        kind: 'event' as const,
        start: event.next_occurrence!.start,
        end: event.next_occurrence!.end,
        location: event.location,
        decorators: event.decorators.map(d => ({
          slug: d.decorator?.slug || '',
          icon: d.decorator?.icon || '',
          name: d.decorator?.name || '',
          context_data: d.context_data || {},
        })),
        event_format: event.event_format,
        event_status: event.status,
        capacity: event.max_attendees ?? null,
        attendee_count: event.next_occurrence?.attendee_count ?? 0,
        is_full: (event.max_attendees ?? 0) > 0 &&
                 (event.next_occurrence?.attendee_count ?? 0) >= (event.max_attendees ?? 0),
        sponsor_display: event.description || event.sponsor_display,
        accommodation_available: false,
        meals_included: false,
        is_cancelled: false,
      }));
  }, [events]);

  const handleRefresh = async () => {
    await loadEvents();
  };

  const handleOccurrenceClick = (occurrence: CalendarOccurrence) => {
    setSelectedOccurrence(occurrence);
    setIsDrawerOpen(true);

    // Switch calendar to event's month
    const eventDate = new Date(occurrence.start);
    setCalendarMonth(eventDate);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleRSVP = (occurrence: CalendarOccurrence) => {
    console.log('RSVP to:', occurrence.id);
  };

  const handleCreateEvent = () => {
    console.log('Creating event');
  };

  return (
    <VStack align="stretch" gap={4}>
      {/* Header */}
      <HStack justify="space-between" align="flex-start">
        <VStack align="start" gap={1}>
          <Heading size="lg">Events</Heading>
          <Text fontSize="sm" color="gray.600">
            {occurrences.length} events scheduled
            {error && ` - Error: ${error}`}
          </Text>
        </VStack>
        <HStack gap={2}>
          {isOrganizerOrMember && (
            <Button colorScheme="green" size="sm" onClick={handleCreateEvent}>
              <IconPlus />
              Create Event
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            loading={isLoading}
          >
            <IconRefresh />
            Refresh
          </Button>
        </HStack>
      </HStack>

      {/* Split Layout: List (25%) | Calendar (75%) */}
      <HStack align="stretch" gap={4} h="600px">
        {/* Left: Event List */}
        <Box flex="0 0 25%" overflow="auto" borderRadius="md" bg="gray.50" _dark={{ bg: 'gray.900' }} p={3}>
          <OccurrencesList
            occurrences={occurrences}
            onOccurrenceClick={handleOccurrenceClick}
            isLoading={isLoading}
          />
        </Box>

        {/* Right: Calendar view */}
        <Box flex="1" overflow="auto">
          <CalendarContainer
            groupSlug={group.slug}
            occurrences={occurrences}
            currentMonth={calendarMonth}
            onMonthChange={setCalendarMonth}
            onOccurrenceClick={handleOccurrenceClick}
            isLoading={isLoading}
            onRSVPSuccess={() => {
              // Optional: refresh events after RSVP
              // loadEvents();
            }}
          />
        </Box>
      </HStack>

      {/* Event Detail Drawer */}
      {selectedOccurrence && (
        <EventDetailDrawer
          isOpen={isDrawerOpen}
          onClose={handleDrawerClose}
          occurrence={selectedOccurrence}
          isLoading={isLoading}
          groupSlug={group.slug}          // ✅ Add this (important!)
        />
      )}
    </VStack>
  );
}


// ```

// ## What Else to Add to Events Page

// **Priority 1 (now):**
// - ✅ Calendar with month/list views
// - ✅ Event detail drawer
// - ✅ RSVP button

// **Priority 2 (soon):**
// 1. **Filters/Search** - by decorator (potluck, outdoor, etc.), event format, date range
// 2. **My RSVPs section** - "Your upcoming events" at top (contrasting card)
// 3. **Past events** - toggled view of completed events
// 4. **Event creation flow** - modal or drawer to create new events (for organizers)

// **Priority 3 (future):**
// 1. **Attendance stats** - "X people attending this workshop"
// 2. **Related events** - "Similar events you might like"
// 3. **Export to calendar** - iCal/Google Calendar button
// 4. **Event analytics** - For organizers: attendance trends, popular times
// 5. **Cancelled events note** - crossed out with reason

// ## UI Structure
// ```
// ┌─────────────────────────────────────────┐
// │ Events                    [+ Create]    │
// │ Community events, workshops, gatherings │
// ├─────────────────────────────────────────┤
// │ [Filters] [Search]     [Month] [List]   │
// ├─────────────────────────────────────────┤
// │                                         │
// │     Calendar (Month/List view)         │
// │                                         │
// ├─────────────────────────────────────────┤
// │ About Events (info box)                 │
// └─────────────────────────────────────────┘
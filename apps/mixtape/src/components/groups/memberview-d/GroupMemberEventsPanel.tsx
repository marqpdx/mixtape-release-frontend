// apps/mixtape/src/components/groups/memberview-d/GroupMemberEventsPanel.tsx

"use client";

import { useState } from "react";
import { Box, Flex, Text, Spinner } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { IconCalendarEvent, IconMapPin, IconUsers } from "@tabler/icons-react";
import { fetchGroupEvents, type EventResponse } from "@mixtape/api/clients/almanac/almanacApi";
import { useEventRSVP } from "@hooks/almanac/useEventRSVP";

interface GroupMemberEventsPanelProps {
  groupSlug: string;
}

// ── helpers ────────────────────────────────────────────────────────────────

function formatEventDate(iso: string): { month: string; day: string } {
  const d = new Date(iso);
  return {
    month: d.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
  };
}

function formatEventTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── EventCard ──────────────────────────────────────────────────────────────

function EventCard({ event, groupSlug }: { event: EventResponse; groupSlug: string }) {
  const { submitRSVP, isSubmitting } = useEventRSVP();
  const [localRsvp, setLocalRsvp] = useState<"going" | "maybe" | "not_going" | null>(null);

  const occurrence = event.next_occurrence;
  const date = occurrence?.start ? formatEventDate(occurrence.start) : null;
  const timeLabel = occurrence?.start ? formatEventTime(occurrence.start) : null;

  async function handleRsvp(status: "going" | "maybe" | "not_going") {
    setLocalRsvp(status);
    try {
      await submitRSVP(groupSlug, event.id, { status });
    } catch {
      setLocalRsvp(null);
    }
  }

  return (
    <Box
      className="gmep-event-card"
      bg="theme.surface"
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="16px"
      boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
      overflow="hidden"
    >
      <Flex p={5} gap={4} align="flex-start">
        {/* Date badge */}
        {date ? (
          <Box
            className="gmep-date-badge"
            flexShrink={0}
            w="52px"
            bg="theme.accentSoft"
            borderRadius="10px"
            textAlign="center"
            py="8px"
          >
            <Text fontSize="10px" fontWeight="700" letterSpacing="0.12em" color="theme.accent" lineHeight="1">
              {date.month}
            </Text>
            <Text fontSize="22px" fontWeight="700" color="theme.accent" lineHeight="1.1" mt="2px">
              {date.day}
            </Text>
          </Box>
        ) : (
          <Box
            flexShrink={0}
            w="52px"
            h="52px"
            bg="theme.bgSubtle"
            borderRadius="10px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box color="theme.textMuted"><IconCalendarEvent size={20} /></Box>
          </Box>
        )}

        {/* Event info */}
        <Box flex="1" minW={0}>
          <Text
            fontFamily="heading"
            fontSize="17px"
            fontWeight="600"
            color="theme.text"
            lineHeight="1.2"
          >
            {event.title}
          </Text>

          {timeLabel && (
            <Text fontSize="13px" color="theme.textSecondary" mt="3px">
              {timeLabel}
            </Text>
          )}

          <Flex gap={4} mt="6px" align="center" flexWrap="wrap">
            {(occurrence?.effective_location || event.location) && (
              <Flex align="center" gap="4px">
                <Box color="theme.textMuted"><IconMapPin size={13} /></Box>
                <Text fontSize="13px" color="theme.textMuted" truncate>
                  {occurrence?.effective_location || event.location}
                </Text>
              </Flex>
            )}
            {event.total_attendees > 0 && (
              <Flex align="center" gap="4px">
                <Box color="theme.textMuted"><IconUsers size={13} /></Box>
                <Text fontSize="13px" color="theme.textMuted">
                  {event.total_attendees} going
                </Text>
              </Flex>
            )}
            {event.event_format && (
              <Box
                px="8px"
                py="2px"
                borderRadius="full"
                bg="theme.bgSubtle"
                borderWidth="1px"
                borderColor="theme.border"
              >
                <Text fontSize="11px" fontWeight="600" color="theme.textSecondary" textTransform="capitalize">
                  {event.event_format}
                </Text>
              </Box>
            )}
          </Flex>
        </Box>
      </Flex>

      {/* RSVP bar */}
      <Flex
        className="gmep-rsvp-bar"
        px={5}
        py="10px"
        borderTopWidth="1px"
        borderColor="theme.border"
        gap={2}
        align="center"
      >
        <Text fontSize="12px" fontWeight="600" color="theme.textMuted" mr={1}>
          RSVP:
        </Text>
        {(["going", "maybe", "not_going"] as const).map((status) => {
          const active = localRsvp === status;
          const labels = { going: "Going", maybe: "Maybe", not_going: "Can't" };
          return (
            <Box
              key={status}
              as="button"
              px="12px"
              py="4px"
              borderRadius="full"
              borderWidth="1px"
              borderColor={active ? "theme.accent" : "theme.border"}
              bg={active ? "theme.accentSoft" : "theme.bg"}
              fontSize="13px"
              fontWeight={active ? "600" : "500"}
              color={active ? "theme.accent" : "theme.textSecondary"}
              cursor={isSubmitting ? "not-allowed" : "pointer"}
              opacity={isSubmitting && !active ? 0.5 : 1}
              transition="all 0.12s"
              _hover={!isSubmitting ? { bg: active ? "theme.accentSoft" : "theme.bgSubtle" } : {}}
              onClick={() => !isSubmitting && handleRsvp(status)}
            >
              {labels[status]}
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}

// ── PastEventRow ───────────────────────────────────────────────────────────

function PastEventRow({ event }: { event: EventResponse }) {
  const occurrence = event.next_occurrence;
  const date = occurrence?.start ? formatEventDate(occurrence.start) : null;

  return (
    <Flex
      className="gmep-past-row"
      align="center"
      gap={3}
      px={4}
      py="10px"
      borderBottomWidth="1px"
      borderColor="theme.border"
      _last={{ borderBottomWidth: 0 }}
      opacity={0.7}
    >
      {date && (
        <Text fontSize="12px" fontWeight="600" color="theme.textMuted" w="44px" flexShrink={0}>
          {date.month} {date.day}
        </Text>
      )}
      <Text flex="1" fontSize="14px" fontWeight="500" color="theme.text" truncate>
        {event.title}
      </Text>
      {event.total_attendees > 0 && (
        <Text fontSize="12px" color="theme.textMuted" flexShrink={0}>
          {event.total_attendees} attended
        </Text>
      )}
    </Flex>
  );
}

// ── SectionEyebrow ─────────────────────────────────────────────────────────

function SectionEyebrow({ label }: { label: string }) {
  return (
    <Text
      fontSize="11.5px"
      fontWeight="600"
      letterSpacing="0.14em"
      textTransform="uppercase"
      color="theme.textMuted"
      mb={3}
    >
      {label}
    </Text>
  );
}

// ── main component ─────────────────────────────────────────────────────────

export function GroupMemberEventsPanel({ groupSlug }: GroupMemberEventsPanelProps) {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ["almanac", "events", "published", groupSlug],
    queryFn: () => fetchGroupEvents(groupSlug, { status: "published" }),
  });

  if (isLoading) {
    return (
      <Flex className="gmep-loading" justify="center" py={12}>
        <Spinner size="md" color="theme.accent" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Box className="gmep-error" p={6} textAlign="center">
        <Text color="theme.textMuted">Could not load events.</Text>
      </Box>
    );
  }

  const now = new Date();
  const upcoming = (events ?? [])
    .filter((e) => e.next_occurrence?.start && new Date(e.next_occurrence.start) >= now)
    .sort((a, b) =>
      new Date(a.next_occurrence!.start).getTime() - new Date(b.next_occurrence!.start).getTime()
    );
  const past = (events ?? [])
    .filter((e) => !e.next_occurrence?.start || new Date(e.next_occurrence.start) < now)
    .sort((a, b) =>
      new Date(b.next_occurrence?.start ?? 0).getTime() -
      new Date(a.next_occurrence?.start ?? 0).getTime()
    );

  if (upcoming.length === 0 && past.length === 0) {
    return (
      <Box className="gmep-empty" textAlign="center" py={16}>
        <Box color="theme.textMuted" mb={3} display="flex" justifyContent="center">
          <IconCalendarEvent size={36} />
        </Box>
        <Text fontFamily="heading" fontSize="20px" color="theme.text" mb={2}>
          No upcoming events
        </Text>
        <Text fontSize="15px" color="theme.textMuted">
          Check back soon — events will appear here when published.
        </Text>
      </Box>
    );
  }

  return (
    <Box className="gmep-root">
      {upcoming.length > 0 && (
        <Box className="gmep-upcoming" mb={8}>
          <SectionEyebrow label={`Upcoming · ${upcoming.length}`} />
          <Flex direction="column" gap={4}>
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} groupSlug={groupSlug} />
            ))}
          </Flex>
        </Box>
      )}

      {past.length > 0 && (
        <Box className="gmep-past">
          <SectionEyebrow label="Past Events" />
          <Box
            bg="theme.surface"
            borderWidth="1px"
            borderColor="theme.border"
            borderRadius="16px"
            overflow="hidden"
            boxShadow="0 1px 2px rgba(20,30,45,.05), 0 1px 3px rgba(20,30,45,.05)"
          >
            {past.map((event) => (
              <PastEventRow key={event.id} event={event} />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}

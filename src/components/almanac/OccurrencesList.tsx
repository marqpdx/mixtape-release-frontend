// src/components/Calendar/OccurrencesList.tsx

/**
 * List view for events/occurrences
 * Alternative to month view - shows chronological list
 * Useful for detailed scanning and filtering
 */

import React, { useMemo } from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Skeleton,
  Heading,
  Flex,
} from '@chakra-ui/react';
import { Tooltip } from '@components/ui/tooltip';
import { CalendarOccurrence } from '@lib/almanac/almanacApi';
import { useColorModeValue } from '@components/ui/color-mode';
import { Divider } from '@components/common/Divider';

interface OccurrencesListProps {
  occurrences: CalendarOccurrence[];
  onOccurrenceClick: (occurrence: CalendarOccurrence) => void;
  isLoading?: boolean;
  filterDecorator?: string;
  filterKind?: 'event' | 'gathering';
}

export const OccurrencesList: React.FC<OccurrencesListProps> = ({
  occurrences,
  onOccurrenceClick,
  isLoading = false,
  filterDecorator,
  filterKind,
}) => {
  // Filter and sort occurrences
  const filteredOccurrences = useMemo(() => {
    if (!Array.isArray(occurrences)) {
      return [];
    }

    let filtered = occurrences;

    // Filter by kind
    if (filterKind) {
      filtered = filtered.filter(occ => occ.kind === filterKind);
    }

    // Filter by decorator
    if (filterDecorator) {
      filtered = filtered.filter(occ =>
        occ.decorators.some(dec => dec.slug === filterDecorator)
      );
    }

    // Sort chronologically
    return filtered.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
  }, [occurrences, filterDecorator, filterKind]);

  // Group by date for visual organization
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: CalendarOccurrence[] } = {};

    filteredOccurrences.forEach(occ => {
      const date = new Date(occ.start).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(occ);
    });

    return groups;
  }, [filteredOccurrences]);

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  if (isLoading) {
    return (
      <VStack align="stretch" gap={3}>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} h="20" />
        ))}
      </VStack>
    );
  }

  if (filteredOccurrences.length === 0) {
    return (
      <Box
        textAlign="center"
        py={8}
        borderRadius="md"
        border="1px dashed"
        borderColor={borderColor}
      >
        <Text color="gray.500">No events scheduled</Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      {Object.entries(groupedByDate).map(([date, occs]) => (
        <Box key={date}>
          {/* Date header */}
          <Text
            fontWeight="bold"
            fontSize="sm"
            mb={2}
            color="gray.600"
            textTransform="uppercase"
          >
            {date}
          </Text>

          {/* Events for this date */}
          <VStack align="stretch" gap={2}>
            {occs.map(occ => (
              <OccurrenceListItem
                key={occ.id}
                occurrence={occ}
                onClick={() => onOccurrenceClick(occ)}
                cardBg={cardBg}
                borderColor={borderColor}
                hoverBg={hoverBg}
              />
            ))}
          </VStack>

          <Divider my={4} />
        </Box>
      ))}
    </VStack>
  );
};

interface OccurrenceListItemProps {
  occurrence: CalendarOccurrence;
  onClick: () => void;
  cardBg: string;
  borderColor: string;
  hoverBg: string;
}

const OccurrenceListItem: React.FC<OccurrenceListItemProps> = ({
  occurrence,
  onClick,
  cardBg,
  borderColor,
  hoverBg,
}) => {
  const startTime = new Date(occurrence.start).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const endTime = new Date(occurrence.end).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const capacityPercent =
    occurrence.capacity && occurrence.attendee_count
      ? Math.round((occurrence.attendee_count / occurrence.capacity) * 100)
      : 0;

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{
        bg: hoverBg,
        shadow: 'md',
        borderColor: 'green.400',
      }}
      onClick={onClick}
    >
      <VStack align="stretch" gap={3}>
        {/* Title and time */}
        <Flex align="start" gap={3}>
          <VStack align="stretch" gap={1} flex={1}>
            <Heading size="sm" lineClamp={1}>
              {occurrence.title}
            </Heading>
            <Text fontSize="sm" color="gray.600">
              {startTime} – {endTime}
            </Text>
          </VStack>

          {/* Status badges */}
          <HStack gap={1} flexShrink={0} wrap="wrap" justify="flex-end">
            <Badge colorScheme="blue" fontSize="xs">
              {occurrence.event_format}
            </Badge>
            {occurrence.is_full && (
              <Badge colorScheme="red" fontSize="xs">
                FULL
              </Badge>
            )}
          </HStack>
        </Flex>

        {/* Location */}
        {occurrence.location && (
          <Text fontSize="sm" color="gray.700" _dark={{ color: 'gray.300' }}>
            📍 {occurrence.location}
          </Text>
        )}

        {/* Sponsor */}
        <Text fontSize="xs" color="gray.500">
          {occurrence.sponsor_display}
        </Text>

        {/* Capacity bar (if limited) */}
        {occurrence.capacity && (
          <Flex align="center" gap={2} fontSize="xs">
            <Box bg="gray.200" h="1.5" borderRadius="full" flex={1} overflow="hidden">
              <Box
                bg="green.500"
                h="full"
                w={`${capacityPercent}%`}
                transition="width 0.3s"
              />
            </Box>
            <Text flexShrink={0} fontWeight="500">
              {occurrence.attendee_count}/{occurrence.capacity}
            </Text>
          </Flex>
        )}

        {/* Decorators */}
        {occurrence.decorators.length > 0 && (
          <HStack gap={2} wrap="wrap">
            {occurrence.decorators.map(dec => (
              <Box key={dec.slug}>
                <Tooltip content={dec.name}>
                  <Badge
                    colorScheme="green"
                    variant="subtle"
                    fontSize="xs"
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    {dec.icon && <span>{dec.icon}</span>}
                    <span>{dec.name}</span>
                  </Badge>
                </Tooltip>
              </Box>
            ))}
          </HStack>
        )}

        {/* Gathering info */}
        {occurrence.kind === 'gathering' && (
          <HStack gap={2} fontSize="sm">
            {occurrence.accommodation_available && <Text>🏠 Accommodation</Text>}
            {occurrence.meals_included && <Text>🍽️ Meals</Text>}
          </HStack>
        )}
      </VStack>
    </Box>
  );
};
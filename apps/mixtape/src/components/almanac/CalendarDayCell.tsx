// src/components/Calendar/CalendarDayCell.tsx

/**
 * Individual calendar day cell
 * Shows date and up to 3 occurrence previews with decorators
 */

import React, { useMemo, useState } from 'react';
import {
  Box,
  Text,
  VStack,
  HStack,
  Badge,
  AspectRatio,
  Dialog,
  Button,
} from '@chakra-ui/react';
import { Tooltip } from '@components/ui/tooltip';
import { CalendarDay, CalendarOccurrence } from '@mixtape/api/clients/almanac/almanacApi';

interface CalendarDayCellProps {
  day: CalendarDay;
  onOccurrenceClick: (occurrence: CalendarOccurrence) => void;
  cellBg: string;
  cellBorder: string;
  todayBg: string;
  otherMonthText: string;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  day,
  onOccurrenceClick,
  cellBg,
  cellBorder,
  todayBg,
  otherMonthText,
}) => {
  const [showAllModal, setShowAllModal] = useState(false);

  const dayNum = day.dayOfMonth;
  const isOtherMonth = !day.isCurrentMonth;
  const hasOccurrences = day.occurrences.length > 0;

  // ✅ Sort occurrences by start time (earliest first) and show max 3
  const visibleOccurrences = useMemo(() => {
    return [...day.occurrences]
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3);
  }, [day.occurrences]);

  // ✅ Sorted list of all occurrences for modal
  const allOccurrences = useMemo(() => {
    return [...day.occurrences]
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [day.occurrences]);

  const hiddenCount = Math.max(0, day.occurrences.length - 3);

  const bg = day.isToday ? todayBg : cellBg;
  const textColor = isOtherMonth ? otherMonthText : 'inherit';

  return (
    <AspectRatio ratio={1}>
      <Box
        bg={bg}
        border={`1px solid ${cellBorder}`}
        borderRadius="md"
        p={2}
        minH="120px"
        cursor={hasOccurrences ? 'pointer' : 'default'}
        transition="all 0.2s"
        _hover={
          hasOccurrences
            ? {
                shadow: 'md',
                borderColor: 'green.300',
              }
            : {}
        }
        opacity={isOtherMonth ? 0.6 : 1}
      >
        <VStack align="stretch" gap={1} h="full">
          {/* Day number */}
          <Box>
            <Text
              fontSize="sm"
              fontWeight={day.isToday ? 'bold' : 'normal'}
              color={textColor}
            >
              {dayNum}
            </Text>
          </Box>

          {/* Event occurrences */}
          {hasOccurrences && (
            <VStack align="stretch" gap={1} flex={1} justify="flex-start" minH={0}>
              {visibleOccurrences.map(occ => (
                <OccurrencePreview
                  key={occ.id}
                  occurrence={occ}
                  onClick={() => onOccurrenceClick(occ)}
                />
              ))}

              {/* Show count of hidden occurrences */}
              {hiddenCount > 0 && (
                <Tooltip content={`+${hiddenCount} more event(s) - click to see all`}>
                  <Badge
                    size="sm"
                    colorScheme="blue"
                    cursor="pointer"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setShowAllModal(true);
                    }}
                  >
                    +{hiddenCount}
                  </Badge>
                </Tooltip>
              )}
            </VStack>
          )}
        </VStack>
      </Box>

      {/* ✅ Modal to show all occurrences for the day */}
      <Dialog.Root open={showAllModal} onOpenChange={({ open }: { open: boolean }) => setShowAllModal(open)}>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                Events on {day.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>

            <Dialog.Body>
              <VStack align="stretch" gap={2}>
                {allOccurrences.map((occ) => {
                  const startTime = new Date(occ.start).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });

                  return (
                    <Box
                      key={occ.id}
                      p={3}
                      bg="gray.50"
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ bg: 'gray.100', shadow: 'sm' }}
                      onClick={() => {
                        setShowAllModal(false);
                        onOccurrenceClick(occ);
                      }}
                    >
                      <VStack align="stretch" gap={1}>
                        <HStack justify="space-between">
                          <Text fontWeight="bold" fontSize="sm">
                            {startTime}
                          </Text>
                          {occ.is_full && (
                            <Badge colorScheme="red" size="sm">
                              FULL
                            </Badge>
                          )}
                        </HStack>
                        <Text fontSize="sm">{occ.title}</Text>
                        {occ.location && (
                          <Text fontSize="xs" color="gray.600">
                            📍 {occ.location}
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  );
                })}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button onClick={() => setShowAllModal(false)}>Close</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </AspectRatio>
  );
};

interface OccurrencePreviewProps {
  occurrence: CalendarOccurrence;
  onClick: () => void;
}

const OccurrencePreview: React.FC<OccurrencePreviewProps> = ({
  occurrence,
  onClick,
}) => {
  // Format time as HH:MM
  const startTime = new Date(occurrence.start).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const isFull = occurrence.is_full && occurrence.capacity;

  return (
    <Tooltip content={occurrence.title}>
      <Box
        bg="green.50"
        borderColor="green.200"
        borderWidth="1px"
        borderRadius="sm"
        p={1}
        cursor="pointer"
        fontSize="xs"
        onClick={onClick}
        transition="all 0.15s"
        _hover={{
          bg: 'green.100',
          borderColor: 'green.400',
        }}
        _dark={{
          bg: 'green.900',
          borderColor: 'green.700',
          _hover: {
            bg: 'green.800',
            borderColor: 'green.600',
          },
        }}
        overflow="hidden"
      >
        <HStack gap={1}>
          {/* Time */}
          <Text fontWeight="500" flexShrink={0}>
            {startTime}
          </Text>

          {/* Decorators (if any) - show up to 2 icons */}
          {occurrence.decorators.length > 0 && (
            <HStack gap={1} flexShrink={0}>
              {occurrence.decorators.slice(0, 2).map(dec => (
                <Text key={dec.slug} title={dec.name} fontSize="2xs">
                  {dec.icon || '●'}
                </Text>
              ))}
              {occurrence.decorators.length > 2 && (
                <Text fontSize="2xs">•</Text>
              )}
            </HStack>
          )}

          {/* Capacity indicator if full */}
          {isFull && (
            <Badge
              size="xs"
              colorScheme="red"
              flexShrink={0}
              variant="solid"
            >
              FULL
            </Badge>
          )}
        </HStack>

        {/* Truncated title as fallback */}
        <Text
          lineClamp={1}
          fontSize="2xs"
          mt={0.5}
          opacity={0.8}
        >
          {occurrence.title}
        </Text>
      </Box>
    </Tooltip>
  );
};

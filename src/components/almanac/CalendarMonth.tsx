// src/components/Calendar/CalendarMonth.tsx - CONTROLLED MONTH

import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useColorModeValue } from '@components/ui/color-mode';
import { CalendarDay, CalendarOccurrence } from '@lib/almanac/almanacApi';
import { CalendarDayCell } from './CalendarDayCell';

interface CalendarMonthProps {
  occurrences: CalendarOccurrence[];
  onOccurrenceClick: (occurrence: CalendarOccurrence) => void;
  isLoading?: boolean;
  currentMonth?: Date;  // ← Controlled month from parent
  onMonthChange?: (date: Date) => void;  // ← Notify parent of changes
}

export const CalendarMonth: React.FC<CalendarMonthProps> = ({
  occurrences,
  onOccurrenceClick,
  isLoading = false,
  currentMonth = new Date(),
  onMonthChange,
}) => {
  // Generate weeks for the month
  const weeks = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Today's date
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    // First day of month
    const firstDay = new Date(year, month, 1);

    // Starting day of week (0 = Sunday)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const weeks: Array<{ days: CalendarDay[] }> = [];
    let currentDate = new Date(startDate);

    // Generate 6 weeks
    for (let week = 0; week < 6; week++) {
      const days: CalendarDay[] = [];

      for (let day = 0; day < 7; day++) {
        const isCurrentMonth = currentDate.getMonth() === month;
        const dayOfMonth = currentDate.getDate();
        const isToday =
          dayOfMonth === todayDate &&
          currentDate.getMonth() === todayMonth &&
          currentDate.getFullYear() === todayYear;

        const dayOccurrences = occurrences.filter(occ => {
          const occDate = new Date(occ.start);
          return (
            occDate.getFullYear() === currentDate.getFullYear() &&
            occDate.getMonth() === currentDate.getMonth() &&
            occDate.getDate() === dayOfMonth
          );
        });

        days.push({
          date: new Date(currentDate),
          dayOfMonth,
          isCurrentMonth,
          isToday,
          occurrences: dayOccurrences,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push({ days });
    }

    return weeks;
  }, [currentMonth, occurrences]);

  const handlePreviousMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    onMonthChange?.(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    onMonthChange?.(next);
  };

  const handleToday = () => {
    onMonthChange?.(new Date());
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const headerBg = useColorModeValue('white', 'gray.800');
  const headerBorder = useColorModeValue('gray.200', 'gray.700');
  const cellBg = useColorModeValue('gray.50', 'gray.900');
  const cellBorder = useColorModeValue('gray.100', 'gray.800');
  const todayBg = useColorModeValue('blue.50', 'blue.900');
  const otherMonthText = useColorModeValue('gray.400', 'gray.600');

  return (
    <VStack gap={4} align="stretch">
      {/* Header */}
      <Box
        bg={headerBg}
        borderBottom={`1px solid ${headerBorder}`}
        p={4}
        borderRadius="md"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">{monthYear}</Heading>
          <HStack gap={2}>
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePreviousMonth}
            >
              <IconChevronLeft />
              Prev
            </Button>
            <Button size="sm" variant="outline" onClick={handleToday}>
              Today
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleNextMonth}
            >
              Next
              <IconChevronRight />
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Day labels */}
      <Grid templateColumns="repeat(7, 1fr)" gap={1}>
        {dayLabels.map(day => (
          <Box
            key={day}
            textAlign="center"
            fontWeight="bold"
            fontSize="sm"
            py={2}
            color="gray.500"
          >
            {day}
          </Box>
        ))}
      </Grid>

      {/* Calendar grid */}
      <Grid
        templateColumns="repeat(7, 1fr)"
        gap={1}
        borderRadius="md"
        overflow="hidden"
      >
        {weeks.map((week, weekIdx) =>
          week.days.map((day, dayIdx) => (
            <CalendarDayCell
              key={`${weekIdx}-${dayIdx}`}
              day={day}
              isLoading={isLoading}
              onOccurrenceClick={onOccurrenceClick}
              cellBg={cellBg}
              cellBorder={cellBorder}
              todayBg={todayBg}
              otherMonthText={otherMonthText}
            />
          ))
        )}
      </Grid>
    </VStack>
  );
};
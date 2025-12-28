// src/components/Calendar/CalendarContainer.tsx - NO TABS, MONTH VIEW ONLY

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
} from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { CalendarMonth } from './CalendarMonth';
import { EventDetailDrawer } from './EventDetailDrawer';
import { CalendarOccurrence } from '@lib/almanac/almanacApi';
import { MixtapeAlert } from '@components/ui/alerts/MixtapeAlert';
import { toaster } from '@/components/ui/toaster';

interface CalendarContainerProps {
  groupSlug: string;  // ← Required (no default)
  occurrences: CalendarOccurrence[];
  isLoading?: boolean;
  error?: string | null;
  currentMonth: Date;  // ← Required: parent controls month
  onMonthChange: (date: Date) => void;  // ← Required: notify parent
  onOccurrenceClick?: (occurrence: CalendarOccurrence) => void;
  onRSVPSuccess?: () => void;  // ← Changed: callback when RSVP succeeds
}

export const CalendarContainer: React.FC<CalendarContainerProps> = ({
  groupSlug,
  occurrences,
  isLoading = false,
  error = null,
  currentMonth,
  onMonthChange,
  onOccurrenceClick,
  onRSVPSuccess,
}) => {
  const [selectedOccurrence, setSelectedOccurrence] = useState<CalendarOccurrence | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Validate groupSlug on mount
  useEffect(() => {
    if (!groupSlug) {
      console.error('⚠️ CalendarContainer: groupSlug is required but was not provided');
    }
  }, [groupSlug]);

  const handleOccurrenceClick = (occurrence: CalendarOccurrence) => {
    console.log('🖱️ CalendarContainer.handleOccurrenceClick:', occurrence.title);

    // Validate groupSlug before allowing interaction
    if (!groupSlug) {
      toaster.create({
        title: 'Configuration Error',
        description: 'Group information missing. Please refresh the page.',
        type: 'error',
      });
      return;
    }

    // Use parent handler if provided
    if (onOccurrenceClick) {
      onOccurrenceClick(occurrence);
    } else {
      // Fallback: open drawer locally
      setSelectedOccurrence(occurrence);
      setIsDrawerOpen(true);
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  const handleRSVPSuccess = () => {
    // Callback when RSVP succeeds
    if (onRSVPSuccess) {
      onRSVPSuccess();
    }
  };

  const bgColor = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box bg={bgColor} borderRadius="lg" border="1px solid" borderColor={borderColor} p={4}>
      <VStack align="stretch" gap={4} h="full">
        {/* Error alert */}
        {error && (
          <MixtapeAlert description={error} />
        )}

        {/* Calendar Month View */}
        <CalendarMonth
          occurrences={occurrences}
          onOccurrenceClick={handleOccurrenceClick}
          isLoading={isLoading}
          currentMonth={currentMonth}
          onMonthChange={onMonthChange}
        />
      </VStack>

      {/* Detail Drawer */}
      {selectedOccurrence && (
        <EventDetailDrawer
          isOpen={isDrawerOpen}
          onClose={handleDrawerClose}
          occurrence={selectedOccurrence}
          isLoading={isLoading}
          groupSlug={groupSlug}
          onRSVPSuccess={handleRSVPSuccess}
        />
      )}
    </Box>
  );
};
// /src/components/accessibility/LiveRegion.tsx

"use client";

import { Box } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';

/**
 * LiveRegion Component
 *
 * ARIA live region for announcing dynamic content changes to screen readers.
 *
 * Politeness levels:
 * - polite: Waits for user to finish current task (default, less intrusive)
 * - assertive: Interrupts user immediately (use sparingly, e.g., errors)
 * - off: Disabled
 *
 * @example
 * // Announce form submission success
 * <LiveRegion message="Form submitted successfully" politeness="polite" />
 *
 * @example
 * // Announce critical error
 * <LiveRegion message="Error: Connection lost" politeness="assertive" />
 */

interface LiveRegionProps {
  /** Message to announce to screen readers */
  message: string;
  /** How urgently to announce (default: polite) */
  politeness?: 'polite' | 'assertive' | 'off';
  /** Whether to clear message after announcing (default: true) */
  clearAfter?: number; // milliseconds
}

export function LiveRegion({
  message,
  politeness = 'polite',
  clearAfter = 5000
}: LiveRegionProps) {
  const messageRef = useRef<string>('');

  useEffect(() => {
    messageRef.current = message;

    if (clearAfter && message) {
      const timer = setTimeout(() => {
        messageRef.current = '';
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <Box
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      position="absolute"
      width="1px"
      height="1px"
      padding="0"
      margin="-1px"
      overflow="hidden"
      clip="rect(0, 0, 0, 0)"
      whiteSpace="nowrap"
      border="0"
    >
      {message}
    </Box>
  );
}

/**
 * useLiveAnnouncer Hook
 *
 * Programmatically announce messages to screen readers.
 *
 * @example
 * const announce = useLiveAnnouncer();
 *
 * const handleDelete = () => {
 *   deleteItem();
 *   announce('Item deleted successfully');
 * };
 */

import { useState, useCallback } from 'react';

interface AnnounceOptions {
  politeness?: 'polite' | 'assertive';
  clearAfter?: number;
}

export function useLiveAnnouncer() {
  const [announcement, setAnnouncement] = useState<{
    message: string;
    politeness: 'polite' | 'assertive';
    key: number;
  }>({ message: '', politeness: 'polite', key: 0 });

  const announce = useCallback((
    message: string,
    options: AnnounceOptions = {}
  ) => {
    const { politeness = 'polite', clearAfter = 3000 } = options;

    // Update with new message
    setAnnouncement({
      message,
      politeness,
      key: Date.now() // Force re-render
    });

    // Clear after delay
    if (clearAfter) {
      setTimeout(() => {
        setAnnouncement(prev => ({ ...prev, message: '' }));
      }, clearAfter);
    }
  }, []);

  return {
    announce,
    LiveRegionComponent: () => (
      <LiveRegion
        key={announcement.key}
        message={announcement.message}
        politeness={announcement.politeness}
      />
    )
  };
}

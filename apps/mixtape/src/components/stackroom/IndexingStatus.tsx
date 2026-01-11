// IndexingStatus.tsx - Shows indexing progress for Collections

'use client';

import { useEffect, useState } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import type { IngestionStatus } from '@mixtape/core/types/collectionTypes';

interface IndexingStatusProps {
  ingestionStatus: IngestionStatus;
  /** Duration in ms before status fades out after completion (default: 5000) */
  fadeOutDelay?: number;
}

export function IndexingStatus({
  ingestionStatus,
  fadeOutDelay = 5000,
}: IndexingStatusProps) {
  const [hasFadedOut, setHasFadedOut] = useState(false);

  const isProcessing = ingestionStatus.processing > 0 || ingestionStatus.pending > 0;
  const isComplete = ingestionStatus.total > 0 &&
                     ingestionStatus.ready === ingestionStatus.total;

  // Reset fade out when processing starts
  useEffect(() => {
    if (isProcessing) {
      setHasFadedOut(false);
    }
  }, [isProcessing]);

  // Fade out after completion
  useEffect(() => {
    if (isComplete && !isProcessing && !hasFadedOut) {
      const timer = setTimeout(() => {
        setHasFadedOut(true);
      }, fadeOutDelay);

      return () => clearTimeout(timer);
    }
  }, [isComplete, isProcessing, hasFadedOut, fadeOutDelay]);

  // Don't show if nothing to process or already faded out
  if (ingestionStatus.total === 0 || hasFadedOut) {
    return null;
  }

  // Show processing status
  if (isProcessing) {
    return (
      <HStack gap={2} alignItems="center">
        <SparkleIcon status="indexing" />
        <Text fontSize="xs" color="gray.600">
          Indexing...
        </Text>
      </HStack>
    );
  }

  // Show complete status (will fade out)
  if (isComplete) {
    return (
      <HStack
        gap={2}
        alignItems="center"
        animation="fadeOut 1s ease-in"
        style={{
          animationDelay: `${fadeOutDelay - 1000}ms`,
          animationFillMode: 'forwards',
        }}
      >
        <SparkleIcon status="ready" />
        <Text fontSize="xs" color="green.600" fontWeight="medium">
          Ready to search
        </Text>
      </HStack>
    );
  }

  return null;
}

interface SparkleIconProps {
  status: 'indexing' | 'ready';
}

function SparkleIcon({ status }: SparkleIconProps) {
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w="14px"
      h="14px"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        style={{
          color: status === 'indexing' ? '#60A5FA' : '#34D399', // blue-400 : green-400
          animation: status === 'indexing' ? 'spin 1s linear infinite' : 'none',
        }}
      >
        {/* Claude-style asterisk sparkle */}
        <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <line x1="6" y1="1" x2="6" y2="11" />
          <line x1="1" y1="6" x2="11" y2="6" />
          <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
          <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
        </g>
      </svg>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
    </Box>
  );
}

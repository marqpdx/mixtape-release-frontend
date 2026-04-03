// src/components/writing/copydesk/SplitSuggestionCallout.tsx
//
// Non-blocking callout shown when a split suggestion is ready or shown.
// Phase 2: shows AI rationale. Phase 3 will add split marker insertion.

'use client';

import { useState } from 'react';
import { Box, HStack, VStack, Text, Button, Spinner } from '@chakra-ui/react';
import { IconScissors } from '@tabler/icons-react';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import type { SplitSuggestionStatus } from '@/lib/writing/useWorkingCopyAutosave';

interface SplitPoint {
  after_paragraph_index: number;
  rationale: string;
}

interface SplitSuggestionCalloutProps {
  pieceId: string;
  status: SplitSuggestionStatus;
  onStatusChange: (status: SplitSuggestionStatus) => void;
  onInsertSplitMarkers?: (splitPoints: SplitPoint[]) => void;
}

export function SplitSuggestionCallout({
  pieceId,
  status,
  onStatusChange,
  onInsertSplitMarkers,
}: SplitSuggestionCalloutProps) {
  const [loading, setLoading] = useState(false);
  const [splitPoints, setSplitPoints] = useState<SplitPoint[]>([]);
  const [showRationale, setShowRationale] = useState(false);

  if (status !== 'ready' && status !== 'shown') return null;

  const act = async (action: 'view' | 'dismiss' | 'decline') => {
    setLoading(true);
    try {
      const res = await axiosInstance.post(
        `/api/writing/pieces/${pieceId}/split-suggestion`,
        { action }
      );
      const updated = res.data;
      onStatusChange(updated.status as SplitSuggestionStatus);

      if (action === 'view') {
        setSplitPoints(updated.suggestions ?? []);
        setShowRationale(true);
      }
    } catch (err) {
      console.error('[split-callout] Action failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      position="fixed"
      bottom={6}
      right={6}
      maxW="340px"
      bg="white"
      border="1px solid"
      borderColor="orange.200"
      borderRadius="lg"
      shadow="md"
      p={4}
      zIndex={100}
    >
      <VStack gap={3} align="stretch">
        <HStack gap={2}>
          <IconScissors size={16} color="#f59e0b" />
          <Text fontSize="sm" fontWeight="semibold" color="gray.800">
            Split suggestion ready
          </Text>
        </HStack>

        {!showRationale ? (
          <>
            <Text fontSize="xs" color="gray.600">
              This piece may work well as 2 separate parts. Want to see where?
            </Text>

            <HStack gap={2} justify="flex-end">
              {loading ? (
                <Spinner size="sm" color="orange.400" />
              ) : (
                <>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="gray.500"
                    onClick={() => act('dismiss')}
                  >
                    Not now
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="gray.500"
                    onClick={() => act('decline')}
                  >
                    Keep as one piece
                  </Button>
                  <Button
                    size="xs"
                    colorPalette="orange"
                    variant="subtle"
                    onClick={() => act('view')}
                  >
                    Tell me more
                  </Button>
                </>
              )}
            </HStack>
          </>
        ) : (
          <>
            {splitPoints.length === 0 ? (
              <Text fontSize="xs" color="gray.500">
                The AI found no strong split points. Your piece reads well as one.
              </Text>
            ) : (
              <VStack gap={2} align="stretch">
                {splitPoints.map((sp, i) => (
                  <Box key={i} bg="orange.50" borderRadius="md" px={3} py={2}>
                    <Text fontSize="xs" fontWeight="medium" color="orange.700" mb={1}>
                      Split {i + 1} — after paragraph {sp.after_paragraph_index + 1}
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      {sp.rationale}
                    </Text>
                  </Box>
                ))}
                {onInsertSplitMarkers && (
                  <Button
                    size="xs"
                    colorPalette="orange"
                    variant="subtle"
                    onClick={() => {
                      onInsertSplitMarkers(splitPoints)
                      act('dismiss')
                    }}
                    disabled={loading}
                  >
                    Insert split markers
                  </Button>
                )}
              </VStack>
            )}

            <HStack gap={2} justify="flex-end">
              <Button
                size="xs"
                variant="ghost"
                color="gray.500"
                onClick={() => act('decline')}
                disabled={loading}
              >
                Keep as one piece
              </Button>
              <Button
                size="xs"
                variant="ghost"
                color="gray.500"
                onClick={() => act('dismiss')}
                disabled={loading}
              >
                Dismiss
              </Button>
            </HStack>
          </>
        )}
      </VStack>
    </Box>
  );
}

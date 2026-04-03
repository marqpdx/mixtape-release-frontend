// src/components/writing/copydesk/ExecuteSplitBanner.tsx
//
// Fixed bottom-right banner shown when the document contains splitMarker nodes
// and the user is not yet in stream mode.
// Clicking "Execute split" calls the backend, which creates the WorkSession
// and returns the surface document. The caller resumes the session.

'use client';

import { useState } from 'react';
import { Box, HStack, VStack, Text, Button, Spinner } from '@chakra-ui/react';
import { IconScissors } from '@tabler/icons-react';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import type { JSONContent } from '@tiptap/react';

interface ExecuteSplitResult {
  session_id: string;
  surface_body_json: JSONContent;
  new_piece_ids: string[];
}

interface ExecuteSplitBannerProps {
  pieceId: string;
  splitMarkerCount: number;
  onSplitExecuted: (result: ExecuteSplitResult) => void;
}

export function ExecuteSplitBanner({
  pieceId,
  splitMarkerCount,
  onSplitExecuted,
}: ExecuteSplitBannerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (splitMarkerCount === 0) return null;

  const handleExecute = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await axiosInstance.post(
        `/api/writing/pieces/${pieceId}/execute-split`
      );
      onSplitExecuted(res.data as ExecuteSplitResult);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Split failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const label =
    splitMarkerCount === 1
      ? '1 split marker in this piece'
      : `${splitMarkerCount} split markers in this piece`;

  return (
    <Box
      position="fixed"
      bottom={6}
      right={6}
      maxW="320px"
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
            Ready to split
          </Text>
        </HStack>

        <Text fontSize="xs" color="gray.600">
          {label}. Execute the split to open each part as a separate piece in a
          writing session.
        </Text>

        {error && (
          <Text fontSize="xs" color="red.500">
            {error}
          </Text>
        )}

        <HStack gap={2} justify="flex-end">
          {loading ? (
            <Spinner size="sm" color="orange.400" />
          ) : (
            <Button
              size="xs"
              colorPalette="orange"
              variant="subtle"
              onClick={handleExecute}
            >
              Execute split
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}

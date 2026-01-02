// src/components/write/modals/SummaryReplaceModal.tsx

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button
} from '@chakra-ui/react';

export interface SummaryReplaceModalProps {
  currentSummary: string;
  pendingAISummary: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SummaryReplaceModal({
  currentSummary,
  pendingAISummary,
  onConfirm,
  onCancel
}: SummaryReplaceModalProps) {
  return (
    <Box
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      bg="blackAlpha.500"
      zIndex="9999"
      display="flex"
      alignItems="center"
      justifyContent="center"
      onClick={onCancel}
    >
      <Box
        bg="white"
        borderRadius="lg"
        shadow="xl"
        p="6"
        maxW="md"
        w="90%"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <VStack gap={4} align="stretch">
          <Text fontWeight="bold" fontSize="lg">
            Replace Summary?
          </Text>

          <Text fontSize="sm" color="gray.600">
            You already have a summary. Do you want to replace it with the new AI-generated version?
          </Text>

          <Box p={3} bg="green.50" borderRadius="md" fontSize="sm" color="gray.700">
            <Text fontWeight="medium" mb={1}>New AI Summary:</Text>
            {pendingAISummary}
          </Box>

          {currentSummary && (
            <Box p={3} bg="gray.50" borderRadius="md" fontSize="sm" color="gray.600">
              <Text fontWeight="medium" mb={1}>Current Summary:</Text>
              {currentSummary.substring(0, 100)}{currentSummary.length > 100 ? '...' : ''}
            </Box>
          )}

          <HStack justify="end" gap={2}>
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Keep Current
            </Button>
            <Button size="sm" colorScheme="green" onClick={onConfirm}>
              Replace
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
}
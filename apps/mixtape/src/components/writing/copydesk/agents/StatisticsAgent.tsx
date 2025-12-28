// src/components/write/copydesk/agents/StatisticsAgent.tsx

import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Box
} from '@chakra-ui/react';
import { IconChartArrows, IconChartBar } from '@tabler/icons-react';
import { AgentContainer } from '../shared/AgentContainer';

export interface StatisticsAgentProps {
  titleWordCount: number;
  documentWordCount: number;
  summaryWordCount: number;
  compact?: boolean;
}

export function StatisticsAgent({
  titleWordCount,
  documentWordCount,
  summaryWordCount,
  compact = false
}: StatisticsAgentProps) {
  if (compact) {
    return (
      <Box>
        <Text fontSize="xs" fontWeight="medium" color="gray.600" mb={2}>
          Document Statistics
        </Text>
        <VStack gap={1} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="xs" color="gray.500">Title:</Text>
            <Text fontSize="xs" color="gray.700">{titleWordCount} words</Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="xs" color="gray.500">Content:</Text>
            <Text fontSize="xs" color="gray.700">{documentWordCount} words</Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="xs" color="gray.500">Summary:</Text>
            <Text fontSize="xs" color="gray.700">{summaryWordCount} words</Text>
          </HStack>
        </VStack>
      </Box>
    );
  }

  return (
    <AgentContainer
      id="statistics-agent"
      title="Writing Statistics"
      state="ready"
      stateMessage="Live stats"
      icon={<IconChartBar size={16} />}
      iconColor="#F59E0B" // amber-500
    >
      <VStack gap={3} align="stretch">
        <VStack gap={2} align="stretch">
          <HStack justify="space-between" align="center">
            <Text fontSize="sm" fontWeight="medium" color="gray.700">Title</Text>
            <Text fontSize="sm" color="gray.600">{titleWordCount} words</Text>
          </HStack>

          <HStack justify="space-between" align="center">
            <Text fontSize="sm" fontWeight="medium" color="gray.700">Content</Text>
            <Text fontSize="sm" color="gray.600">{documentWordCount} words</Text>
          </HStack>

          <HStack justify="space-between" align="center">
            <Text fontSize="sm" fontWeight="medium" color="gray.700">Summary</Text>
            <Text fontSize="sm" color="gray.600">{summaryWordCount} words</Text>
          </HStack>
        </VStack>

        <Box pt={2} borderTop="1px solid" borderColor="gray.200">
          <HStack justify="space-between" align="center">
            <Text fontSize="sm" fontWeight="bold" color="gray.700">Total</Text>
            <Text fontSize="sm" fontWeight="bold" color="gray.700">
              {titleWordCount + documentWordCount + summaryWordCount} words
            </Text>
          </HStack>
        </Box>

        <VStack gap={1} align="stretch" pt={2}>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Reading time: ~{Math.ceil((documentWordCount) / 200)} min
          </Text>
          <Text fontSize="xs" color="gray.500" textAlign="center">
            Grade level and readability coming soon
          </Text>
        </VStack>
      </VStack>
    </AgentContainer>
  );
}
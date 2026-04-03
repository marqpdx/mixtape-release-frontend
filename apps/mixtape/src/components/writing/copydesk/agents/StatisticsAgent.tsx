// src/components/write/copydesk/agents/StatisticsAgent.tsx

import React from 'react';
import {
  VStack,
  HStack,
  Text,
  Box,
  Input,
  Checkbox,
} from '@chakra-ui/react';
import { IconChartBar, IconAlertTriangleFilled } from '@tabler/icons-react';
import { AgentContainer } from '../shared/AgentContainer';

export interface StatisticsAgentProps {
  titleWordCount: number;
  documentWordCount: number;
  summaryWordCount: number;
  compact?: boolean;
  targetWordCount?: number | null;
  overTarget?: boolean;
  suggestSplits?: boolean;
  onTargetWordCountChange?: (value: number | null) => void;
  onSuggestSplitsChange?: (value: boolean) => void;
}

export function StatisticsAgent({
  titleWordCount,
  documentWordCount,
  summaryWordCount,
  compact = false,
  targetWordCount,
  overTarget = false,
  suggestSplits = false,
  onTargetWordCountChange,
  onSuggestSplitsChange,
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
            <HStack gap={1}>
              <Text fontSize="xs" color={overTarget ? "orange.500" : "gray.700"}>{documentWordCount} words</Text>
              {overTarget && <IconAlertTriangleFilled size={10} color="#f59e0b" title="Over word count target" />}
            </HStack>
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
            <HStack gap={1}>
              <Text fontSize="sm" color={overTarget ? "orange.500" : "gray.600"}>{documentWordCount} words</Text>
              {overTarget && <IconAlertTriangleFilled size={12} color="#f59e0b" title="Over word count target" />}
            </HStack>
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
        </VStack>

        {/* Word count target settings */}
        {onTargetWordCountChange && (
          <Box pt={2} borderTop="1px solid" borderColor="gray.200">
            <VStack gap={2} align="stretch">
              <Text fontSize="xs" fontWeight="medium" color="gray.600">Word Count Goal</Text>
              <HStack gap={2}>
                <Input
                  size="xs"
                  type="number"
                  min={0}
                  placeholder="Target (e.g. 800)"
                  value={targetWordCount ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    onTargetWordCountChange(raw === "" ? null : parseInt(raw, 10));
                  }}
                  maxW="120px"
                />
                {targetWordCount != null && (
                  <Text fontSize="xs" color={overTarget ? "orange.500" : "gray.500"}>
                    {overTarget
                      ? `+${documentWordCount - targetWordCount} over`
                      : `${targetWordCount - documentWordCount} to go`}
                  </Text>
                )}
              </HStack>
              {onSuggestSplitsChange && (
                <Checkbox.Root
                  size="sm"
                  checked={suggestSplits}
                  onCheckedChange={(e) => onSuggestSplitsChange(!!e.checked)}
                  disabled={targetWordCount == null}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>
                    <Text fontSize="xs" color={targetWordCount == null ? "gray.400" : "gray.600"}>
                      Suggest splitting docs
                    </Text>
                  </Checkbox.Label>
                </Checkbox.Root>
              )}
            </VStack>
          </Box>
        )}
      </VStack>
    </AgentContainer>
  );
}

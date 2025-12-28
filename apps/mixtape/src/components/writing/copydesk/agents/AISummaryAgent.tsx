// src/components/write/copydesk/agents/AISummaryAgent.tsx

import React, { useState } from 'react';
import {
  VStack,
  HStack,
  Text,
  Button,
  Box,
  Badge,
  Textarea,
  IconButton
} from '@chakra-ui/react';
import {
  IconSparkles,
  IconCheck,
  IconEye,
  IconRefresh,
  IconX,
  IconStarFilled
} from '@tabler/icons-react';
import { AgentContainer, AgentState } from '../shared/AgentContainer';

export interface AISummaryAgentProps {
  backgroundSummary: string;
  summaryIsGenerating: boolean;
  summaryIsPending: boolean;
  summaryError: any;
  onGenerateNewSummary: () => void;
  summary: string;
  setSummary: (summary: string) => void;
  documentWordCount: number;
}

export function AISummaryAgent({
  backgroundSummary,
  summaryIsGenerating,
  summaryIsPending,
  summaryError,
  onGenerateNewSummary,
  summary,
  setSummary,
  documentWordCount
}: AISummaryAgentProps) {
  const [editingSummary, setEditingSummary] = useState("");
  const [summaryEditMode, setSummaryEditMode] = useState(false);

  const getAgentState = (): AgentState => {
    if (summaryError) return 'error';
    if (summaryIsGenerating) return 'loading';
    if (summaryIsPending) return 'idle';
    if (backgroundSummary) return 'ready';
    return 'idle';
  };

  const getStateMessage = (): string => {
    if (summaryIsPending) return "Waiting...";
    if (summaryIsGenerating) return "Generating...";
    if (backgroundSummary) return "Ready";
    return "Auto-generate";
  };

  // Summary editing handlers
  const handleStartSummaryEdit = () => {
    const cleanSummary = backgroundSummary.replace(/\s*\(\d+\s+words?\)\.?\s*$/i, '');
    setEditingSummary(cleanSummary);
    setSummaryEditMode(true);
  };

  const handleAcceptSummaryEdit = () => {
    setSummary(editingSummary);
    setSummaryEditMode(false);
    setEditingSummary("");
  };

  const handleCancelSummaryEdit = () => {
    setSummaryEditMode(false);
    setEditingSummary("");
  };

  const handleUseSummary = () => {
    const cleanAISummary = backgroundSummary.replace(/\s*\(\d+\s+words?\)\.?\s*$/i, '');
    setSummary(cleanAISummary);
  };

  return (
    <AgentContainer
      id="ai-summary"
      title="AI Summary"
      state={getAgentState()}
      stateMessage={getStateMessage()}
      icon={
        <svg
          width="16"
          height="16"
          viewBox="0 0 12 12"
          fill="none"
          style={{ color: '#10B981' }} // green.500
        >
          <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="6" y1="1" x2="6" y2="11" />
            <line x1="1" y1="6" x2="11" y2="6" />
            <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
            <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
          </g>
        </svg>
      }
      iconColor="#10B981"
    >
      <VStack gap={3} align="stretch">
        {/* When summary is ready */}
        {backgroundSummary && !summaryIsGenerating && !summaryIsPending && (
          <VStack gap={3} align="stretch">
            <HStack justify="space-between" align="center">
              <Badge colorScheme="green" size="sm">
                <IconStarFilled size={12} />
                Ready
              </Badge>
              <HStack gap={1}>
                <IconButton
                  size="xs"
                  variant="ghost"
                  onClick={onGenerateNewSummary}
                  title="Generate new summary"
                  disabled={summaryIsGenerating || summaryIsPending}
                >
                  <IconRefresh size={14} />
                </IconButton>
              </HStack>
            </HStack>

            {!summaryEditMode ? (
              <VStack gap={2} align="stretch">
                <Box position="relative">
                  <Box
                    p={3}
                    bg="green.50"
                    borderRadius="md"
                    borderLeft="3px solid"
                    borderLeftColor="green.400"
                    fontSize="sm"
                    lineHeight="1.4"
                    color="gray.700"
                    cursor="pointer"
                    onClick={handleStartSummaryEdit}
                    _hover={{ bg: "green.100" }}
                    title="Click to edit this summary"
                  >
                    {backgroundSummary.replace(/\s*\(\d+\s+words?\)\.?\s*$/i, '')}
                  </Box>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    position="absolute"
                    bottom="6px"
                    right="8px"
                    bg="green.50"
                    px="2px"
                  >
                    ({backgroundSummary.match(/\((\d+)\s+words?\)/i)?.[1] ||
                      backgroundSummary.replace(/\s*\(\d+\s+words?\)\.?\s*$/i, '').trim().split(/\s+/).length} words)
                  </Text>
                </Box>
                <HStack gap={2}>
                  <Button
                    size="xs"
                    colorScheme="green"
                    variant="solid"
                    onClick={handleUseSummary}
                    title="Use this AI-generated summary"
                  >
                    <IconCheck size={12} />
                    Use Summary
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleStartSummaryEdit}
                    title="Edit before using"
                  >
                    <IconEye size={12} />
                    Edit
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <VStack gap={2} align="stretch">
                <Textarea
                  value={editingSummary}
                  onChange={(e) => setEditingSummary(e.target.value)}
                  rows={4}
                  fontSize="sm"
                  resize="vertical"
                  placeholder="Edit the AI-generated summary..."
                />
                <HStack gap={2}>
                  <Button
                    size="xs"
                    colorScheme="green"
                    variant="solid"
                    onClick={handleAcceptSummaryEdit}
                  >
                    <IconCheck size={12} />
                    Accept
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={handleCancelSummaryEdit}
                  >
                    <IconX size={12} />
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            )}
          </VStack>
        )}

        {/* When generating */}
        {summaryIsGenerating && (
          <VStack gap={2} align="center" py={4}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              Generating AI summary...
            </Text>
          </VStack>
        )}

        {/* When waiting or no summary */}
        {!backgroundSummary && !summaryIsGenerating && !summaryIsPending && (
          <VStack gap={2} align="center" py={4}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              {documentWordCount < 50
                ? `Write ${50 - documentWordCount} more words to generate an AI summary`
                : "AI summary will generate automatically as you write"
              }
            </Text>
            {documentWordCount >= 50 && (
              <Button
                size="xs"
                variant="outline"
                colorScheme="blue"
                onClick={onGenerateNewSummary}
              >
                <IconSparkles size={12} />
                Generate Summary
              </Button>
            )}
          </VStack>
        )}

        {/* Error state */}
        {summaryError && (
          <Box
            p={2}
            bg="red.50"
            borderRadius="md"
            borderLeft="3px solid"
            borderLeftColor="red.400"
          >
            <Text fontSize="xs" color="red.600">
              Failed to generate summary. Try again.
            </Text>
          </Box>
        )}
      </VStack>
    </AgentContainer>
  );
}
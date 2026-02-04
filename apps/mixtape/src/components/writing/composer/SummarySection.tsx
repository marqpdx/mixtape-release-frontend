// apps/mixtape/src/components/writing/composer/SummarySection.tsx

import React from 'react';
import {
  Box,
  HStack,
  Text,
  Textarea,
  IconButton
} from '@chakra-ui/react';
import { IconRefresh } from '@tabler/icons-react';

export interface SummarySectionProps {
  summary: string;
  setSummary: (summary: string) => void;
  previousSummary?: string;
  onUndoSummary?: () => void;
  summaryIsPending?: boolean;
  summaryIsGenerating?: boolean;
  backgroundSummary?: string;
  textareaBg?: string;
  textareaBorderColor?: string;
  textareaFocusBorderColor?: string;
}

export function SummarySection({
  summary,
  setSummary,
  previousSummary,
  onUndoSummary,
  summaryIsPending,
  summaryIsGenerating,
  backgroundSummary,
  textareaBg,
  textareaBorderColor,
  textareaFocusBorderColor,
}: SummarySectionProps) {
  return (
    <Box className="summary-section">
      <HStack justify="space-between" align="center" mb={2}>
        <Text fontSize="sm" fontWeight="medium" color="text.primary">
          Summary (optional)
        </Text>
        <HStack gap={2}>
          {/* Undo button for summary changes */}
          {previousSummary && onUndoSummary && (
            <IconButton
              size="xs"
              variant="ghost"
              onClick={onUndoSummary}
              title={`Restore previous summary: "${previousSummary.substring(0, 50)}${previousSummary.length > 50 ? '...' : ''}"`}
              color="gray.500"
              _hover={{ color: "blue.500" }}
            >
              <IconRefresh size={14} style={{ transform: 'scaleX(-1)' }} />
            </IconButton>
          )}

          {/* AI Summary Status Icon */}
          {(summaryIsPending || summaryIsGenerating || backgroundSummary) && (
            <Box
              display="inline-flex"
              alignItems="center"
              justifyContent="center"
              w="16px"
              h="16px"
              cursor="help"
              title={
                summaryIsPending ? "Waiting to generate summary..." :
                summaryIsGenerating ? "Generating summary..." :
                "AI summary ready"
              }
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{
                  color: summaryIsPending ? '#60A5FA' : // blue-400
                         summaryIsGenerating ? '#FB923C' : // orange-400
                         '#34D399', // green-400
                  animation: summaryIsPending ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' :
                            summaryIsGenerating ? 'spin 1s linear infinite' :
                            'none'
                }}
              >
                {/* Claude-style janky asterisk */}
                <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="6" y1="1" x2="6" y2="11" />
                  <line x1="1" y1="6" x2="11" y2="6" />
                  <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
                  <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
                </g>
              </svg>
            </Box>
          )}
        </HStack>
      </HStack>

      <Textarea
        placeholder="Write a brief summary or use the workspace tools to generate one with AI..."
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={5}
        resize="vertical"
        fontSize="sm"
        bg={textareaBg}
        borderColor={textareaBorderColor}
        _focus={{ borderColor: textareaFocusBorderColor }}
        _placeholder={{ color: "text.secondary" }}
      />
    </Box>
  );
}

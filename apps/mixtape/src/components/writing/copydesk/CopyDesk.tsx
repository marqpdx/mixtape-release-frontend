// src/components/write/copydesk/CopyDesk.tsx

import React from 'react';
import {
  Box,
  VStack,
  Accordion
} from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { Divider } from '@components/common/Divider';
import { TextSelection } from '../hooks/useTextSelection';
import { CopyDeskHeader } from './CopyDeskHeader';
import { ResearchAgent } from './agents/ResearchAgent';
import { StatisticsAgent } from './agents/StatisticsAgent';
import { WordAgent } from './agents/WordAgent';
import { AISummaryAgent } from './agents/AISummaryAgent';

export interface CopyDeskProps {
  isOpen: boolean;
  onToggle: () => void;
  width: string;
  draftId?: string;

  // Text selection from editor
  selection: TextSelection | null;
  hasSelection: boolean;

  // AI Summary props
  backgroundSummary: string;
  summaryIsGenerating: boolean;
  summaryIsPending: boolean;
  summaryError: unknown;
  onGenerateNewSummary: () => void;
  summary: string;
  setSummary: (summary: string) => void;

  // Document stats
  titleWordCount: number;
  documentWordCount: number;
  summaryWordCount: number;
}

export function CopyDesk({
  isOpen,
  onToggle,
  width,
  draftId,
  selection,
  hasSelection,
  backgroundSummary,
  summaryIsGenerating,
  summaryIsPending,
  summaryError,
  onGenerateNewSummary,
  summary,
  setSummary,
  titleWordCount,
  documentWordCount,
  summaryWordCount
}: CopyDeskProps) {
  // Color mode values
  const workspaceBg = useColorModeValue("gray.50", "gray.800");
  const workspaceBorder = useColorModeValue("gray.200", "gray.600");

  if (!isOpen) {
    return (
      <Box
        w="0px"
        transition="width 0.3s ease"
        bg={workspaceBg}
        borderLeft="1px solid"
        borderColor={workspaceBorder}
        h="100%"
        overflow="hidden"
        position="relative"
      >
        {/* Collapsed indicators will be handled by parent component */}
      </Box>
    );
  }

  return (
    <Box
      w={width}
      transition="width .5s ease"
      bg={workspaceBg}
      borderLeft="1px solid"
      borderColor={workspaceBorder}
      h="100%"
      overflow="hidden"
      position="relative"
    >
      <VStack gap={4} align="stretch" p={4} h="100%" overflow="auto">

        {/* Copy Desk Header */}
        <CopyDeskHeader
          draftId={draftId}
          onToggle={onToggle}
          onCollapseAll={() => {
            // TODO: Implement accordion collapse all
            console.log('Collapse all sections');
          }}
        />

        {/* Copy Desk Agents */}
        <VStack gap={2} align="stretch" flex="1">
          <Accordion.Root collapsible multiple>

            {/* AI Summary Agent */}
            <AISummaryAgent
              backgroundSummary={backgroundSummary}
              summaryIsGenerating={summaryIsGenerating}
              summaryIsPending={summaryIsPending}
              summaryError={summaryError}
              onGenerateNewSummary={onGenerateNewSummary}
              summary={summary}
              setSummary={setSummary}
              documentWordCount={documentWordCount}
            />

            {/* Research Agent */}
            <ResearchAgent
              selection={selection}
              hasSelection={hasSelection}
            />

            {/* Word Agent */}
            <WordAgent
              selection={selection}
              hasSelection={hasSelection}
            />

            {/* Statistics Agent */}
            <StatisticsAgent
              titleWordCount={titleWordCount}
              documentWordCount={documentWordCount}
              summaryWordCount={summaryWordCount}
            />

          </Accordion.Root>
        </VStack>

        <Divider />

        {/* Always Visible Document Stats */}
        <StatisticsAgent
          titleWordCount={titleWordCount}
          documentWordCount={documentWordCount}
          summaryWordCount={summaryWordCount}
          compact={true}
        />
      </VStack>
    </Box>
  );
}

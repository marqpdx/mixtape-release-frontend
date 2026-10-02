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
import { LinkedInCopyAgent } from './agents/LinkedInCopyAgent';
import { PublicSynopsisAgent } from './agents/PublicSynopsisAgent';
import type { LinkedInCopyExtended } from '@mixtape/api/clients/writing/writingApi';

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

  // Word count goal
  targetWordCount?: number | null;
  overTarget?: boolean;
  suggestSplits?: boolean;
  onTargetWordCountChange?: (value: number | null) => void;
  onSuggestSplitsChange?: (value: boolean) => void;

  // LinkedIn copy
  pieceId?: string;
  linkedinCopy?: string;
  linkedinCopyExtended?: LinkedInCopyExtended | null;
  onLinkedInCopyGenerated?: (copy: string, extended: LinkedInCopyExtended) => void;

  // Public synopsis
  pieceSlug?: string;
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
  summaryWordCount,
  targetWordCount,
  overTarget,
  suggestSplits,
  onTargetWordCountChange,
  onSuggestSplitsChange,
  pieceId,
  linkedinCopy = '',
  linkedinCopyExtended = null,
  onLinkedInCopyGenerated,
  pieceSlug,
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

            {/* LinkedIn Copy Agent */}
            <LinkedInCopyAgent
              pieceId={pieceId}
              linkedinCopy={linkedinCopy}
              linkedinCopyExtended={linkedinCopyExtended ?? null}
              onGenerated={onLinkedInCopyGenerated ?? (() => {})}
              documentWordCount={documentWordCount}
            />

            {/* Public Synopsis Agent */}
            <PublicSynopsisAgent
              pieceId={pieceId}
              pieceSlug={pieceSlug}
              excerpt={summary}
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
              targetWordCount={targetWordCount}
              overTarget={overTarget}
              suggestSplits={suggestSplits}
              onTargetWordCountChange={onTargetWordCountChange}
              onSuggestSplitsChange={onSuggestSplitsChange}
            />

          </Accordion.Root>
        </VStack>

        <Divider />

        {/* Always Visible Document Stats */}
        <StatisticsAgent
          titleWordCount={titleWordCount}
          documentWordCount={documentWordCount}
          summaryWordCount={summaryWordCount}
          overTarget={overTarget}
          compact={true}
        />
      </VStack>
    </Box>
  );
}

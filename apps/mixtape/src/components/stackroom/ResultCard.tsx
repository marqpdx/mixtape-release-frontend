// apps/mixtape/src/components/stackroom/ResultCard.tsx

'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  Text,
  Badge,
  HStack,
  VStack,
  IconButton,
  Progress,
} from '@chakra-ui/react';
import {
  DocumentTextIcon,
  ClipboardDocumentIcon,
  ArrowTopRightOnSquareIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import type { ChunkResult } from '@mixtape/core/types/stackroomTypes';
import { toaster } from '../ui/toaster';

interface ResultCardProps {
  result: ChunkResult;
  onOpenViewer?: (result: ChunkResult) => void;
  onTogglePin?: (chunkId: string) => void;
  isPinned?: boolean;
  maxExcerptLength?: number;
  showScore?: boolean;
}

export function ResultCard({
  result,
  onOpenViewer,
  onTogglePin,
  isPinned = false,
  maxExcerptLength = 300,
  showScore = true,
}: ResultCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Truncate excerpt if needed
  const excerpt =
    result.text.length > maxExcerptLength
      ? result.text.substring(0, maxExcerptLength) + '...'
      : result.text;

  // Convert score to percentage
  const scorePercent = Math.round(result.score * 100);

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'green.500';
    if (score >= 75) return 'blue.500';
    if (score >= 60) return 'yellow.500';
    return 'gray.500';
  };

  // Get artifact type display name and color
  const getArtifactTypeInfo = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      normalized_markdown: { label: 'Markdown', color: 'purple' },
      extracted_text: { label: 'Text', color: 'blue' },
      structured_data: { label: 'Data', color: 'green' },
      audio_transcript: { label: 'Audio', color: 'orange' },
    };
    return types[type] || { label: type, color: 'gray' };
  };

  const artifactInfo = getArtifactTypeInfo(result.artifact_type);

  // Copy excerpt to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
      toaster.create({
        title: 'Copied to clipboard',
        type: 'success',
        duration: 2000,
        closable: true,
      });
    } catch {
      toaster.create({
        title: 'Failed to copy',
        description: 'Could not copy text to clipboard',
        type: 'error',
        duration: 3000,
        closable: true,
      });
    }
  };

  const handleOpenViewer = () => {
    if (onOpenViewer) {
      onOpenViewer(result);
    }
  };

  const handleTogglePin = () => {
    if (onTogglePin) {
      onTogglePin(result.chunk_id);
    }
  };

  return (
    <Card.Root
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      borderWidth="1px"
      borderColor={isHovered ? 'blue.500' : 'gray.200'}
      transition="all 0.2s"
      boxShadow={isHovered ? 'md' : 'sm'}
      _hover={{
        transform: 'translateY(-2px)',
      }}
    >
      <Card.Body p={4}>
        <VStack align="stretch" gap={3}>
          {/* Header: Filename and Artifact Type */}
          <HStack justify="space-between" align="start">
            <HStack gap={2} flex={1} minWidth={0}>
              <DocumentTextIcon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <Text fontSize="sm" fontWeight="medium" lineClamp={1} flex={1}>
                {result.filename}
              </Text>
              <Badge colorScheme={artifactInfo.color} size="sm" flexShrink={0}>
                {artifactInfo.label}
              </Badge>
            </HStack>
          </HStack>

          {/* Excerpt */}
          <Text fontSize="sm" color="gray.700" lineHeight="tall" whiteSpace="pre-wrap">
            {excerpt}
          </Text>

          {/* Score Indicator */}
          {showScore && (
            <Box>
              <HStack justify="space-between" mb={1}>
                <Text fontSize="xs" color="gray.600">
                  Relevance
                </Text>
                <Text fontSize="xs" fontWeight="medium" color={getScoreColor(scorePercent)}>
                  {scorePercent}%
                </Text>
              </HStack>
              <Progress.Root
                value={scorePercent}
                size="xs"
                colorPalette={scorePercent >= 75 ? 'green' : scorePercent >= 60 ? 'blue' : 'gray'}
              >
                <Progress.Track>
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            </Box>
          )}

          {/* Action Buttons */}
          <HStack justify="space-between" pt={2} borderTopWidth="1px" borderColor="gray.100">
            <HStack gap={1}>
              <IconButton
                aria-label="Copy excerpt"
                size="sm"
                variant="ghost"
                onClick={handleCopy}
              >
                <ClipboardDocumentIcon style={{ width: '16px', height: '16px' }} />
              </IconButton>

              {onOpenViewer && (
                <IconButton
                  aria-label="Open in viewer"
                  size="sm"
                  variant="ghost"
                  onClick={handleOpenViewer}
                >
                  <ArrowTopRightOnSquareIcon style={{ width: '16px', height: '16px' }} />
                </IconButton>
              )}
            </HStack>

            {onTogglePin && (
              <IconButton
                aria-label={isPinned ? 'Unpin result' : 'Pin result'}
                size="sm"
                variant="ghost"
                onClick={handleTogglePin}
                color={isPinned ? 'blue.500' : undefined}
              >
                {isPinned ? (
                  <BookmarkSolidIcon style={{ width: '16px', height: '16px' }} />
                ) : (
                  <BookmarkIcon style={{ width: '16px', height: '16px' }} />
                )}
              </IconButton>
            )}
          </HStack>

          {/* Path hint (subtle) */}
          <Text fontSize="xs" color="gray.400" lineClamp={1}>
            {result.path}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

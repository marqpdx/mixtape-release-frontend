'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Separator,
  IconButton,
} from '@chakra-ui/react';
import {
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  LinkIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { ChunkResult } from '@mixtape/core/types/stackroomTypes';
import { toaster } from '@mixtape/core/lib/toaster';

interface DocumentViewerProps {
  chunk: ChunkResult;
  fullText: string;
  onClose?: () => void;
  onBack?: () => void;
}

export function DocumentViewer({
  chunk,
  fullText,
  onClose,
  onBack,
}: DocumentViewerProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const [showProvenance, setShowProvenance] = useState(true);

  // Auto-scroll to highlighted chunk on mount
  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);

  // Copy document link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/stackroom/document/${chunk.source_file_id}?chunk=${chunk.chunk_id}`;
    navigator.clipboard.writeText(url);
    toaster.create({
      title: 'Link copied',
      description: 'Document link copied to clipboard',
      type: 'success',
      duration: 2000,
    });
  };

  // Copy full document text
  const handleCopyDocument = () => {
    navigator.clipboard.writeText(fullText);
    toaster.create({
      title: 'Document copied',
      description: 'Full document text copied to clipboard',
      type: 'success',
      duration: 2000,
    });
  };

  // Render document with highlighted chunks
  const renderHighlightedDocument = () => {
    if (!chunk.source_spans || chunk.source_spans.length === 0) {
      return <Text whiteSpace="pre-wrap">{fullText}</Text>;
    }

    // Get the primary span (first one)
    const primarySpan = chunk.source_spans[0];
    const beforeText = fullText.substring(0, primarySpan.char_start);
    const highlightedText = fullText.substring(
      primarySpan.char_start,
      primarySpan.char_end
    );
    const afterText = fullText.substring(primarySpan.char_end);

    return (
      <Box>
        <Text as="span" whiteSpace="pre-wrap">
          {beforeText}
        </Text>
        <Text
          ref={highlightRef}
          as="mark"
          bg="yellow.200"
          px={1}
          borderRadius="sm"
          whiteSpace="pre-wrap"
          fontWeight="medium"
        >
          {highlightedText}
        </Text>
        <Text as="span" whiteSpace="pre-wrap">
          {afterText}
        </Text>
      </Box>
    );
  };

  return (
    <HStack align="stretch" gap={0} height="100vh">
      {/* Main Document Area */}
      <Box flex={1} overflowY="auto" bg="white">
        {/* Header */}
        <Box
          position="sticky"
          top={0}
          bg="white"
          borderBottomWidth="1px"
          zIndex={10}
          p={4}
        >
          <VStack align="stretch" gap={3}>
            <HStack justify="space-between">
              <HStack gap={2}>
                {onBack && (
                  <IconButton
                    aria-label="Back to results"
                    size="sm"
                    variant="ghost"
                    onClick={onBack}
                  >
                    <ArrowLeftIcon style={{ width: '16px', height: '16px' }} />
                  </IconButton>
                )}
                <Text fontSize="xl" fontWeight="semibold" lineClamp={1}>
                  {chunk.filename}
                </Text>
              </HStack>

              <HStack gap={2}>
                <IconButton
                  aria-label="Copy link"
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyLink}
                >
                  <LinkIcon style={{ width: '16px', height: '16px' }} />
                </IconButton>
                <IconButton
                  aria-label="Copy document"
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyDocument}
                >
                  <DocumentDuplicateIcon style={{ width: '16px', height: '16px' }} />
                </IconButton>
                {onClose && (
                  <IconButton
                    aria-label="Close viewer"
                    size="sm"
                    variant="ghost"
                    onClick={onClose}
                  >
                    <XMarkIcon style={{ width: '16px', height: '16px' }} />
                  </IconButton>
                )}
              </HStack>
            </HStack>

            <HStack gap={2}>
              <Badge size="sm" colorScheme="blue">
                {chunk.artifact_type}
              </Badge>
              <Text fontSize="sm" color="gray.600" lineClamp={1}>
                {chunk.path}
              </Text>
            </HStack>
          </VStack>
        </Box>

        {/* Document Content */}
        <Box p={8} maxWidth="900px" mx="auto">
          <Box
            fontSize="md"
            lineHeight="tall"
            color="gray.800"
            fontFamily="monospace"
          >
            {renderHighlightedDocument()}
          </Box>
        </Box>
      </Box>

      {/* Provenance Sidebar */}
      {showProvenance && (
        <Box
          width="350px"
          borderLeftWidth="1px"
          bg="gray.50"
          overflowY="auto"
          p={6}
        >
          <VStack align="stretch" gap={6}>
            {/* Header */}
            <HStack justify="space-between">
              <Text fontSize="lg" fontWeight="semibold">
                Document Info
              </Text>
              <IconButton
                aria-label="Close sidebar"
                size="sm"
                variant="ghost"
                onClick={() => setShowProvenance(false)}
              >
                <XMarkIcon style={{ width: '16px', height: '16px' }} />
              </IconButton>
            </HStack>

            <Separator />

            {/* File Information */}
            <VStack align="stretch" gap={3}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                File Details
              </Text>

              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                  Filename
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {chunk.filename}
                </Text>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                  Path
                </Text>
                <Text fontSize="sm" fontFamily="mono" wordBreak="break-all">
                  {chunk.path}
                </Text>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                  Artifact Type
                </Text>
                <Badge size="sm" colorScheme="blue">
                  {chunk.artifact_type}
                </Badge>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                  Source File ID
                </Text>
                <Text fontSize="xs" fontFamily="mono" color="gray.500">
                  {chunk.source_file_id}
                </Text>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                  Artifact ID
                </Text>
                <Text fontSize="xs" fontFamily="mono" color="gray.500">
                  {chunk.artifact_id}
                </Text>
              </Box>
            </VStack>

            <Separator />

            {/* Chunk Information */}
            <VStack align="stretch" gap={3}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                Highlighted Chunk
              </Text>

              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                  Chunk ID
                </Text>
                <Text fontSize="xs" fontFamily="mono" color="gray.500">
                  {chunk.chunk_id}
                </Text>
              </Box>

              <Box>
                <Text fontSize="xs" color="gray.600" mb={1}>
                  Relevance Score
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  {Math.round(chunk.score * 100)}%
                </Text>
              </Box>

              {chunk.source_spans && chunk.source_spans.length > 0 && (
                <Box>
                  <Text fontSize="xs" color="gray.600" mb={1}>
                    Position
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Characters {chunk.source_spans[0].char_start} -{' '}
                    {chunk.source_spans[0].char_end}
                  </Text>
                </Box>
              )}

              <Box>
                <Text fontSize="xs" color="gray.600" mb={2}>
                  Excerpt
                </Text>
                <Box
                  p={3}
                  bg="white"
                  borderRadius="md"
                  borderWidth="1px"
                  fontSize="xs"
                  lineHeight="relaxed"
                >
                  {chunk.text.substring(0, 200)}
                  {chunk.text.length > 200 && '...'}
                </Box>
              </Box>
            </VStack>

            <Separator />

            {/* Actions */}
            <VStack gap={2}>
              <Button
                size="sm"
                width="100%"
                variant="outline"
                onClick={handleCopyDocument}
              >
                <DocumentDuplicateIcon style={{ width: '16px', height: '16px' }} />
                Copy Full Document
              </Button>
              <Button
                size="sm"
                width="100%"
                variant="outline"
                onClick={handleCopyLink}
              >
                <LinkIcon style={{ width: '16px', height: '16px' }} />
                Copy Document Link
              </Button>
            </VStack>
          </VStack>
        </Box>
      )}

      {/* Collapsed sidebar toggle */}
      {!showProvenance && (
        <Box
          position="fixed"
          right={4}
          top="50%"
          transform="translateY(-50%)"
          zIndex={10}
        >
          <Button
            size="sm"
            onClick={() => setShowProvenance(true)}
            colorScheme="blue"
          >
            Show Info
          </Button>
        </Box>
      )}
    </HStack>
  );
}

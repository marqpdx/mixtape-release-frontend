'use client';

import { VStack, Stack, Skeleton, Text, Button, Center } from '@chakra-ui/react';
import {
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';
import { ResultCard } from './ResultCard';
import type { ChunkResult } from '@mixtape/core/types/stackroomTypes';

interface ResultsListProps {
  results: ChunkResult[];
  isLoading: boolean;
  error: Error | null;
  query: string;
  onRetry?: () => void;
  onOpenViewer?: (result: ChunkResult) => void;
  onTogglePin?: (chunkId: string) => void;
  pinnedChunks?: Set<string>;
  emptyMessage?: string;
  indexingProgress?: { pending: number; total: number };
}

export function ResultsList({
  results,
  isLoading,
  error,
  query,
  onRetry,
  onOpenViewer,
  onTogglePin,
  pinnedChunks = new Set(),
  emptyMessage,
  indexingProgress,
}: ResultsListProps) {
  // Loading state - skeleton cards
  if (isLoading) {
    return (
      <VStack gap={3} align="stretch" width="100%">
        {[...Array(3)].map((_, i) => (
          <Stack key={i} p={4} borderWidth="1px" borderRadius="md" gap={3}>
            <Skeleton height="20px" width="60%" />
            <Skeleton height="60px" />
            <Skeleton height="16px" width="40%" />
          </Stack>
        ))}
      </VStack>
    );
  }

  // Error state
  if (error) {
    return (
      <Center py={12}>
        <VStack gap={4}>
          <ExclamationTriangleIcon
            style={{ width: '48px', height: '48px', color: 'var(--chakra-colors-red-500)' }}
          />
          <VStack gap={2}>
            <Text fontSize="lg" fontWeight="medium">
              Search Error
            </Text>
            <Text fontSize="sm" color="gray.600" textAlign="center" maxWidth="400px">
              {error.message || 'Something went wrong. Please try again.'}
            </Text>
          </VStack>
          {onRetry && (
            <Button onClick={onRetry} colorScheme="blue" size="sm">
              <ArrowPathIcon style={{ width: '16px', height: '16px' }} />
              Retry
            </Button>
          )}
        </VStack>
      </Center>
    );
  }

  // Empty state - no query yet
  if (!query) {
    return (
      <Center py={12}>
        <VStack gap={4}>
          <MagnifyingGlassIcon
            style={{ width: '48px', height: '48px', color: 'var(--chakra-colors-gray-400)' }}
          />
          <VStack gap={2}>
            <Text fontSize="lg" fontWeight="medium" color="gray.600">
              Search your library
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center" maxWidth="400px">
              Enter a query to find relevant content from your documents
            </Text>
          </VStack>
        </VStack>
      </Center>
    );
  }

  // Empty state - indexing in progress
  if (indexingProgress && indexingProgress.pending > 0) {
    const percentComplete = Math.round(
      ((indexingProgress.total - indexingProgress.pending) / indexingProgress.total) * 100
    );

    return (
      <Center py={12}>
        <VStack gap={4}>
          <DocumentIcon
            style={{ width: '48px', height: '48px', color: 'var(--chakra-colors-blue-500)' }}
          />
          <VStack gap={2}>
            <Text fontSize="lg" fontWeight="medium">
              Indexing in Progress
            </Text>
            <Text fontSize="sm" color="gray.600" textAlign="center" maxWidth="400px">
              {indexingProgress.pending} of {indexingProgress.total} chunks are being indexed
            </Text>
            <Text fontSize="xs" color="gray.500">
              {percentComplete}% complete
            </Text>
          </VStack>
          <Text fontSize="sm" color="gray.500">
            Try again in a few minutes
          </Text>
        </VStack>
      </Center>
    );
  }

  // Empty state - no results
  if (results.length === 0) {
    return (
      <Center py={12}>
        <VStack gap={4}>
          <MagnifyingGlassIcon
            style={{ width: '48px', height: '48px', color: 'var(--chakra-colors-gray-400)' }}
          />
          <VStack gap={2}>
            <Text fontSize="lg" fontWeight="medium" color="gray.600">
              No results found
            </Text>
            <Text fontSize="sm" color="gray.500" textAlign="center" maxWidth="400px">
              {emptyMessage || `No matches for "${query}". Try a different search term or broaden your query.`}
            </Text>
          </VStack>
        </VStack>
      </Center>
    );
  }

  // Results list
  return (
    <VStack gap={3} align="stretch" width="100%">
      <Text fontSize="sm" color="gray.600" px={1}>
        {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
      </Text>

      {results.map((result) => (
        <ResultCard
          key={result.chunk_id}
          result={result}
          onOpenViewer={onOpenViewer}
          onTogglePin={onTogglePin}
          isPinned={pinnedChunks.has(result.chunk_id)}
        />
      ))}
    </VStack>
  );
}

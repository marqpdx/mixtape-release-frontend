'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  Badge,
} from '@chakra-ui/react';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useFind } from '@mixtape/api/hooks/switchboard';
import type { FindResult } from '@mixtape/api/clients/switchboard/switchboardApi';

interface FindPanelProps {
  surface?: 'console' | 'puddlejump';
}

function ResultCard({ result }: { result: FindResult }) {
  const score = Math.round(result.score * 100);
  return (
    <Box
      p={3}
      borderWidth="1px"
      borderColor="theme.border"
      borderRadius="md"
      bg="theme.surface"
    >
      <HStack justify="space-between" mb={1}>
        <Badge colorPalette="blue" variant="subtle" fontSize="xs">
          {score}% match
        </Badge>
        {result.artifact_type && (
          <Text fontSize="xs" color="theme.textSecondary">
            {result.artifact_type}
          </Text>
        )}
      </HStack>
      <Text fontSize="sm" color="theme.text" whiteSpace="pre-wrap" lineClamp={4}>
        {result.text}
      </Text>
    </Box>
  );
}

export default function FindPanel({ surface = 'puddlejump' }: FindPanelProps) {
  const { submit, isSubmitting, result, error, reset } = useFind();
  const [query, setQuery] = useState('');

  const canSubmit = query.trim().length > 0 && !isSubmitting;

  function handleSubmit() {
    if (!canSubmit) return;
    submit({
      query: query.trim(),
      limit: 8,
      score_threshold: 0.0,
      surface: surface === 'puddlejump' ? 'desktop' : 'desktop',
    });
  }

  function handleReset() {
    reset();
    setQuery('');
  }

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" color="theme.text" mb={1}>
          Find
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Search your library by meaning — not just keywords
        </Text>
      </Box>

      {/* Query field — always visible */}
      <HStack gap={2}>
        <Input
          placeholder="What are you looking for?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          fontSize="sm"
          disabled={isSubmitting}
          flex={1}
        />
        <Button
          size="sm"
          colorPalette="blue"
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={isSubmitting}
        >
          <HStack gap={1}>
            <MagnifyingGlassIcon style={{ width: 16, height: 16 }} />
            <span>Search</span>
          </HStack>
        </Button>
      </HStack>

      {/* Error */}
      {error && (
        <Box p={4} borderWidth="1px" borderColor="red.300" borderRadius="lg" bg="red.50">
          <HStack justify="space-between">
            <Text color="red.600" fontSize="sm">
              {error instanceof Error ? error.message : 'Search failed'}
            </Text>
            <Button size="xs" variant="ghost" colorPalette="red" onClick={handleReset}>
              Try again
            </Button>
          </HStack>
        </Box>
      )}

      {/* Results */}
      {result && (
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <HStack gap={2}>
              <Text fontSize="xs" color="theme.textSecondary" fontWeight="medium">
                {result.result_count === 0
                  ? 'No results'
                  : `${result.result_count} result${result.result_count === 1 ? '' : 's'}`}
              </Text>
              {result.result_count === 0 && (
                <Text fontSize="xs" color="theme.textSecondary">
                  — try different wording
                </Text>
              )}
            </HStack>
            <Button size="xs" variant="ghost" colorPalette="gray" onClick={handleReset}>
              <HStack gap={1}>
                <ArrowPathIcon style={{ width: 14, height: 14 }} />
                <span>New search</span>
              </HStack>
            </Button>
          </HStack>

          {result.results.map((r, i) => (
            <ResultCard key={r.artifact_id || i} result={r} />
          ))}
        </VStack>
      )}

      {/* Empty state */}
      {!result && !isSubmitting && !error && (
        <Box
          p={8}
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="theme.border"
          borderRadius="lg"
          textAlign="center"
        >
          <Text color="theme.textSecondary" fontSize="sm">
            Enter a query to search your library
          </Text>
          <Text color="theme.textSecondary" fontSize="xs" mt={1}>
            Searches by meaning — not just matching words
          </Text>
        </Box>
      )}
    </VStack>
  );
}

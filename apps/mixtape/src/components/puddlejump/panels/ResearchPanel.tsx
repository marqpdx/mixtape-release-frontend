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
  Spinner,
  Badge,
  Link,
} from '@chakra-ui/react';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useResearch } from '@mixtape/api/hooks/switchboard';

interface ResearchPanelProps {
  surface?: 'console' | 'puddlejump';
}

export default function ResearchPanel({ surface = 'puddlejump' }: ResearchPanelProps) {
  const { submit, isSubmitting, isPolling, result, error, reset } = useResearch();
  const [query, setQuery] = useState('');

  const canSubmit = query.trim().length > 0 && !isSubmitting && !isPolling;
  const isWorking = isSubmitting || isPolling;

  function handleSubmit() {
    if (!canSubmit) return;
    submit({
      query: query.trim(),
      max_sources: 3,
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
          Research
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Search outside Mixtape — synthesizes Wikipedia sources into a factual answer
        </Text>
      </Box>

      {/* Query field — always visible */}
      <HStack gap={2}>
        <Input
          placeholder="What would you like to research?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          fontSize="sm"
          disabled={isWorking}
          flex={1}
        />
        <Button
          size="sm"
          colorPalette="orange"
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={isWorking}
        >
          <HStack gap={1}>
            <MagnifyingGlassIcon style={{ width: 16, height: 16 }} />
            <span>Research</span>
          </HStack>
        </Button>
      </HStack>

      {/* Polling indicator */}
      {isPolling && (
        <HStack gap={2} py={2}>
          <Spinner size="sm" color="orange.400" />
          <Text fontSize="sm" color="theme.textSecondary">
            Searching and synthesizing…
          </Text>
        </HStack>
      )}

      {/* Error */}
      {error && (
        <Box p={4} borderWidth="1px" borderColor="red.300" borderRadius="lg" bg="red.50">
          <HStack justify="space-between">
            <Text color="red.600" fontSize="sm">
              {error instanceof Error ? error.message : 'Research failed'}
            </Text>
            <Button size="xs" variant="ghost" colorPalette="red" onClick={handleReset}>
              Try again
            </Button>
          </HStack>
        </Box>
      )}

      {/* Result */}
      {result && (
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between">
            <HStack gap={2}>
              {result.sources_used.length > 0 && (
                <Badge colorPalette="orange" variant="subtle" fontSize="xs">
                  {result.source_count} source{result.source_count === 1 ? '' : 's'}
                </Badge>
              )}
              {result.research_refused && (
                <Badge colorPalette="red" variant="subtle" fontSize="xs">
                  refused
                </Badge>
              )}
            </HStack>
            <Button size="xs" variant="ghost" colorPalette="gray" onClick={handleReset}>
              <HStack gap={1}>
                <ArrowPathIcon style={{ width: 14, height: 14 }} />
                <span>New search</span>
              </HStack>
            </Button>
          </HStack>

          {/* Summary */}
          <Box
            p={4}
            bg="theme.surface"
            borderWidth="1px"
            borderColor="theme.border"
            borderRadius="lg"
            borderLeftWidth="3px"
            borderLeftColor="orange.400"
          >
            <Text fontSize="sm" color="theme.text" whiteSpace="pre-wrap">
              {result.research_summary}
            </Text>
          </Box>

          {/* Key points */}
          {result.key_points.length > 0 && (
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary" mb={2}>
                Key points
              </Text>
              <VStack align="stretch" gap={1}>
                {result.key_points.map((point, i) => (
                  <HStack key={i} gap={2} align="start">
                    <Text fontSize="xs" color="orange.400" flexShrink={0} mt={0.5}>•</Text>
                    <Text fontSize="sm" color="theme.text">{point}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* Sources */}
          {result.sources_used.length > 0 && (
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary" mb={1}>
                Sources
              </Text>
              <VStack align="stretch" gap={0.5}>
                {result.sources_used.map((title, i) => (
                  <HStack key={i} gap={2}>
                    <Text fontSize="xs" color="theme.textSecondary">Wikipedia:</Text>
                    {result.source_urls[i] ? (
                      <Text
                        fontSize="xs"
                        color="blue.500"
                        _hover={{ textDecoration: 'underline' }}
                      >
                        <Link href={result.source_urls[i]} target="_blank" rel="noopener noreferrer">{title}</Link>
                      </Text>
                    ) : (
                      <Text fontSize="xs" color="theme.text">{title}</Text>
                    )}
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}
        </VStack>
      )}

      {/* Empty state */}
      {!result && !isWorking && !error && (
        <Box
          p={8}
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="theme.border"
          borderRadius="lg"
          textAlign="center"
        >
          <Text color="theme.textSecondary" fontSize="sm">
            Ask a factual question or enter a topic to research
          </Text>
          <Text color="theme.textSecondary" fontSize="xs" mt={1}>
            Searches Wikipedia and synthesizes a summary
          </Text>
        </Box>
      )}
    </VStack>
  );
}

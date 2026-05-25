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
  type BadgeProps,
} from '@chakra-ui/react';
import { MagnifyingGlassCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { usePattern } from '@mixtape/api/hooks/switchboard';
import type { PatternTheme } from '@mixtape/api/clients/switchboard/switchboardApi';

interface PatternPanelProps {
  surface?: 'console' | 'puddlejump';
}

const FREQUENCY_PALETTE: Record<PatternTheme['frequency'], string> = {
  high: 'cyan',
  medium: 'gray',
  low: 'gray',
};

const FREQUENCY_VARIANT: Record<
  PatternTheme['frequency'],
  NonNullable<BadgeProps['variant']>
> = {
  high: 'subtle',
  medium: 'outline',
  low: 'outline',
};

export default function PatternPanel({ surface = 'puddlejump' }: PatternPanelProps) {
  const { submit, isSubmitting, isPolling, result, error, reset } = usePattern();
  const [query, setQuery] = useState('');

  const canSubmit = query.trim().length > 0 && !isSubmitting && !isPolling;
  const isWorking = isSubmitting || isPolling;

  function handleSubmit() {
    if (!canSubmit) return;
    submit({
      query: query.trim(),
      max_sources: 15,
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
          Pattern
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Analyze your library — finds recurring themes, style patterns, and content gaps
        </Text>
      </Box>

      {/* Query field */}
      <HStack gap={2}>
        <Input
          placeholder="What would you like to analyze? (e.g. how I write about leadership)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          fontSize="sm"
          disabled={isWorking}
          flex={1}
        />
        <Button
          size="sm"
          colorPalette="cyan"
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={isWorking}
        >
          <HStack gap={1}>
            <MagnifyingGlassCircleIcon style={{ width: 16, height: 16 }} />
            <span>Analyze</span>
          </HStack>
        </Button>
      </HStack>

      {/* Polling indicator */}
      {isPolling && (
        <HStack gap={2} py={2}>
          <Spinner size="sm" color="cyan.400" />
          <Text fontSize="sm" color="theme.textSecondary">
            Analyzing your library…
          </Text>
        </HStack>
      )}

      {/* Error */}
      {error && (
        <Box p={4} borderWidth="1px" borderColor="red.300" borderRadius="lg" bg="red.50">
          <HStack justify="space-between">
            <Text color="red.600" fontSize="sm">
              {error instanceof Error ? error.message : 'Analysis failed'}
            </Text>
            <Button size="xs" variant="ghost" colorPalette="red" onClick={handleReset}>
              Try again
            </Button>
          </HStack>
        </Box>
      )}

      {/* Result */}
      {result && (
        <VStack align="stretch" gap={5}>
          <HStack justify="space-between">
            <Badge colorPalette="cyan" variant="subtle" fontSize="xs">
              {result.sources_analyzed} item{result.sources_analyzed === 1 ? '' : 's'} analyzed
            </Badge>
            <Button size="xs" variant="ghost" colorPalette="gray" onClick={handleReset}>
              <HStack gap={1}>
                <ArrowPathIcon style={{ width: 14, height: 14 }} />
                <span>New analysis</span>
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
            borderLeftColor="cyan.400"
          >
            <Text fontSize="sm" color="theme.text" whiteSpace="pre-wrap">
              {result.pattern_summary}
            </Text>
          </Box>

          {/* Themes */}
          {result.themes.length > 0 && (
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary" mb={2}>
                Themes
              </Text>
              <VStack align="stretch" gap={2}>
                {result.themes.map((t, i) => (
                  <Box
                    key={i}
                    p={3}
                    bg="theme.surface"
                    borderWidth="1px"
                    borderColor="theme.border"
                    borderRadius="md"
                  >
                    <HStack gap={2} mb={1}>
                      <Text fontSize="sm" fontWeight="medium" color="theme.text">{t.theme}</Text>
                      <Badge
                        colorPalette={FREQUENCY_PALETTE[t.frequency]}
                        variant={FREQUENCY_VARIANT[t.frequency]}
                        fontSize="2xs"
                      >
                        {t.frequency}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="theme.textSecondary">{t.description}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* Style observations */}
          {result.style_observations.length > 0 && (
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary" mb={2}>
                Style
              </Text>
              <VStack align="stretch" gap={1}>
                {result.style_observations.map((obs, i) => (
                  <HStack key={i} gap={2} align="start">
                    <Text fontSize="xs" color="cyan.400" flexShrink={0} mt={0.5}>•</Text>
                    <Text fontSize="sm" color="theme.text">{obs}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* Content gaps */}
          {result.content_gaps.length > 0 && (
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary" mb={2}>
                Content gaps
              </Text>
              <VStack align="stretch" gap={1}>
                {result.content_gaps.map((gap, i) => (
                  <HStack key={i} gap={2} align="start">
                    <Text fontSize="xs" color="gray.400" flexShrink={0} mt={0.5}>○</Text>
                    <Text fontSize="sm" color="theme.text">{gap}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* Content clusters */}
          {result.content_clusters.length > 0 && (
            <Box>
              <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary" mb={2}>
                Clusters
              </Text>
              <VStack align="stretch" gap={2}>
                {result.content_clusters.map((c, i) => (
                  <Box
                    key={i}
                    p={3}
                    bg="theme.surface"
                    borderWidth="1px"
                    borderColor="theme.border"
                    borderRadius="md"
                  >
                    <Text fontSize="sm" fontWeight="medium" color="theme.text" mb={0.5}>
                      {c.cluster_name}
                    </Text>
                    <Text fontSize="xs" color="theme.textSecondary">{c.description}</Text>
                  </Box>
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
            Enter a focus query to analyze patterns in your library
          </Text>
          <Text color="theme.textSecondary" fontSize="xs" mt={1}>
            Uses IR to retrieve the most relevant items, then synthesizes themes and gaps
          </Text>
        </Box>
      )}
    </VStack>
  );
}

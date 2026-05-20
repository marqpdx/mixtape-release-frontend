// components/puddlejump/panels/SummariesPanel.tsx

'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSuggestSummaries } from '@mixtape/api/hooks/puddlejump';

interface SummariesPanelProps {
  libraryId: string | null;
}

export default function SummariesPanel({ libraryId }: SummariesPanelProps) {
  const { mutate, data, isPending, error } = useSuggestSummaries();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleRun = () => {
    if (!libraryId) return;
    mutate({ libraryId });
    setDismissed(new Set());
  };

  const handleDismiss = (artifactId: string) => {
    setDismissed((prev) => new Set(prev).add(artifactId));
  };

  const suggestions = data?.suggestions.filter(
    (s) => s.suggested_summary && !s.error && !dismissed.has(s.artifact_id)
  ) ?? [];

  const errorSuggestions = data?.suggestions.filter((s) => s.error) ?? [];
  const skipped = data?.suggestions.filter((s) => s.method === 'skipped_too_short') ?? [];

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" color="theme.text" mb={1}>
          Suggest Summaries
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Generate summaries for documents missing them, powered by Inkwell
        </Text>
      </Box>

      {/* Controls */}
      <Box
        p={5}
        borderWidth="1px"
        borderColor="theme.border"
        borderRadius="lg"
        bg="theme.surface"
      >
        <HStack justify="space-between">
          <Text fontSize="sm" color="theme.textSecondary">
            Analyzes all artifacts without an interior summary
          </Text>
          <Button
            size="sm"
            colorPalette="blue"
            onClick={handleRun}
            disabled={!libraryId || isPending}
          >
            <HStack gap={2}>
              {isPending ? (
                <Spinner size="xs" />
              ) : (
                <SparklesIcon style={{ width: 16, height: 16 }} />
              )}
              <span>{isPending ? 'Generating...' : 'Suggest Summaries'}</span>
            </HStack>
          </Button>
        </HStack>
      </Box>

      {/* Error */}
      {error && (
        <Box p={4} borderWidth="1px" borderColor="red.300" borderRadius="lg" bg="red.50">
          <Text color="red.600" fontSize="sm">
            Generation failed: {(error as Error).message}
          </Text>
        </Box>
      )}

      {/* Results */}
      {data && (
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <HStack gap={3}>
              <Text fontWeight="semibold" color="theme.text">
                Suggestions
              </Text>
              <Badge colorPalette="blue">
                {data.suggestions_generated} generated
              </Badge>
              {data.total_missing > data.suggestions_generated && (
                <Badge colorPalette="gray">
                  {data.total_missing} total missing
                </Badge>
              )}
            </HStack>
            {dismissed.size > 0 && (
              <Text fontSize="xs" color="theme.textSecondary">
                {dismissed.size} dismissed
              </Text>
            )}
          </HStack>

          {suggestions.length === 0 && dismissed.size === 0 ? (
            <Box
              p={6}
              borderWidth="1px"
              borderColor="green.300"
              borderRadius="lg"
              bg="green.50"
              textAlign="center"
            >
              <Text color="green.800">
                {data.total_missing === 0
                  ? 'All documents already have summaries'
                  : 'No summaries could be generated'}
              </Text>
            </Box>
          ) : (
            <VStack align="stretch" gap={2}>
              {suggestions.map((suggestion) => (
                <Box
                  key={suggestion.artifact_id}
                  p={4}
                  borderWidth="1px"
                  borderColor="theme.border"
                  borderRadius="lg"
                  bg="theme.surface"
                >
                  <HStack justify="space-between" mb={2}>
                    <HStack gap={2}>
                      <Text fontWeight="medium" color="theme.text" fontSize="sm">
                        {suggestion.filename}
                      </Text>
                      <Badge size="sm" variant="subtle" colorPalette="purple">
                        {suggestion.method}
                      </Badge>
                    </HStack>
                    <HStack gap={1}>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => handleDismiss(suggestion.artifact_id)}
                        title="Dismiss"
                      >
                        <XMarkIcon style={{ width: 14, height: 14 }} />
                      </Button>
                    </HStack>
                  </HStack>
                  <Box
                    p={3}
                    bg="theme.bgSecondary"
                    borderRadius="md"
                    borderLeftWidth="3px"
                    borderColor="blue.400"
                  >
                    <Text fontSize="sm" color="theme.text">
                      {suggestion.suggested_summary}
                    </Text>
                  </Box>
                </Box>
              ))}
            </VStack>
          )}

          {/* Errors per-artifact */}
          {errorSuggestions.length > 0 && (
            <Box mt={2}>
              <Text fontSize="xs" color="theme.textSecondary" mb={1}>
                {errorSuggestions.length} failed:
              </Text>
              <VStack align="stretch" gap={1}>
                {errorSuggestions.map((s) => (
                  <Text key={s.artifact_id} fontSize="xs" color="red.500">
                    {s.filename}: {s.error}
                  </Text>
                ))}
              </VStack>
            </Box>
          )}

          {/* Skipped */}
          {skipped.length > 0 && (
            <Text fontSize="xs" color="theme.textSecondary" mt={1}>
              {skipped.length} skipped (too short for summarization)
            </Text>
          )}
        </VStack>
      )}

      {/* Empty state */}
      {!data && !isPending && !error && (
        <Box
          p={8}
          borderWidth="1px"
          borderStyle="dashed"
          borderColor="theme.border"
          borderRadius="lg"
          textAlign="center"
        >
          <Text color="theme.textSecondary" fontSize="sm">
            Click &ldquo;Suggest Summaries&rdquo; to generate summaries for documents missing them
          </Text>
        </Box>
      )}
    </VStack>
  );
}

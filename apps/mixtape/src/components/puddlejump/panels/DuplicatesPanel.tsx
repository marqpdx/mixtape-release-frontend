// components/puddlejump/panels/DuplicatesPanel.tsx

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
  Input,
} from '@chakra-ui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCheckDuplicates } from '@mixtape/api/hooks/puddlejump';

interface DuplicatesPanelProps {
  libraryId: string | null;
}

export default function DuplicatesPanel({ libraryId }: DuplicatesPanelProps) {
  const [threshold, setThreshold] = useState(0.85);
  const { mutate, data, isPending, error } = useCheckDuplicates();

  const handleRun = () => {
    if (!libraryId) return;
    mutate({ libraryId, similarityThreshold: threshold });
  };

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" color="theme.text" mb={1}>
          Duplicate Detection
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Find documents with overlapping content using embedding similarity
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
        <VStack align="stretch" gap={4}>
          <HStack gap={4} align="end">
            <Box flex="1">
              <Text fontSize="sm" color="theme.text" fontWeight="medium" mb={1}>
                Similarity threshold
              </Text>
              <Input
                type="number"
                size="sm"
                min={0.5}
                max={0.99}
                step={0.05}
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value) || 0.85)}
              />
              <Text fontSize="xs" color="theme.textSecondary" mt={1}>
                Higher = stricter matching (0.50 - 0.99)
              </Text>
            </Box>
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
                  <MagnifyingGlassIcon style={{ width: 16, height: 16 }} />
                )}
                <span>{isPending ? 'Analyzing...' : 'Run Analysis'}</span>
              </HStack>
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Error */}
      {error && (
        <Box p={4} borderWidth="1px" borderColor="red.300" borderRadius="lg" bg="red.50">
          <Text color="red.600" fontSize="sm">
            Analysis failed: {(error as Error).message}
          </Text>
        </Box>
      )}

      {/* Results */}
      {data && (
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <Text fontWeight="semibold" color="theme.text">
              Results
            </Text>
            <Badge colorPalette={data.pair_count > 0 ? 'yellow' : 'green'}>
              {data.pair_count} pair{data.pair_count !== 1 ? 's' : ''} found
            </Badge>
          </HStack>

          {data.pairs.length === 0 ? (
            <Box
              p={6}
              borderWidth="1px"
              borderColor="green.300"
              borderRadius="lg"
              bg="green.50"
              textAlign="center"
            >
              <Text color="green.800">
                No duplicates found above {data.similarity_threshold} similarity
              </Text>
            </Box>
          ) : (
            data.pairs.map((pair) => (
              <Box
                key={`${pair.source_file_a_id}-${pair.source_file_b_id}`}
                p={4}
                borderWidth="1px"
                borderColor="theme.border"
                borderRadius="lg"
                bg="theme.surface"
              >
                <HStack justify="space-between" mb={3}>
                  <Badge
                    colorPalette={pair.similarity_score >= 0.95 ? 'red' : 'yellow'}
                    size="sm"
                  >
                    {(pair.similarity_score * 100).toFixed(1)}% similar
                  </Badge>
                </HStack>
                <VStack align="stretch" gap={3}>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" color="theme.text" mb={1}>
                      {pair.filename_a}
                    </Text>
                    {pair.excerpt_a && (
                      <Text fontSize="xs" color="theme.textSecondary" lineClamp={2}>
                        {pair.excerpt_a}
                      </Text>
                    )}
                  </Box>
                  <Box borderTopWidth="1px" borderColor="theme.border" pt={3}>
                    <Text fontSize="sm" fontWeight="medium" color="theme.text" mb={1}>
                      {pair.filename_b}
                    </Text>
                    {pair.excerpt_b && (
                      <Text fontSize="xs" color="theme.textSecondary" lineClamp={2}>
                        {pair.excerpt_b}
                      </Text>
                    )}
                  </Box>
                </VStack>
              </Box>
            ))
          )}
        </VStack>
      )}

      {/* Empty state before first run */}
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
            Click &ldquo;Run Analysis&rdquo; to scan for duplicate content
          </Text>
        </Box>
      )}
    </VStack>
  );
}

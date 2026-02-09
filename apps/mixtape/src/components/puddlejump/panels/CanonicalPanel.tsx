// components/puddlejump/panels/CanonicalPanel.tsx

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
import { StarIcon } from '@heroicons/react/24/outline';
import { useSuggestCanonical } from '@mixtape/api/hooks/stackroom';

interface CanonicalPanelProps {
  libraryId: string | null;
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 70 ? 'green.400' :
    pct >= 40 ? 'yellow.400' :
    'gray.300';

  return (
    <HStack gap={2} minW="120px">
      <Box flex="1" h="6px" bg="theme.border" borderRadius="full" overflow="hidden">
        <Box h="100%" w={`${pct}%`} bg={color} borderRadius="full" />
      </Box>
      <Text fontSize="xs" color="theme.textSecondary" minW="32px" textAlign="right">
        {pct}%
      </Text>
    </HStack>
  );
}

export default function CanonicalPanel({ libraryId }: CanonicalPanelProps) {
  const [topN, setTopN] = useState(10);
  const [excludeCanonical, setExcludeCanonical] = useState(false);
  const { mutate, data, isPending, error } = useSuggestCanonical();

  const handleRun = () => {
    if (!libraryId) return;
    mutate({
      libraryId,
      topN,
      excludeAlreadyCanonical: excludeCanonical,
    });
  };

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" color="theme.text" mb={1}>
          Canonical Candidates
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Identify authoritative files based on references, structure, and centrality
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
            <Box>
              <Text fontSize="sm" color="theme.text" fontWeight="medium" mb={1}>
                Top N
              </Text>
              <Input
                type="number"
                size="sm"
                min={1}
                max={50}
                value={topN}
                onChange={(e) => setTopN(parseInt(e.target.value) || 10)}
                w="80px"
              />
            </Box>
            <Box>
              <label>
                <HStack gap={2} cursor="pointer" pb={1}>
                  <input
                    type="checkbox"
                    checked={excludeCanonical}
                    onChange={(e) => setExcludeCanonical(e.target.checked)}
                  />
                  <Text fontSize="sm" color="theme.text">
                    Exclude already canonical
                  </Text>
                </HStack>
              </label>
            </Box>
            <Box flex="1" />
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
                  <StarIcon style={{ width: 16, height: 16 }} />
                )}
                <span>{isPending ? 'Analyzing...' : 'Find Candidates'}</span>
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
              Candidates
            </Text>
            <Badge colorPalette="blue">
              {data.candidate_count} ranked
            </Badge>
          </HStack>

          {data.candidates.length === 0 ? (
            <Box
              p={6}
              borderWidth="1px"
              borderColor="theme.border"
              borderRadius="lg"
              textAlign="center"
            >
              <Text color="theme.textSecondary">No candidates found</Text>
            </Box>
          ) : (
            <VStack align="stretch" gap={2}>
              {data.candidates.map((candidate, i) => (
                <Box
                  key={candidate.source_file_id}
                  p={4}
                  borderWidth="1px"
                  borderColor="theme.border"
                  borderRadius="lg"
                  bg="theme.surface"
                >
                  <HStack justify="space-between" mb={2}>
                    <HStack gap={2}>
                      <Text
                        fontSize="xs"
                        color="theme.textSecondary"
                        fontWeight="bold"
                        minW="20px"
                      >
                        #{i + 1}
                      </Text>
                      <Text fontWeight="medium" color="theme.text" fontSize="sm">
                        {candidate.filename}
                      </Text>
                      {candidate.is_canonical && (
                        <Badge size="sm" colorPalette="green">
                          canonical
                        </Badge>
                      )}
                    </HStack>
                    <ScoreBar score={candidate.score} />
                  </HStack>
                  <VStack align="stretch" gap={1} pl={7}>
                    {candidate.reasons.map((reason, ri) => (
                      <Text key={ri} fontSize="xs" color="theme.textSecondary">
                        {reason}
                      </Text>
                    ))}
                  </VStack>
                </Box>
              ))}
            </VStack>
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
            Click &ldquo;Find Candidates&rdquo; to identify authoritative documents
          </Text>
        </Box>
      )}
    </VStack>
  );
}

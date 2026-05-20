// components/puddlejump/panels/GlossaryPanel.tsx

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
import { BookOpenIcon } from '@heroicons/react/24/outline';
import { useExtractGlossary } from '@mixtape/api/hooks/puddlejump';

interface GlossaryPanelProps {
  libraryId: string | null;
}

export default function GlossaryPanel({ libraryId }: GlossaryPanelProps) {
  const [minOccurrences, setMinOccurrences] = useState(1);
  const [sortBy, setSortBy] = useState<'occurrences' | 'term'>('occurrences');
  const { mutate, data, isPending, error } = useExtractGlossary();

  const handleRun = () => {
    if (!libraryId) return;
    mutate({ libraryId, minOccurrences });
  };

  const sortedTerms = data?.terms
    ? [...data.terms].sort((a, b) => {
        if (sortBy === 'term') return a.term.localeCompare(b.term);
        return b.occurrences - a.occurrences || a.term.localeCompare(b.term);
      })
    : [];

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" color="theme.text" mb={1}>
          Glossary Extraction
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Extract defined terms from bold-definition patterns and TF-IDF keywords
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
        <HStack gap={4} align="end">
          <Box flex="1">
            <Text fontSize="sm" color="theme.text" fontWeight="medium" mb={1}>
              Min occurrences
            </Text>
            <Input
              type="number"
              size="sm"
              min={1}
              max={50}
              value={minOccurrences}
              onChange={(e) => setMinOccurrences(parseInt(e.target.value) || 1)}
            />
            <Text fontSize="xs" color="theme.textSecondary" mt={1}>
              Only show terms appearing in at least this many places
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
                <BookOpenIcon style={{ width: 16, height: 16 }} />
              )}
              <span>{isPending ? 'Extracting...' : 'Extract Glossary'}</span>
            </HStack>
          </Button>
        </HStack>
      </Box>

      {/* Error */}
      {error && (
        <Box p={4} borderWidth="1px" borderColor="red.300" borderRadius="lg" bg="red.50">
          <Text color="red.600" fontSize="sm">
            Extraction failed: {(error as Error).message}
          </Text>
        </Box>
      )}

      {/* Results */}
      {data && (
        <VStack align="stretch" gap={3}>
          <HStack justify="space-between">
            <HStack gap={3}>
              <Text fontWeight="semibold" color="theme.text">
                Terms
              </Text>
              <Badge colorPalette="blue">
                {data.term_count} found
              </Badge>
            </HStack>
            <HStack gap={2}>
              <Text fontSize="xs" color="theme.textSecondary">Sort:</Text>
              <Button
                size="xs"
                variant={sortBy === 'occurrences' ? 'solid' : 'ghost'}
                onClick={() => setSortBy('occurrences')}
              >
                Frequency
              </Button>
              <Button
                size="xs"
                variant={sortBy === 'term' ? 'solid' : 'ghost'}
                onClick={() => setSortBy('term')}
              >
                A-Z
              </Button>
            </HStack>
          </HStack>

          {sortedTerms.length === 0 ? (
            <Box
              p={6}
              borderWidth="1px"
              borderColor="theme.border"
              borderRadius="lg"
              textAlign="center"
            >
              <Text color="theme.textSecondary">No terms found matching criteria</Text>
            </Box>
          ) : (
            <VStack align="stretch" gap={2}>
              {sortedTerms.map((term) => (
                <Box
                  key={term.term}
                  p={4}
                  borderWidth="1px"
                  borderColor="theme.border"
                  borderRadius="lg"
                  bg="theme.surface"
                >
                  <HStack justify="space-between" mb={term.definition ? 2 : 0}>
                    <Text fontWeight="semibold" color="theme.text" fontSize="sm">
                      {term.term}
                    </Text>
                    <HStack gap={2}>
                      <Badge size="sm" variant="subtle">
                        {term.occurrences}x
                      </Badge>
                      <Badge size="sm" variant="subtle" colorPalette="blue">
                        {term.source_files.length} file{term.source_files.length !== 1 ? 's' : ''}
                      </Badge>
                    </HStack>
                  </HStack>
                  {term.definition && (
                    <Text fontSize="sm" color="theme.textSecondary" mb={2}>
                      {term.definition}
                    </Text>
                  )}
                  <HStack gap={1} flexWrap="wrap">
                    {term.source_files.map((sf) => (
                      <Badge key={sf.source_file_id} size="sm" variant="outline">
                        {sf.filename}
                      </Badge>
                    ))}
                  </HStack>
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
            Click &ldquo;Extract Glossary&rdquo; to pull defined terms from your library
          </Text>
        </Box>
      )}
    </VStack>
  );
}

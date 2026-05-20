// components/puddlejump/panels/RestructurePanel.tsx

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
import { RectangleGroupIcon } from '@heroicons/react/24/outline';
import { useRestructureDocuments } from '@mixtape/api/hooks/puddlejump';

interface RestructurePanelProps {
  libraryId: string | null;
}

export default function RestructurePanel({ libraryId }: RestructurePanelProps) {
  const [threshold, setThreshold] = useState(0.6);
  const { mutate, data, isPending, error } = useRestructureDocuments();

  const handleRun = () => {
    if (!libraryId) return;
    mutate({ libraryId, similarityThreshold: threshold });
  };

  return (
    <VStack gap={6} align="stretch">
      <Box>
        <Heading size="lg" color="theme.text" mb={1}>
          Restructure &amp; Consolidate
        </Heading>
        <Text color="theme.textSecondary" fontSize="sm">
          Cluster related documents and suggest consolidation outlines
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
              Similarity threshold
            </Text>
            <Input
              type="number"
              size="sm"
              min={0.3}
              max={0.95}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value) || 0.6)}
            />
            <Text fontSize="xs" color="theme.textSecondary" mt={1}>
              Lower = more clusters, higher = stricter grouping (0.30 - 0.95)
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
                <RectangleGroupIcon style={{ width: 16, height: 16 }} />
              )}
              <span>{isPending ? 'Analyzing...' : 'Analyze Structure'}</span>
            </HStack>
          </Button>
        </HStack>
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
              Clusters
            </Text>
            <Badge colorPalette={data.cluster_count > 0 ? 'blue' : 'green'}>
              {data.cluster_count} cluster{data.cluster_count !== 1 ? 's' : ''} found
            </Badge>
          </HStack>

          {data.clusters.length === 0 ? (
            <Box
              p={6}
              borderWidth="1px"
              borderColor="green.300"
              borderRadius="lg"
              bg="green.50"
              textAlign="center"
            >
              <Text color="green.800">
                No document clusters found above {data.similarity_threshold} similarity
              </Text>
            </Box>
          ) : (
            <VStack align="stretch" gap={4}>
              {data.clusters.map((cluster) => (
                <Box
                  key={cluster.cluster_id}
                  p={4}
                  borderWidth="1px"
                  borderColor="theme.border"
                  borderRadius="lg"
                  bg="theme.surface"
                >
                  {/* Cluster header */}
                  <HStack justify="space-between" mb={3}>
                    <HStack gap={2}>
                      <Badge colorPalette="blue" size="sm">
                        Cluster {cluster.cluster_id + 1}
                      </Badge>
                      <Text fontSize="sm" color="theme.textSecondary">
                        {cluster.document_count} documents
                      </Text>
                    </HStack>
                    <Badge
                      colorPalette={cluster.similarity_avg >= 0.8 ? 'red' : 'yellow'}
                      size="sm"
                    >
                      {(cluster.similarity_avg * 100).toFixed(1)}% avg similarity
                    </Badge>
                  </HStack>

                  {/* Documents in cluster */}
                  <VStack align="stretch" gap={2} mb={cluster.outline ? 3 : 0}>
                    {cluster.documents.map((doc) => (
                      <Box
                        key={doc.source_file_id}
                        px={3}
                        py={2}
                        bg="theme.bgSecondary"
                        borderRadius="md"
                      >
                        <Text fontSize="sm" fontWeight="medium" color="theme.text">
                          {doc.filename}
                        </Text>
                        {doc.excerpt && (
                          <Text fontSize="xs" color="theme.textSecondary" lineClamp={1}>
                            {doc.excerpt}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>

                  {/* Outline */}
                  {cluster.outline && (
                    <Box
                      p={3}
                      bg="theme.bgSecondary"
                      borderRadius="md"
                      borderLeftWidth="3px"
                      borderColor="purple.400"
                    >
                      <Text fontSize="xs" fontWeight="medium" color="theme.textSecondary" mb={1}>
                        Suggested outline
                      </Text>
                      <Text fontSize="sm" color="theme.text" whiteSpace="pre-wrap">
                        {cluster.outline}
                      </Text>
                    </Box>
                  )}
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
            Click &ldquo;Analyze Structure&rdquo; to find related document clusters
          </Text>
        </Box>
      )}
    </VStack>
  );
}

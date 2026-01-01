// apps/mixtape/src/components/stackroom/ActivityTab.tsx
'use client';

import { useState, useEffect } from 'react';
import { Box, VStack, HStack, Heading, Text, Spinner, Code, Card, Table, IconButton } from '@chakra-ui/react';
import { fetchLibraryActivity } from '@mixtape/api/clients/stackroom/stackroomApi';
import { LuRefreshCw } from 'react-icons/lu';

interface ActivityTabProps {
  libraryId: string;
}

export function ActivityTab({ libraryId }: ActivityTabProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadActivity();
  }, [libraryId]);

  const loadActivity = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const activityData = await fetchLibraryActivity(libraryId);
      setData(activityData);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadActivity(true);
  };

  if (loading) {
    return (
      <VStack py={12} gap={4}>
        <Spinner size="lg" />
        <Text color="gray.600">Loading activity data...</Text>
      </VStack>
    );
  }

  if (error) {
    return (
      <Box p={6} borderWidth="1px" borderRadius="md" borderColor="red.300" bg="red.50">
        <Text color="red.700" fontWeight="medium">Error loading activity</Text>
        <Text color="red.600" fontSize="sm" mt={2}>{error}</Text>
      </Box>
    );
  }

  if (!data) {
    return <Text>No data</Text>;
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header with Refresh Button */}
      <HStack justify="space-between" align="center">
        <Heading size="md">Library Activity</Heading>
        <IconButton
          aria-label="Refresh activity data"
          size="sm"
          variant="ghost"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <Box
            as={LuRefreshCw}
            style={{
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </IconButton>
      </HStack>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Library Stats */}
      <Card.Root>
        <Card.Header>
          <Heading size="md">Library Statistics</Heading>
        </Card.Header>
        <Card.Body>
          <VStack align="stretch" gap={2} fontSize="sm">
            <HStack justify="space-between">
              <Text fontWeight="medium">Library:</Text>
              <Text>{data.library_stats.library_name}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontWeight="medium">Files:</Text>
              <Text>{data.library_stats.files_count}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontWeight="medium">Artifacts:</Text>
              <Text>{data.library_stats.artifacts_count}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontWeight="medium">Chunks:</Text>
              <Text>{data.library_stats.chunks_count}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontWeight="medium">Embeddings:</Text>
              <Text>{data.library_stats.embeddings_count}
                ({data.library_stats.embeddings_complete} complete, {data.library_stats.embeddings_pending} pending, {data.library_stats.embeddings_failed} failed)
              </Text>
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Chunk Type Distribution */}
      <Card.Root>
        <Card.Header>
          <Heading size="md">Chunk Type Distribution</Heading>
        </Card.Header>
        <Card.Body>
          <VStack align="stretch" gap={2} fontSize="sm">
            {Object.entries(data.chunk_type_distribution).map(([type, count]) => (
              <HStack key={type} justify="space-between">
                <Text fontWeight="medium">{type}:</Text>
                <Text>{String(count)}</Text>
              </HStack>
            ))}
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Embedding Models */}
      {data.embedding_models && data.embedding_models.length > 0 && (
        <Card.Root>
          <Card.Header>
            <Heading size="md">Embedding Models Used</Heading>
          </Card.Header>
          <Card.Body>
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Model</Table.ColumnHeader>
                  <Table.ColumnHeader>Version</Table.ColumnHeader>
                  <Table.ColumnHeader>Dimensions</Table.ColumnHeader>
                  <Table.ColumnHeader>Count</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.embedding_models.map((model: any, idx: number) => (
                  <Table.Row key={idx}>
                    <Table.Cell><Code fontSize="xs">{model.name}</Code></Table.Cell>
                    <Table.Cell>{model.version}</Table.Cell>
                    <Table.Cell>{model.dimensions}</Table.Cell>
                    <Table.Cell>{model.embedding_count}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card.Body>
        </Card.Root>
      )}

      {/* Recent Ingestion Runs */}
      {data.ingestion_runs && data.ingestion_runs.length > 0 && (
        <Card.Root>
          <Card.Header>
            <Heading size="md">Recent Ingestion Runs</Heading>
          </Card.Header>
          <Card.Body>
            <Table.Root size="sm" variant="outline">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>File</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Artifacts</Table.ColumnHeader>
                  <Table.ColumnHeader>Started</Table.ColumnHeader>
                  <Table.ColumnHeader>Finished</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.ingestion_runs.map((run: any) => (
                  <Table.Row key={run.id}>
                    <Table.Cell>{run.filename}</Table.Cell>
                    <Table.Cell>
                      <Text
                        fontSize="xs"
                        fontWeight="medium"
                        color={
                          run.status === 'success' ? 'green.600' :
                          run.status === 'failed' ? 'red.600' :
                          run.status === 'running' ? 'blue.600' :
                          'gray.600'
                        }
                      >
                        {run.status}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>{run.artifact_count}</Table.Cell>
                    <Table.Cell fontSize="xs">
                      {new Date(run.created_at).toLocaleString()}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {run.finished_at ? new Date(run.finished_at).toLocaleString() : '-'}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card.Body>
        </Card.Root>
      )}

      {/* Sample Chunks */}
      {data.sample_chunks && data.sample_chunks.length > 0 && (
        <Card.Root>
          <Card.Header>
            <Heading size="md">Sample Chunks (first 5 from each file)</Heading>
          </Card.Header>
          <Card.Body>
            <VStack align="stretch" gap={4}>
              {data.sample_chunks.map((chunk: any) => (
                <Box key={chunk.chunk_id} p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
                  <HStack gap={2} mb={2} fontSize="xs" color="gray.600">
                    <Text fontWeight="medium">{chunk.filename}</Text>
                    <Text>•</Text>
                    <Text>Type: <Code fontSize="xs">{chunk.chunk_type}</Code></Text>
                    <Text>•</Text>
                    <Text>Index: {chunk.order_index}</Text>
                    <Text>•</Text>
                    <Text>Tokens: {chunk.token_estimate}</Text>
                    <Text>•</Text>
                    <Text>{chunk.has_embedding ? '✅ Embedded' : '⏳ No embedding'}</Text>
                  </HStack>
                  <Text fontSize="sm" fontFamily="mono" whiteSpace="pre-wrap">
                    {chunk.text_preview}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* Qdrant Status */}
      {data.qdrant_status && (
        <Card.Root>
          <Card.Header>
            <Heading size="md">Qdrant Status</Heading>
          </Card.Header>
          <Card.Body>
            <VStack align="stretch" gap={3}>
              <HStack>
                <Text fontWeight="medium">Available:</Text>
                <Text>{data.qdrant_status.available ? '✅ Yes' : '❌ No'}</Text>
              </HStack>
              {data.qdrant_status.collections && data.qdrant_status.collections.length > 0 && (
                <Box>
                  <Text fontWeight="medium" mb={2}>Collections:</Text>
                  <VStack align="stretch" gap={2}>
                    {data.qdrant_status.collections.map((col: any) => (
                      <Box key={col.name} p={2} borderWidth="1px" borderRadius="md" fontSize="sm">
                        <Code fontSize="xs" mb={1} display="block">{col.name}</Code>
                        <Text fontSize="xs" color="gray.600">
                          Vectors: {col.vectors_count} | Points: {col.points_count}
                        </Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* Raw JSON (for debugging) */}
      <Card.Root>
        <Card.Header>
          <Heading size="md">Raw JSON Data</Heading>
        </Card.Header>
        <Card.Body>
          <Code
            display="block"
            p={4}
            borderRadius="md"
            fontSize="xs"
            whiteSpace="pre-wrap"
            maxH="400px"
            overflowY="auto"
          >
            {JSON.stringify(data, null, 2)}
          </Code>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}

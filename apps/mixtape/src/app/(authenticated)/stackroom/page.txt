// apps/mixtape/src/app/(authenticated)/stackroom/page.tsx

'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Container, VStack, Heading, Text, Box, HStack, Tabs } from '@chakra-ui/react';
import { Select, createListCollection } from '@chakra-ui/react';
import { SearchInput } from '@/components/stackroom/SearchInput';
import { ResultsList } from '@/components/stackroom/ResultsList';
import { FileUpload } from '@/components/stackroom/FileUpload';
import { ActivityTab } from '@/components/stackroom/ActivityTab';
import { useSearchLibrary, useLibraries } from '@mixtape/api';
import { getDefaultEmbeddingModel } from '@mixtape/api/clients/stackroom/stackroomApi';
import type { ChunkResult } from '@mixtape/core/types/stackroomTypes';
import { toaster } from '@/components/ui/toaster';

export default function StackroomSearchPage() {
  const router = useRouter();
  // const toast = useToast();
  const [query, setQuery] = useState('');
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>('');
  const [pinnedChunks, setPinnedChunks] = useState<Set<string>>(new Set());

  // Fetch available libraries
  const { libraries, isLoading: librariesLoading } = useLibraries();

  // Create collection for Select component
  const librariesCollection = useMemo(() =>
    createListCollection({
      items: libraries.map(lib => ({
        label: lib.name,
        value: lib.id,
      })),
    }),
    [libraries]
  );

  // Search hook
  const {
    results,
    isSearching,
    error,
    search,
    clear,
    timing,
  } = useSearchLibrary();

  // Auto-select first library when loaded
  useEffect(() => {
    if (libraries.length > 0 && !selectedLibraryId) {
      setSelectedLibraryId(libraries[0].id);
    }
  }, [libraries, selectedLibraryId]);

  // Handle search
  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!selectedLibraryId) {
        return;
      }

      const defaultModel = getDefaultEmbeddingModel();

      await search({
        query: searchQuery,
        library_id: selectedLibraryId,
        model_name: defaultModel.name,
        model_version: defaultModel.version,
        limit: 20,
      });
    },
    [selectedLibraryId, search]
  );

  // Handle query change
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    if (!newQuery) {
      clear();
    }
  }, [clear]);

  // Handle opening result in viewer
  const handleOpenViewer = useCallback((result: ChunkResult) => {
    // Encode chunk data as URL parameter
    const chunkData = encodeURIComponent(JSON.stringify(result));
    router.push(`/stackroom/document/${result.artifact_id}?chunk=${chunkData}`);
  }, [router]);

  // Handle toggle pin
  const handleTogglePin = useCallback((chunkId: string) => {
    setPinnedChunks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chunkId)) {
        newSet.delete(chunkId);
      } else {
        newSet.add(chunkId);
      }
      return newSet;
    });
  }, []);

  // Handle retry
  const handleRetry = useCallback(() => {
    if (query) {
      handleSearch(query);
    }
  }, [query, handleSearch]);

  return (
    <Container maxWidth="1200px" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" mb={2}>
            Stackroom
          </Heading>
          <Text color="gray.600">
            Upload, index, and search your document library
          </Text>
        </Box>

        {/* Tabs */}
        <Tabs.Root defaultValue="search">
          <Tabs.List>
            <Tabs.Trigger value="upload">Upload & Ingest</Tabs.Trigger>
            <Tabs.Trigger value="search">Search Library</Tabs.Trigger>
            <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
          </Tabs.List>

          {/* Upload Tab */}
          <Tabs.Content value="upload" py={6}>
            <VStack gap={6} align="stretch">
              {/* Library Selector for Upload */}
              <Box>
                <Select.Root
                  collection={librariesCollection}
                  value={selectedLibraryId ? [selectedLibraryId] : []}
                  onValueChange={(details) => {
                    const newValue = details.value[0];
                    if (newValue) {
                      setSelectedLibraryId(newValue);
                    }
                  }}
                  disabled={librariesLoading || libraries.length === 0}
                  size="lg"
                >
                  <Select.Label fontSize="sm" fontWeight="medium" mb={2}>
                    Upload to Library
                  </Select.Label>
                  <Select.Control>
                    <Select.Trigger>
                      <Select.ValueText placeholder="Select a library" />
                      <Select.Indicator />
                    </Select.Trigger>
                  </Select.Control>
                  <Select.Positioner>
                    <Select.Content>
                      {librariesCollection.items.map((library) => (
                        <Select.Item key={library.value} item={library}>
                          <Select.ItemText>{library.label}</Select.ItemText>
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Select.Root>
                {libraries.length === 0 && !librariesLoading && (
                  <Text fontSize="sm" color="red.500" mt={2}>
                    No libraries available. Please create a library first.
                  </Text>
                )}
              </Box>

              {/* File Upload Component */}
              {selectedLibraryId && (
                <FileUpload
                  libraryId={selectedLibraryId}
                  onUploadComplete={(fileId) => {
                    void fileId;
                    toaster.create({
                      title: 'Upload complete',
                      description: 'File uploaded successfully and is being processed',
                      type: 'success',
                      duration: 3000,
                    });
                  }}
                  onUploadError={(error) => {
                    toaster.create({
                      title: 'Upload failed',
                      description: error,
                      type: 'error',
                      duration: 5000,
                    });
                  }}
                />
              )}

              {!selectedLibraryId && !librariesLoading && libraries.length > 0 && (
                <Box
                  p={8}
                  borderWidth="1px"
                  borderRadius="md"
                  borderStyle="dashed"
                  bg="gray.50"
                  textAlign="center"
                >
                  <Text color="gray.600">
                    Please select a library to upload files
                  </Text>
                </Box>
              )}
            </VStack>
          </Tabs.Content>

          {/* Search Tab */}
          <Tabs.Content value="search" py={6}>
            <VStack gap={6} align="stretch">
              {/* Library Selector */}
              <Box>
          <Select.Root
            collection={librariesCollection}
            value={selectedLibraryId ? [selectedLibraryId] : []}
            onValueChange={(details) => {
              const newValue = details.value[0];
              if (newValue) {
                setSelectedLibraryId(newValue);
                if (query) {
                  handleSearch(query);
                }
              }
            }}
            disabled={librariesLoading || libraries.length === 0}
            size="lg"
          >
            <Select.Label fontSize="sm" fontWeight="medium" mb={2}>
              Library
            </Select.Label>
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Select a library" />
                <Select.Indicator />
              </Select.Trigger>
            </Select.Control>
            <Select.Positioner>
              <Select.Content>
                {librariesCollection.items.map((library) => (
                  <Select.Item key={library.value} item={library}>
                    <Select.ItemText>{library.label}</Select.ItemText>
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Select.Root>
          {libraries.length === 0 && !librariesLoading && (
            <Text fontSize="sm" color="red.500" mt={2}>
              No libraries available. Please create a library first.
            </Text>
          )}
        </Box>

        {/* Search Input */}
        <SearchInput
          value={query}
          onChange={handleQueryChange}
          onSearch={handleSearch}
          placeholder="Search for content..."
          disabled={!selectedLibraryId}
        />

        {/* Performance Metrics (if available) */}
        {timing && (
          <HStack
            fontSize="xs"
            color="gray.500"
            justify="flex-end"
            gap={4}
            px={1}
          >
            <Text>Embed: {timing.embed_ms}ms</Text>
            <Text>Search: {timing.qdrant_ms}ms</Text>
            <Text>Resolve: {timing.resolve_ms}ms</Text>
            <Text fontWeight="medium">Total: {timing.total_ms}ms</Text>
          </HStack>
        )}

              {/* Results List */}
              <ResultsList
                results={results}
                isLoading={isSearching}
                error={error}
                query={query}
                onRetry={handleRetry}
                onOpenViewer={handleOpenViewer}
                onTogglePin={handleTogglePin}
                pinnedChunks={pinnedChunks}
              />
            </VStack>
          </Tabs.Content>

          {/* Activity Tab */}
          <Tabs.Content value="activity" py={6}>
            {selectedLibraryId ? (
              <ActivityTab libraryId={selectedLibraryId} />
            ) : (
              <Box
                p={8}
                borderWidth="1px"
                borderRadius="md"
                borderStyle="dashed"
                bg="gray.50"
                textAlign="center"
              >
                <Text color="gray.600">
                  Please select a library to view activity
                </Text>
              </Box>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </VStack>
    </Container>
  );
}

// Available Files List - Shows SourceFiles that can be added to Collection

'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  Text,
  Badge,
  HStack,
  VStack,
  IconButton,
  Input,
  Spinner,
  EmptyState,
  Stack,
} from '@chakra-ui/react';
import {
  IconFile,
  IconPlus,
  IconCheck,
} from '@tabler/icons-react';
import type { SourceFileMinimal } from '@mixtape/core/types/collectionTypes';
import { formatBytes } from '@/lib/formatBytes';
import { formatDistanceToNow } from 'date-fns';

interface AvailableFilesListProps {
  files: SourceFileMinimal[];
  onAddFile: (fileId: string) => void;
  isLoading?: boolean;
}

export function AvailableFilesList({
  files,
  onAddFile,
  isLoading = false,
}: AvailableFilesListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter files by search query
  const filteredFiles = files.filter((file) =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="lg" />
        <Text mt={4} color="gray.600">
          Loading files...
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      {/* Search */}
      <Input
        placeholder="Search files..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        size="md"
      />

      {/* File List */}
      {filteredFiles.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <Box color="gray.400" mb={4}>
              <IconFile size={48} />
            </Box>
            <EmptyState.Title>No files found</EmptyState.Title>
            <EmptyState.Description>
              {searchQuery
                ? `No files match "${searchQuery}"`
                : 'No files available in this library'}
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <Stack gap={2}>
          {filteredFiles.map((file) => (
            <Card.Root key={file.id} size="sm">
              <Card.Body>
                <HStack justify="space-between" align="start">
                  <HStack gap={3} flex={1}>
                    <Box color="gray.500" flexShrink={0}>
                      <IconFile size={24} />
                    </Box>
                    <VStack align="start" gap={1} flex={1}>
                      <Text fontWeight="medium" fontSize="sm">
                        {file.filename}
                      </Text>
                      <HStack gap={2} fontSize="xs" color="gray.600">
                        <Badge colorPalette="gray" size="xs">
                          {formatBytes(file.size_bytes)}
                        </Badge>
                        <Badge colorPalette="blue" size="xs">
                          {file.origin}
                        </Badge>
                        <Text>
                          {formatDistanceToNow(new Date(file.created_at), {
                            addSuffix: true,
                          })}
                        </Text>
                      </HStack>
                    </VStack>
                  </HStack>

                  {/* Add/Status Button */}
                  {file.in_collection ? (
                    <HStack gap={1}>
                      <Badge colorPalette="green" size="sm">
                        <IconCheck size={12} />
                        Added ({file.item_count})
                      </Badge>
                      <IconButton
                        aria-label="Add another instance"
                        size="sm"
                        variant="ghost"
                        onClick={() => onAddFile(file.id)}
                      >
                        <IconPlus size={20} />
                      </IconButton>
                    </HStack>
                  ) : (
                    <IconButton
                      aria-label="Add to collection"
                      size="sm"
                      variant="solid"
                      colorPalette="blue"
                      onClick={() => onAddFile(file.id)}
                    >
                      <IconPlus size={20} />
                    </IconButton>
                  )}
                </HStack>
              </Card.Body>
            </Card.Root>
          ))}
        </Stack>
      )}
    </VStack>
  );
}

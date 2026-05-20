// Available Documents List - Shows WritingPieces that can be added to Collection

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
  Select,
} from '@chakra-ui/react';
import {
  PlusIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import type { WritingPieceMinimal } from '@mixtape/core/types/collectionTypes';
import { getWritingKindInfo } from './utils/writingKindHelpers';
import { formatDistanceToNow } from 'date-fns';
import { createListCollection } from '@chakra-ui/react';

interface AvailableDocumentsListProps {
  documents: WritingPieceMinimal[];
  onAddDocument: (documentId: string, docType: 'writing_piece' | 'dispatch_post') => void;
  isLoading?: boolean;
}

const KIND_FILTERS = createListCollection({
  items: [
    { value: 'all', label: 'All Types' },
    { value: 'dispatch', label: '📝 Collaborative' },
    { value: 'article', label: '📰 Article' },
    { value: 'post', label: '✍️ Post' },
    { value: 'announcement', label: '📢 Announcement' },
    { value: 'page', label: '📄 Page' },
  ],
});

export function AvailableDocumentsList({
  documents,
  onAddDocument,
  isLoading = false,
}: AvailableDocumentsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [kindFilter, setKindFilter] = useState('all');

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.author_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesKind = kindFilter === 'all' || doc.writing_kind === kindFilter;

    return matchesSearch && matchesKind;
  });

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="lg" />
        <Text mt={4} color="gray.600">
          Loading documents...
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      {/* Search and Filter */}
      <HStack gap={3}>
        <Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="md"
          flex={1}
        />
        <Select.Root
          collection={KIND_FILTERS}
          value={[kindFilter]}
          onValueChange={(e) => setKindFilter(e.value[0])}
          size="md"
          width="200px"
        >
          <Select.Trigger>
            <Select.ValueText placeholder="Filter by type" />
          </Select.Trigger>
          <Select.Content>
            {KIND_FILTERS.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </HStack>

      {/* Document List */}
      {filteredDocuments.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Title>No documents found</EmptyState.Title>
            <EmptyState.Description>
              {searchQuery || kindFilter !== 'all'
                ? 'No documents match your filters'
                : 'No published documents available'}
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <Stack gap={2}>
          {filteredDocuments.map((doc) => {
            const kindInfo = getWritingKindInfo(doc.writing_kind);
            const KindIcon = kindInfo.icon;

            return (
              <Card.Root key={doc.id} size="sm">
                <Card.Body>
                  <HStack justify="space-between" align="start">
                    <HStack gap={3} flex={1}>
                      <KindIcon className="h-6 w-6 text-gray-500 flex-shrink-0" />
                      <VStack align="start" gap={1} flex={1}>
                        <Text fontWeight="medium" fontSize="sm">
                          {doc.title}
                        </Text>
                        {doc.summary && (
                          <Text fontSize="xs" color="gray.600" lineClamp={2}>
                            {doc.summary}
                          </Text>
                        )}
                        <HStack gap={2} fontSize="xs" color="gray.600" flexWrap="wrap">
                          <Badge colorPalette={kindInfo.colorScheme} size="xs">
                            {kindInfo.emoji} {kindInfo.label}
                          </Badge>
                          {doc.author_name && <Text>by {doc.author_name}</Text>}
                          <Text>
                            {formatDistanceToNow(new Date(doc.published_at), {
                              addSuffix: true,
                            })}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>

                    {/* Add/Status Button */}
                    {doc.in_collection ? (
                      <HStack gap={1}>
                        <Badge colorPalette="green" size="sm">
                          <CheckIcon className="h-3 w-3" />
                          Added ({doc.item_count})
                        </Badge>
                        <IconButton
                          aria-label="Add another instance"
                          size="sm"
                          variant="ghost"
                          onClick={() => onAddDocument(doc.id, doc.doc_type ?? 'writing_piece')}
                        >
                          <PlusIcon className="h-5 w-5" />
                        </IconButton>
                      </HStack>
                    ) : (
                      <IconButton
                        aria-label="Add to collection"
                        size="sm"
                        variant="solid"
                        colorPalette="blue"
                        onClick={() => onAddDocument(doc.id, doc.doc_type ?? 'writing_piece')}
                      >
                        <PlusIcon className="h-5 w-5" />
                      </IconButton>
                    )}
                  </HStack>
                </Card.Body>
              </Card.Root>
            );
          })}
        </Stack>
      )}
    </VStack>
  );
}

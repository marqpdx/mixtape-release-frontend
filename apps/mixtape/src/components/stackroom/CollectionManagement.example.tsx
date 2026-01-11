// Example: Full Collection Management UI
// This demonstrates how to use all Collection components together

'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  HStack,
  VStack,
  Card,
} from '@chakra-ui/react';
import { PlusIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { useCollection } from '@mixtape/api/hooks/stackroom/useCollections';
import { CollectionBrowser } from './CollectionBrowser';
import { CollectionItemsList } from './CollectionItemsList';
import type { LibraryItem } from '@mixtape/core/types/collectionTypes';

interface CollectionManagementProps {
  collectionId: string;
}

/**
 * Full Collection Management UI
 *
 * This component demonstrates the complete workflow:
 * 1. View Collection details and stats
 * 2. Browse and add Files (SourceFiles)
 * 3. Browse and add Documents (WritingPieces)
 * 4. View and manage items in the Collection
 * 5. Type-specific rendering for different content types
 *
 * Usage:
 * ```tsx
 * <CollectionManagement collectionId={collection.id} />
 * ```
 */
export function CollectionManagement({ collectionId }: CollectionManagementProps) {
  const { collection, isLoading } = useCollection(collectionId);
  const [activeTab, setActiveTab] = useState<'items' | 'add'>('items');

  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text>Loading collection...</Text>
      </Container>
    );
  }

  if (!collection) {
    return (
      <Container maxW="container.lg" py={8}>
        <Text color="red.500">Collection not found</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      {/* Collection Header */}
      <VStack align="stretch" gap={6} mb={8}>
        <Box>
          <Heading size="lg">{collection.title}</Heading>
          {collection.summary && (
            <Text color="gray.600" mt={2}>
              {collection.summary}
            </Text>
          )}
        </Box>

        {/* Stats Card */}
        <Card.Root>
          <Card.Body>
            <HStack gap={8}>
              <VStack align="start">
                <Text fontSize="2xl" fontWeight="bold">
                  {collection.item_count}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Items
                </Text>
              </VStack>
              <VStack align="start">
                <Text fontSize="2xl" fontWeight="bold">
                  {collection.file_count}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Files
                </Text>
              </VStack>
              <VStack align="start">
                <Text fontSize="2xl" fontWeight="bold">
                  {collection.ingestion_status.ready}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Ready
                </Text>
              </VStack>
            </HStack>
          </Card.Body>
        </Card.Root>
      </VStack>

      {/* Tab Navigation */}
      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value as 'items' | 'add')}>
        <Tabs.List>
          <Tabs.Trigger value="items">
            <HStack gap={2}>
              <ListBulletIcon className="h-5 w-5" />
              <Text>Collection Items</Text>
            </HStack>
          </Tabs.Trigger>
          <Tabs.Trigger value="add">
            <HStack gap={2}>
              <PlusIcon className="h-5 w-5" />
              <Text>Add Content</Text>
            </HStack>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Items Tab - Shows current Collection items */}
        <Tabs.Content value="items" py={6}>
          <CollectionItemsList
            collectionId={collectionId}
            onEditItem={(itemId) => {
              console.log('Edit item:', itemId);
              // TODO: Open edit modal
            }}
          />
        </Tabs.Content>

        {/* Add Content Tab - Browse available Files and Documents */}
        <Tabs.Content value="add" py={6}>
          <Box mb={4}>
            <Heading size="md" mb={2}>
              Add to Collection
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Browse available files and documents to add to this collection. Items can be
              added multiple times at different positions.
            </Text>
          </Box>

          {/* CollectionBrowser handles both Files and Documents tabs */}
          <CollectionBrowser
            collectionId={collectionId}
            onItemAdded={() => {
              // Switch back to items tab to show the newly added item
              setActiveTab('items');
            }}
          />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}

/**
 * Example showing how the discriminated union types work:
 */
export function ExampleTypeDiscrimination() {
  // This demonstrates TypeScript's type narrowing with discriminated unions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleItemClick = (item: LibraryItem) => {
    // TypeScript knows the shape based on content_type
    if (item.content_type === 'source_file') {
      // TypeScript knows item.content has SourceFileContent shape
      console.log('File:', item.content.filename);
      console.log('Size:', item.content.size_bytes);
      console.log('Origin:', item.content.origin); // ✅ TypeScript knows this exists
      // console.log('Title:', item.content.title); // ❌ TypeScript error - title doesn't exist on SourceFile
    }

    if (item.content_type === 'writing_piece') {
      // TypeScript knows item.content has WritingPieceContent shape
      console.log('Document:', item.content.title);
      console.log('Kind:', item.content.writing_kind); // ✅ Shows dispatch | article | post | etc.
      console.log('Author:', item.content.author_name);
      // console.log('Size:', item.content.size_bytes); // ❌ TypeScript error - size_bytes doesn't exist on WritingPiece
    }
  };

  return null;
}

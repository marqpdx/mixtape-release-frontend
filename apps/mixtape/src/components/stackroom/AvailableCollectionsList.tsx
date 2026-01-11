// Available Collections List - Browse collections to link/add

'use client';

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Badge,
  Spinner,
  EmptyState,
} from '@chakra-ui/react';
import {
  IconFolder,
  IconLink,
  IconPlus,
  IconFile,
} from '@tabler/icons-react';
import { useCollections } from '@mixtape/api/hooks/stackroom/useCollections';
import type { CollectionListItem } from '@mixtape/core/types/collectionTypes';

interface AvailableCollectionsListProps {
  currentCollectionId: string;
  onLinkCollection?: (collectionId: string) => void;
  onAddAllItems?: (collectionId: string) => void;
  isLoading?: boolean;
}

export function AvailableCollectionsList({
  currentCollectionId,
  onLinkCollection,
  onAddAllItems,
  isLoading: externalLoading = false,
}: AvailableCollectionsListProps) {
  const { collections, isLoading } = useCollections();

  // Filter out the current collection
  const availableCollections = collections.filter(
    (c) => c.id !== currentCollectionId
  );

  if (isLoading || externalLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="lg" />
        <Text mt={4} color="gray.600" fontSize="sm">
          Loading collections...
        </Text>
      </Box>
    );
  }

  if (availableCollections.length === 0) {
    return (
      <EmptyState.Root>
        <EmptyState.Content>
          <Box color="gray.400" mb={4}>
            <IconFolder size={48} />
          </Box>
          <EmptyState.Title>No other collections</EmptyState.Title>
          <EmptyState.Description>
            Create more collections to link them together
          </EmptyState.Description>
        </EmptyState.Content>
      </EmptyState.Root>
    );
  }

  return (
    <VStack align="stretch" gap={3}>
      {availableCollections.map((collection) => (
        <CollectionLinkCard
          key={collection.id}
          collection={collection}
          onLinkCollection={onLinkCollection}
          onAddAllItems={onAddAllItems}
        />
      ))}
    </VStack>
  );
}

interface CollectionLinkCardProps {
  collection: CollectionListItem;
  onLinkCollection?: (collectionId: string) => void;
  onAddAllItems?: (collectionId: string) => void;
}

function CollectionLinkCard({
  collection,
  onLinkCollection,
  onAddAllItems,
}: CollectionLinkCardProps) {
  return (
    <Card.Root size="sm">
      <Card.Body>
        <VStack align="stretch" gap={3}>
          {/* Collection Info */}
          <HStack justify="space-between" align="start">
            <HStack gap={3} flex={1}>
              <Box color="blue.500">
                <IconFolder size={24} />
              </Box>
              <Box flex={1}>
                <Text fontWeight="medium" fontSize="md">
                  {collection.title}
                </Text>
                {collection.summary && (
                  <Text fontSize="sm" color="gray.600" lineClamp={2} mt={1}>
                    {collection.summary}
                  </Text>
                )}
              </Box>
            </HStack>
          </HStack>

          {/* Stats */}
          <HStack gap={4} fontSize="sm" color="gray.600">
            <HStack gap={1}>
              <IconFile size={16} />
              <Text fontWeight="medium">{collection.item_count}</Text>
              <Text>items</Text>
            </HStack>
            <Badge colorPalette="gray" size="sm">
              {collection.sponsor_type}
            </Badge>
          </HStack>

          {/* Actions */}
          <HStack gap={2}>
            {onLinkCollection && (
              <Button
                size="sm"
                variant="outline"
                colorPalette="blue"
                onClick={() => onLinkCollection(collection.id)}
                flex={1}
              >
                <HStack gap={2}>
                  <IconLink size={16} />
                  <Text>Link Collection</Text>
                </HStack>
              </Button>
            )}

            {onAddAllItems && (
              <Button
                size="sm"
                variant="outline"
                colorPalette="gray"
                onClick={() => onAddAllItems(collection.id)}
                flex={1}
              >
                <HStack gap={2}>
                  <IconPlus size={16} />
                  <Text>Copy All Items</Text>
                </HStack>
              </Button>
            )}
          </HStack>

          {/* Info Banner */}
          <Box bg="blue.50" p={2} borderRadius="md" fontSize="xs">
            <HStack gap={2} color="blue.700">
              <IconLink size={14} />
              <Text>
                <strong>Link:</strong> Updates automatically when source changes
              </Text>
            </HStack>
            <HStack gap={2} color="gray.700" mt={1}>
              <IconPlus size={14} />
              <Text>
                <strong>Copy:</strong> Independent items, won't update automatically
              </Text>
            </HStack>
          </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}

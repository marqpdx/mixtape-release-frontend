// Collection Items List - Display and manage items in a Collection

'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Card,
  Select,
  Spinner,
  EmptyState,
  Stack,
  Heading,
  Button,
  Checkbox,
} from '@chakra-ui/react';
import { IconFolder } from '@tabler/icons-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  useCollectionItems,
  useUpdateLibraryItem,
  useDeleteLibraryItem,
  useReorderLibraryItems,
  useCollectionTextSearch,
} from '@mixtape/api/hooks/stackroom/useCollections';
import { CollectionItemCard } from './CollectionItemCard';
import { toaster } from '../ui/toaster';
import { createListCollection } from '@chakra-ui/react';
import type { LibraryItem } from '@mixtape/core/types/collectionTypes';

interface CollectionItemsListProps {
  collectionId: string;
  onEditItem?: (itemId: string) => void;
  onOpenItem?: (item: LibraryItem) => void;
  canReorder?: boolean;
  groupSlug?: string;
  refreshTrigger?: number;
}

type SourceFileLikeContent = {
  filename?: string;
} | null;

const SORT_OPTIONS = createListCollection({
  items: [
    { value: 'order', label: 'Order (default)' },
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'name', label: 'Name (A-Z)' },
  ],
});

export function CollectionItemsList({
  collectionId,
  onEditItem,
  onOpenItem,
  canReorder = false,
  groupSlug,
  refreshTrigger,
}: CollectionItemsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchWithinDocs, setSearchWithinDocs] = useState(false);
  const [sortBy, setSortBy] = useState('order');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const { items, isLoading, refetch } = useCollectionItems(collectionId);
  const { searchResults, isSearching, search, clearSearch } = useCollectionTextSearch(collectionId);
  const updateMutation = useUpdateLibraryItem();
  const deleteMutation = useDeleteLibraryItem();
  const reorderMutation = useReorderLibraryItems();

  const getSourceFileTitle = (item: (typeof items)[number]) => ('title' in item ? item.title : '');

  const getItemDisplayName = (item: (typeof items)[number]) => {
    const isSourceFileLikeItem =
      !item.is_folder && (!item.content_type || item.content_type === 'source_file');

    if (isSourceFileLikeItem) {
      const content = (item as { content?: SourceFileLikeContent }).content ?? null;
      return content?.filename || getSourceFileTitle(item) || 'Untitled file';
    }

    if (item.content_type === 'writing_piece') {
      return item.content.title;
    }

    if (item.content_type === 'collection') {
      return item.content.title;
    }

    if (item.content_type === 'folder') {
      return item.title || 'Untitled';
    }

    if (item.content_type === 'media_capture') {
      return item.content.title || item.title || 'Untitled screencast';
    }

    return 'Untitled';
  };

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // Configure drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (prevents accidental drags)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Find items in the current sorted list
    const oldIndex = sortedItems.findIndex((i) => i.id === active.id);
    const newIndex = sortedItems.findIndex((i) => i.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Calculate new order based on arrayMove
    const reorderedItems = arrayMove(sortedItems, oldIndex, newIndex);

    // Update order_index for all affected items
    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      order_index: index,
      // For now, we don't change parent_id (simple reorder only)
      // Nesting support will be added in next phase
    }));

    try {
      await reorderMutation.mutateAsync({
        collectionId,
        data: { items: updates },
      });

      // Refetch to get updated data from server
      refetch();

      toaster.create({
        title: 'Order updated',
        description: 'Items have been reordered',
        type: 'success',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reorder items';
      toaster.create({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });

      // Refetch to revert optimistic update
      refetch();
    }
  };

  const handleToggleFeatured = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    try {
      await updateMutation.mutateAsync({
        collectionId,
        itemId,
        data: {
          is_featured: !item.is_featured,
        },
      });

      toaster.create({
        title: item.is_featured ? 'Unfeatured' : 'Featured',
        description: item.is_featured
          ? 'Item removed from featured'
          : 'Item marked as featured',
        type: 'success',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update item';
      toaster.create({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!confirm('Remove this item from the collection?')) return;

    try {
      await deleteMutation.mutateAsync({
        collectionId,
        itemId,
      });

      toaster.create({
        title: 'Item removed',
        description: 'Item has been removed from the collection',
        type: 'success',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove item';
      toaster.create({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  // Handle search input changes
  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);

    // If search-within-docs is enabled, trigger backend search
    if (searchWithinDocs && query.trim()) {
      search({ query: query.trim(), limit: 20 });
    } else if (!query.trim()) {
      // Clear search if query is empty
      clearSearch();
    }
  };

  // Handle checkbox toggle
  const handleSearchWithinDocsToggle = (checked: boolean) => {
    setSearchWithinDocs(checked);

    // If enabling and query exists, trigger backend search immediately
    if (checked && searchQuery.trim()) {
      search({ query: searchQuery.trim(), limit: 20 });
    } else if (!checked) {
      // Clear backend search results when disabling
      clearSearch();
    }
  };

  // One-click: Enable checkbox AND search immediately
  const handleSearchInDocumentsClick = () => {
    if (!searchQuery.trim()) return;

    setSearchWithinDocs(true);
    search({ query: searchQuery.trim(), limit: 20 });
  };

  // Filter and sort items (Simple Search - in-memory filtering)
  const filteredItems = !searchWithinDocs
    ? items.filter((item) => {
        if (!searchQuery) return true;

        const searchLower = searchQuery.toLowerCase();
        const isSourceFileLikeItem =
          !item.is_folder && (!item.content_type || item.content_type === 'source_file');

        if (isSourceFileLikeItem) {
          return getItemDisplayName(item).toLowerCase().includes(searchLower);
        }

        if (item.content_type === 'writing_piece') {
          return (
            item.content.title.toLowerCase().includes(searchLower) ||
            item.content.summary.toLowerCase().includes(searchLower)
          );
        }

        if (item.content_type === 'media_capture') {
          return getItemDisplayName(item).toLowerCase().includes(searchLower);
        }

        return false;
      })
    : items; // Don't filter in full-text mode (show all items, results shown separately)

  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'oldest':
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case 'name':
        const aName = getItemDisplayName(a);
        const bName = getItemDisplayName(b);
        return aName.localeCompare(bName);
      case 'order':
      default:
        return a.order_index - b.order_index;
    }
  });

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Recursive tree rendering function
  const renderTreeItems = (parentId: string | null = null, depth: number = 0) => {
    const childItems = sortedItems.filter((item) => item.parent_id === parentId);

    return childItems.map((item) => {
      const isFolder = item.content_type === 'folder';
      const isExpanded = expandedFolders.has(item.id);
      const hasChildren = isFolder && sortedItems.some((i) => i.parent_id === item.id);

      return (
        <Box key={item.id}>
          {/* Item with indentation */}
          <Box ml={depth * 6}>
            <CollectionItemCard
              item={item}
              onEdit={onEditItem}
              onRemove={handleRemove}
              onToggleFeatured={handleToggleFeatured}
              onOpen={onOpenItem}
              onToggleExpand={toggleFolder}
              isExpanded={isExpanded}
              hasChildren={hasChildren}
              canReorder={canReorder}
              groupSlug={groupSlug}
            />
          </Box>

          {/* Render children if folder is expanded */}
          {isFolder && hasChildren && isExpanded && renderTreeItems(item.id, depth + 1)}
        </Box>
      );
    });
  };

  if (isLoading) {
    return (
      <Box p={8} textAlign="center">
        <Spinner size="lg" />
        <Text mt={4} color="gray.600">
          Loading items...
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      {/* Search Input */}
      <VStack align="stretch" gap={2}>
        <HStack gap={3} justify="space-between">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => handleSearchQueryChange(e.target.value)}
            size="md"
            flex={1}
          />
          <Select.Root
            collection={SORT_OPTIONS}
            value={[sortBy]}
            onValueChange={(e) => setSortBy(e.value[0])}
            size="md"
            width="200px"
          >
            <Select.Trigger>
              <Select.ValueText placeholder="Sort by" />
            </Select.Trigger>
            <Select.Content>
              {SORT_OPTIONS.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </HStack>

      {/* Checkbox and One-Click Search Button */}
      <HStack gap={3} justify="space-between">
        <Checkbox.Root
          checked={searchWithinDocs}
          onCheckedChange={(e) => handleSearchWithinDocsToggle(!!e.checked)}
          size="sm"
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Checkbox.Label>
            <Text fontSize="sm" color="gray.700">
              Search within document content
            </Text>
          </Checkbox.Label>
        </Checkbox.Root>

        {/* One-click button: appears when query exists and checkbox is unchecked */}
        {searchQuery.trim() && !searchWithinDocs && (
          <Button
            size="sm"
            variant="solid"
            colorPalette="blue"
            onClick={handleSearchInDocumentsClick}
          >
            Search in documents
          </Button>
        )}
      </HStack>
    </VStack>

      {/* Full-text Search Results */}
      {searchWithinDocs && searchQuery && (
        <Card.Root>
          <Card.Header>
            <Heading size="sm">Search Results</Heading>
          </Card.Header>
          <Card.Body>
            {isSearching ? (
              <Box textAlign="center" py={4}>
                <Spinner size="md" />
                <Text mt={2} fontSize="sm" color="gray.600">
                  Searching documents...
                </Text>
              </Box>
            ) : searchResults && searchResults.results.length > 0 ? (
              <VStack align="stretch" gap={3}>
                {searchResults.results.map((result) => {
                  // Highlight matched terms by bolding them
                  const highlightMatch = (text: string, query: string) => {
                    const parts = text.split(new RegExp(`(${query})`, 'gi'));
                    return parts.map((part, i) =>
                      part.toLowerCase() === query.toLowerCase() ? (
                        <strong key={i}>{part}</strong>
                      ) : (
                        part
                      )
                    );
                  };

                  return (
                    <Card.Root key={result.chunk_id} size="sm">
                      <Card.Body>
                        <VStack align="stretch" gap={2}>
                          <Text fontWeight="medium" fontSize="sm">
                            {result.filename}
                          </Text>
                          <Text fontSize="xs" color="gray.700" lineHeight="1.6">
                            {highlightMatch(result.chunk_text, searchQuery)}
                          </Text>
                        </VStack>
                      </Card.Body>
                    </Card.Root>
                  );
                })}
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  Found {searchResults.total} matches
                </Text>
              </VStack>
            ) : (
              <EmptyState.Root>
                <EmptyState.Content>
                  <EmptyState.Title>No matches</EmptyState.Title>
                  <EmptyState.Description>
                    No items match "{searchQuery}" within document content
                  </EmptyState.Description>
                </EmptyState.Content>
              </EmptyState.Root>
            )}
          </Card.Body>
        </Card.Root>
      )}

      {/* Items List */}
      {sortedItems.length === 0 ? (
        <EmptyState.Root>
          <EmptyState.Content>
            <Box color="gray.400" mb={4}>
              <IconFolder size={48} />
            </Box>
            <EmptyState.Title>
              {searchQuery ? 'No items match your search' : 'No items yet'}
            </EmptyState.Title>
            <EmptyState.Description>
              {searchQuery
                ? `No items match "${searchQuery}"`
                : 'Add files and documents to this collection'}
            </EmptyState.Description>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : canReorder && sortBy === 'order' ? (
        // Drag-and-drop enabled — only for admins/stewards sorting by order
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <Stack gap={3}>{renderTreeItems()}</Stack>
          </SortableContext>
        </DndContext>
      ) : (
        // No drag-and-drop (non-admin or sorting by other criteria)
        <Stack gap={3}>{renderTreeItems()}</Stack>
      )}

      {/* Stats */}
      {sortedItems.length > 0 && (
        <Text fontSize="sm" color="gray.600" textAlign="center">
          Showing {sortedItems.length} of {items.length} items
        </Text>
      )}
    </VStack>
  );
}

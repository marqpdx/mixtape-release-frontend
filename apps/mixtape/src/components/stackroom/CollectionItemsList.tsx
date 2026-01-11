// Collection Items List - Display and manage items in a Collection

'use client';

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Select,
  Spinner,
  EmptyState,
  Stack,
  Button,
} from '@chakra-ui/react';
import { IconFolder, IconFolderPlus } from '@tabler/icons-react';
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
  useCreateLibraryItem,
} from '@mixtape/api/hooks/stackroom/useCollections';
import { CollectionItemCard } from './CollectionItemCard';
import { toaster } from '../ui/toaster';
import { createListCollection } from '@chakra-ui/react';

interface CollectionItemsListProps {
  collectionId: string;
  onEditItem?: (itemId: string) => void;
}

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
}: CollectionItemsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('order');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const { items, isLoading, refetch } = useCollectionItems(collectionId);
  const updateMutation = useUpdateLibraryItem();
  const deleteMutation = useDeleteLibraryItem();
  const reorderMutation = useReorderLibraryItems();
  const createMutation = useCreateLibraryItem();

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

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:', 'New Folder');

    if (!folderName) return;

    try {
      // Note: Backend may need updating to support folder creation
      // Folders don't have content_type/content_id, they use is_folder=true
      // Using type assertion for folder creation which isn't fully supported yet
      await createMutation.mutateAsync({
        collectionId,
        data: {
          content_type: 'folder',
          content_id: '',
          is_folder: true,
          title: folderName,
          order_index: items.length,
        } as unknown as Parameters<typeof createMutation.mutateAsync>[0]['data'],
      });

      toaster.create({
        title: 'Folder created',
        description: `Folder "${folderName}" has been created`,
        type: 'success',
      });

      refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create folder';
      toaster.create({
        title: 'Error',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  // Filter and sort items
  const filteredItems = items.filter((item) => {
    const searchLower = searchQuery.toLowerCase();

    if (item.content_type === 'source_file') {
      return item.content.filename.toLowerCase().includes(searchLower);
    }

    if (item.content_type === 'writing_piece') {
      return (
        item.content.title.toLowerCase().includes(searchLower) ||
        item.content.summary.toLowerCase().includes(searchLower)
      );
    }

    return false;
  });

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
        const aName =
          a.content_type === 'source_file'
            ? a.content.filename
            : a.content_type === 'writing_piece'
            ? a.content.title
            : a.content_type === 'collection'
            ? a.content.title
            : a.content_type === 'folder'
            ? a.title || 'Untitled'
            : 'Untitled';
        const bName =
          b.content_type === 'source_file'
            ? b.content.filename
            : b.content_type === 'writing_piece'
            ? b.content.title
            : b.content_type === 'collection'
            ? b.content.title
            : b.content_type === 'folder'
            ? b.title || 'Untitled'
            : 'Untitled';
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
              onToggleExpand={toggleFolder}
              isExpanded={isExpanded}
              hasChildren={hasChildren}
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
      {/* Search, Sort, and Actions */}
      <HStack gap={3}>
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
        <Button
          size="md"
          variant="outline"
          onClick={handleCreateFolder}
          colorPalette="blue"
        >
          <IconFolderPlus size={18} />
          New Folder
        </Button>
      </HStack>

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
      ) : sortBy === 'order' ? (
        // Drag-and-drop enabled with tree view (only when sorting by order)
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
        // Drag-and-drop disabled with tree view (when sorting by other criteria)
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

// apps/mixtape/src/components/collections/CollectionDetailWorkArea.tsx

'use client';

import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import {
  VStack,
  HStack,
  Text,
  Box,
  Button,
  Badge,
  Spinner,
  IconButton,
  Input,
  Textarea,
  Grid,
  Select,
  Portal,
} from '@chakra-ui/react';
import {
  IconArrowLeft,
  IconPencil,
  IconCheck,
  IconX,
  IconFolder,
  IconFile,
} from '@tabler/icons-react';
import {
  useCollection,
  useUpdateCollection,
  useDeleteCollection,
} from '@mixtape/api/hooks/stackroom/useCollections';
import { CollectionItemsList } from '@/components/stackroom/CollectionItemsList';
import { CollectionBrowser } from '@/components/stackroom/CollectionBrowser';
import { IndexingStatus } from '@/components/stackroom/IndexingStatus';
import { toaster } from '@/components/ui/toaster';
import { CollectionItemReader } from './CollectionItemReader';
import type { LibraryItem } from '@mixtape/core/types/collectionTypes';
import { createListCollection } from '@chakra-ui/react';

const VISIBILITY_OPTIONS = createListCollection({
  items: [
    { value: 'members', label: 'Members — visible to group members' },
    { value: 'public',  label: 'Public — visible to everyone' },
    { value: 'unlisted', label: 'Unlisted — accessible by link only' },
    { value: 'private', label: 'Private — admins only' },
  ],
});

interface CollectionDetailWorkAreaProps {
  collectionId: string;
  onBack?: () => void;
  canEdit?: boolean;
  backNav?: ReactNode;
  groupSlug?: string;
}

export function CollectionDetailWorkArea({
  collectionId,
  onBack,
  canEdit = false,
  backNav,
  groupSlug,
}: CollectionDetailWorkAreaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editVisibility, setEditVisibility] = useState<'public' | 'members' | 'unlisted' | 'private'>('private');
  const [itemsRefreshKey, setItemsRefreshKey] = useState(0);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  const { collection, isLoading, refetch } = useCollection(collectionId);

  const handleItemAdded = useCallback(() => {
    refetch();
    setItemsRefreshKey((k) => k + 1);
  }, [refetch]);
  const handleOpenItem = useCallback((item: LibraryItem) => {
    setSelectedItem(item);
  }, []);
  const handleCloseItem = useCallback(() => {
    setSelectedItem(null);
    setItemsRefreshKey((k) => k + 1);
  }, []);
  const updateMutation = useUpdateCollection();
  const deleteMutation = useDeleteCollection();

  // Initialize edit form when entering edit mode
  const handleStartEdit = () => {
    if (collection) {
      setEditTitle(collection.title);
      setEditSummary(collection.summary || '');
      setEditVisibility(collection.visibility ?? 'private');
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toaster.create({
        title: 'Title required',
        description: 'Collection title cannot be empty',
        type: 'error',
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        collectionId,
        data: {
          title: editTitle,
          summary: editSummary,
          visibility: editVisibility,
        },
      });

      toaster.create({
        title: 'Collection updated',
        description: 'Changes saved successfully',
        type: 'success',
      });

      setIsEditing(false);
      refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toaster.create({
        title: 'Failed to update',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle('');
    setEditSummary('');
  };

  const handleDelete = async () => {
    if (!confirm('Delete this collection? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(collectionId);

      toaster.create({
        title: 'Collection deleted',
        description: 'Collection has been removed',
        type: 'success',
      });

      onBack?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toaster.create({
        title: 'Failed to delete',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <Box py={16} textAlign="center">
        <Spinner size="lg" color="theme.accent" />
        <Text mt={4} fontFamily="mono" fontSize="11px" letterSpacing="0.1em" textTransform="uppercase" color="theme.textSecondary">
          Loading collection…
        </Text>
      </Box>
    );
  }

  if (!collection) {
    return (
      <Box py={16} textAlign="center">
        <Text color="theme.textSecondary" mb={4}>Collection not found.</Text>
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            <IconArrowLeft size={14} />
            Go back
          </Button>
        )}
      </Box>
    );
  }

  return (
    <VStack gap={0} align="stretch">
      {/* Back nav */}
      {backNav ? (
        <Box pb={5}>{backNav}</Box>
      ) : onBack ? (
        <Box pb={5}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            color="theme.textSecondary"
            px={0}
            _hover={{ color: "theme.text" }}
          >
            <IconArrowLeft size={14} />
            <Text ml={1} fontFamily="mono" fontSize="11px" letterSpacing="0.1em" textTransform="uppercase">
              All collections
            </Text>
          </Button>
        </Box>
      ) : null}

      {/* Collection header */}
      <Box
        pb={6}
        mb={6}
        borderBottom="1px solid"
        borderColor="theme.border"
      >
        {isEditing ? (
          <VStack align="stretch" gap={4} maxW="600px">
            <Box>
              <Text fontFamily="mono" fontSize="10px" letterSpacing="0.12em" textTransform="uppercase" color="theme.textSecondary" mb={2}>
                Title
              </Text>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                size="md"
                fontFamily="serifBody"
                fontSize="lg"
              />
            </Box>
            <Box>
              <Text fontFamily="mono" fontSize="10px" letterSpacing="0.12em" textTransform="uppercase" color="theme.textSecondary" mb={2}>
                Summary
              </Text>
              <Textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                size="md"
                rows={3}
                fontFamily="serifBody"
              />
            </Box>
            <Box>
              <Text fontFamily="mono" fontSize="10px" letterSpacing="0.12em" textTransform="uppercase" color="theme.textSecondary" mb={2}>
                Visibility
              </Text>
              <Select.Root
                collection={VISIBILITY_OPTIONS}
                value={[editVisibility]}
                onValueChange={(e) => setEditVisibility(e.value[0] as typeof editVisibility)}
                size="md"
              >
                <Select.Trigger>
                  <Select.ValueText />
                </Select.Trigger>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {VISIBILITY_OPTIONS.items.map((opt) => (
                        <Select.Item key={opt.value} item={opt}>
                          {opt.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Box>
            <HStack gap={2}>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                loading={updateMutation.isPending}
                bg="theme.text"
                color="theme.bg"
                _hover={{ opacity: 0.88 }}
              >
                <IconCheck size={14} />
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                <IconX size={14} />
                Cancel
              </Button>
            </HStack>
          </VStack>
        ) : (
          <HStack justify="space-between" align="start" gap={4}>
            <Box>
              <Text
                fontFamily="heading"
                fontSize={{ base: "2xl", md: "3xl" }}
                lineHeight="1.1"
                letterSpacing="-0.02em"
                color="theme.text"
                mb={collection.summary ? 2 : 0}
              >
                {collection.title}
              </Text>
              {collection.summary && (
                <Text
                  fontFamily="serifBody"
                  fontSize={{ base: "md", md: "lg" }}
                  fontStyle="italic"
                  lineHeight="1.6"
                  color="theme.textSecondary"
                  maxW="48rem"
                >
                  {collection.summary}
                </Text>
              )}
              <HStack gap={6} mt={3}>
                <Badge
                  size="sm"
                  colorPalette={
                    collection.visibility === 'public' ? 'green'
                    : collection.visibility === 'members' ? 'blue'
                    : collection.visibility === 'unlisted' ? 'yellow'
                    : 'gray'
                  }
                  variant="subtle"
                >
                  {collection.visibility ?? 'private'}
                </Badge>
                <HStack gap={1.5} color="theme.textSecondary">
                  <IconFile size={14} />
                  <Text fontFamily="mono" fontSize="11px" letterSpacing="0.08em">
                    {collection.item_count} items
                  </Text>
                </HStack>
                {collection.file_count > 0 && (
                  <HStack gap={1.5} color="theme.textSecondary">
                    <IconFolder size={14} />
                    <Text fontFamily="mono" fontSize="11px" letterSpacing="0.08em">
                      {collection.file_count} files
                    </Text>
                  </HStack>
                )}
                {collection.ingestion_status && (
                  <HStack gap={2}>
                    <Badge size="sm" variant="outline">
                      {collection.ingestion_status.ready} indexed
                    </Badge>
                    {collection.ingestion_status.processing > 0 && (
                      <Badge size="sm" colorPalette="blue" variant="outline">
                        {collection.ingestion_status.processing} processing
                      </Badge>
                    )}
                    {collection.ingestion_status.failed > 0 && (
                      <Badge size="sm" colorPalette="red" variant="outline">
                        {collection.ingestion_status.failed} failed
                      </Badge>
                    )}
                  </HStack>
                )}
              </HStack>
              {collection.ingestion_status && (
                <Box mt={2}>
                  <IndexingStatus ingestionStatus={collection.ingestion_status} />
                </Box>
              )}
            </Box>
            {canEdit && (
              <IconButton
                aria-label="Edit collection"
                variant="ghost"
                size="sm"
                color="theme.textSecondary"
                _hover={{ color: "theme.text" }}
                onClick={handleStartEdit}
                flexShrink={0}
              >
                <IconPencil size={16} />
              </IconButton>
            )}
          </HStack>
        )}
      </Box>

      {selectedItem ? (
        <CollectionItemReader
          item={selectedItem}
          onBack={handleCloseItem}
          groupSlug={groupSlug}
        />
      ) : (
        <Grid
          templateColumns={{ base: "1fr", lg: canEdit ? "3fr 2fr" : "1fr" }}
          gap={8}
          alignItems="start"
        >
          {/* Items */}
          <Box>
            <Box
              pb={3}
              mb={4}
              borderBottom="1px solid"
              borderColor="theme.border"
            >
              <Text fontFamily="mono" fontSize="10px" letterSpacing="2px" textTransform="uppercase" color="theme.textSecondary">
                Items in this collection
              </Text>
            </Box>
            <CollectionItemsList
              collectionId={collectionId}
              onEditItem={canEdit ? (itemId) => { console.log('Edit item:', itemId); } : undefined}
              onOpenItem={handleOpenItem}
              canReorder={canEdit}
              groupSlug={groupSlug}
              refreshTrigger={itemsRefreshKey}
            />
          </Box>

          {/* Add to collection — admin/steward only */}
          {canEdit && (
            <Box>
              <Box
                pb={3}
                mb={4}
                borderBottom="1px solid"
                borderColor="theme.border"
              >
                <Text fontFamily="mono" fontSize="10px" letterSpacing="2px" textTransform="uppercase" color="theme.textSecondary">
                  Add to collection
                </Text>
              </Box>
              <Text fontFamily="serifBody" fontSize="sm" fontStyle="italic" color="theme.textSecondary" mb={4} lineHeight="1.6">
                Browse files and documents to add to this collection.
              </Text>
              <CollectionBrowser
                collectionId={collectionId}
                onItemAdded={handleItemAdded}
              />
            </Box>
          )}
        </Grid>
      )}

      {/* Danger zone — admin/steward only */}
      {canEdit && !selectedItem && (
        <Box mt={10} pt={6} borderTop="1px solid" borderColor="theme.border">
          <Text fontFamily="mono" fontSize="10px" letterSpacing="0.12em" textTransform="uppercase" color="theme.textSecondary" mb={3}>
            Delete collection
          </Text>
          <Text fontSize="sm" color="theme.textSecondary" mb={4} lineHeight="1.6">
            Removes all items from this collection. The underlying files and documents are not deleted.
          </Text>
          <Button
            variant="outline"
            size="sm"
            colorPalette="red"
            onClick={handleDelete}
            loading={deleteMutation.isPending}
          >
            Delete collection
          </Button>
        </Box>
      )}
    </VStack>
  );
}

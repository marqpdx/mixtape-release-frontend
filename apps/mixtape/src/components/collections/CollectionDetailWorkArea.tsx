// apps/mixtape/src/components/collections/CollectionDetailWorkArea.tsx

'use client';

import { useState } from 'react';
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Box,
  Card,
  Button,
  Badge,
  Spinner,
  IconButton,
  Input,
  Textarea,
  Grid,
} from '@chakra-ui/react';
import {
  IconArrowLeft,
  IconPencil,
  IconCheck,
  IconX,
  IconFolder,
  IconFile,
  IconFolderPlus,
} from '@tabler/icons-react';
import {
  useCollection,
  useUpdateCollection,
  useDeleteCollection,
  useCreateLibraryItem,
} from '@mixtape/api/hooks/stackroom/useCollections';
import { CollectionItemsList } from '@/components/stackroom/CollectionItemsList';
import { CollectionBrowser } from '@/components/stackroom/CollectionBrowser';
import { IndexingStatus } from '@/components/stackroom/IndexingStatus';
import { toaster } from '@/components/ui/toaster';

interface CollectionDetailWorkAreaProps {
  collectionId: string;
  onBack?: () => void;
}

export function CollectionDetailWorkArea({
  collectionId,
  onBack,
}: CollectionDetailWorkAreaProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');

  const { collection, isLoading, refetch } = useCollection(collectionId);
  const updateMutation = useUpdateCollection();
  const deleteMutation = useDeleteCollection();
  const createItemMutation = useCreateLibraryItem();

  // Initialize edit form when entering edit mode
  const handleStartEdit = () => {
    if (collection) {
      setEditTitle(collection.title);
      setEditSummary(collection.summary || '');
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

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:', 'New Folder');

    if (!folderName || !collection) return;

    try {
      await createItemMutation.mutateAsync({
        collectionId,
        data: {
          content_type: 'folder',
          content_id: '',
          is_folder: true,
          title: folderName,
          order_index: collection.item_count,
        } as any,
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
      <Container maxWidth="1200px" py={8}>
        <Box textAlign="center" py={20}>
          <Spinner size="xl" />
          <Text mt={4} color="gray.600">
            Loading collection...
          </Text>
        </Box>
      </Container>
    );
  }

  if (!collection) {
    return (
      <Container maxWidth="1200px" py={8}>
        <Box textAlign="center" py={20}>
          <Text fontSize="xl" fontWeight="bold" color="red.500" mb={4}>
            Collection not found
          </Text>
          {onBack && (
            <Button onClick={onBack} size="sm">
              <HStack gap={2}>
                <IconArrowLeft size={16} />
                <Text>Go Back</Text>
              </HStack>
            </Button>
          )}
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="1200px" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header with Back Button */}
        {onBack && (
          <Button
            variant="ghost"
            onClick={onBack}
            size="sm"
            alignSelf="flex-start"
          >
            <HStack gap={2}>
              <IconArrowLeft size={16} />
              <Text>Back to Collections</Text>
            </HStack>
          </Button>
        )}

        {/* Collection Header */}
        <Card.Root>
          <Card.Body>
            <VStack align="stretch" gap={4}>
              {isEditing ? (
                // Edit Mode
                <>
                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      Title
                    </Text>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      size="md"
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="medium" mb={2}>
                      Summary
                    </Text>
                    <Textarea
                      value={editSummary}
                      onChange={(e) => setEditSummary(e.target.value)}
                      size="md"
                      rows={3}
                    />
                  </Box>

                  <HStack>
                    <Button
                      colorPalette="blue"
                      onClick={handleSaveEdit}
                      loading={updateMutation.isPending}
                      size="sm"
                    >
                      <HStack gap={2}>
                        <IconCheck size={16} />
                        <Text>Save</Text>
                      </HStack>
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleCancelEdit}
                      size="sm"
                    >
                      <HStack gap={2}>
                        <IconX size={16} />
                        <Text>Cancel</Text>
                      </HStack>
                    </Button>
                  </HStack>
                </>
              ) : (
                // View Mode
                <>
                  <HStack justify="space-between" align="start">
                    <HStack gap={3}>
                      <IconFolder size={32} color="var(--chakra-colors-blue-500)" />
                      <Box>
                        <Heading size="lg">{collection.title}</Heading>
                        {collection.summary && (
                          <Text color="gray.600" mt={1}>
                            {collection.summary}
                          </Text>
                        )}
                      </Box>
                    </HStack>

                    <HStack gap={2}>
                      <IconButton
                        aria-label="Edit collection"
                        variant="ghost"
                        onClick={handleStartEdit}
                        size="sm"
                      >
                        <IconPencil size={20} />
                      </IconButton>
                    </HStack>
                  </HStack>

                  {/* Stats */}
                  <HStack gap={8} fontSize="sm">
                    <HStack gap={2} color="gray.600">
                      <IconFile size={20} />
                      <Text fontWeight="bold" fontSize="lg">
                        {collection.item_count}
                      </Text>
                      <Text>items</Text>
                    </HStack>

                    <HStack gap={2} color="gray.600">
                      <IconFolder size={20} />
                      <Text fontWeight="bold" fontSize="lg">
                        {collection.file_count}
                      </Text>
                      <Text>files</Text>
                    </HStack>

                    <HStack gap={2} color="gray.600">
                      <IconCheck size={20} />
                      <Text fontWeight="bold" fontSize="lg">
                        {collection.ingestion_status.ready}
                      </Text>
                      <Text>ready</Text>
                    </HStack>
                  </HStack>

                  {/* Ingestion Status - Subtle sparkle indicator */}
                  <IndexingStatus ingestionStatus={collection.ingestion_status} />

                  {/* Ingestion Status Badges (detailed view) */}
                  <HStack gap={2}>
                    <Badge colorPalette="green" size="sm">
                      {collection.ingestion_status.ready} ready
                    </Badge>
                    {collection.ingestion_status.processing > 0 && (
                      <Badge colorPalette="blue" size="sm">
                        {collection.ingestion_status.processing} processing
                      </Badge>
                    )}
                    {collection.ingestion_status.failed > 0 && (
                      <Badge colorPalette="red" size="sm">
                        {collection.ingestion_status.failed} failed
                      </Badge>
                    )}
                    {collection.ingestion_status.pending > 0 && (
                      <Badge colorPalette="gray" size="sm">
                        {collection.ingestion_status.pending} pending
                      </Badge>
                    )}
                  </HStack>
                </>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Two-Pane Layout: Collection Items (60%) | Available Items (40%) */}
        <Grid
          templateColumns={{ base: '1fr', lg: '60fr 40fr' }}
          gap={6}
          alignItems="start"
        >
          {/* Left Pane: This Collection */}
          <Card.Root>
            <Card.Header>
              <HStack gap={2} justify="space-between" width="100%">
                <HStack gap={2}>
                  <IconFile size={24} />
                  <Heading size="md">This Collection</Heading>
                  <Badge colorPalette="blue" size="sm">
                    {collection.item_count} items
                  </Badge>
                </HStack>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateFolder}
                  colorPalette="blue"
                >
                  <IconFolderPlus size={18} />
                  New Folder
                </Button>
              </HStack>
            </Card.Header>
            <Card.Body>
              <CollectionItemsList
                collectionId={collectionId}
                onEditItem={(itemId) => {
                  console.log('Edit item:', itemId);
                  // TODO: Implement edit modal
                }}
                onCreateFolder={handleCreateFolder}
              />
            </Card.Body>
          </Card.Root>

          {/* Right Pane: Available Items */}
          <Card.Root>
            <Card.Header>
              <HStack gap={2}>
                <IconFolder size={24} />
                <Heading size="md">Add to Collection</Heading>
              </HStack>
              <Text color="gray.600" fontSize="sm" mt={2}>
                Browse and add files, documents, or link other collections
              </Text>
            </Card.Header>
            <Card.Body>
              <CollectionBrowser
                collectionId={collectionId}
                onItemAdded={() => {
                  refetch();
                }}
              />
            </Card.Body>
          </Card.Root>
        </Grid>

        {/* Danger Zone */}
        <Card.Root borderColor="red.300" bg="red.50">
          <Card.Body>
            <VStack align="stretch" gap={3}>
              <Heading size="sm" color="red.700">
                Danger Zone
              </Heading>
              <Text fontSize="sm" color="red.600">
                Deleting a collection will remove all items from it, but will
                not delete the underlying files or documents.
              </Text>
              <Box>
                <Button
                  colorPalette="red"
                  variant="outline"
                  onClick={handleDelete}
                  loading={deleteMutation.isPending}
                  size="sm"
                >
                  Delete Collection
                </Button>
              </Box>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Container>
  );
}

// apps/mixtape/src/components/collections/CollectionsWorkArea.tsx

'use client';

import { useState, useMemo } from 'react';
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Box,
  Card,
  Button,
  Input,
  Textarea,
  Grid,
  Spinner,
  EmptyState,
  Link,
} from '@chakra-ui/react';
import {
  IconFolder,
  IconPlus,
  IconFile,
} from '@tabler/icons-react';
import { useCollections, useCreateCollection } from '@mixtape/api/hooks/stackroom/useCollections';
import { useMyPermissions } from '@mixtape/api/hooks/groups/useGroupPermissions';
import { toaster } from '@/components/ui/toaster';
import type { CollectionListItem } from '@mixtape/core/types/collectionTypes';
import NextLink from 'next/link';

interface CollectionsWorkAreaProps {
  sponsor: {
    type: 'group' | 'user';
    id: string;
    slug: string;
    displayName: string;
  };
  onNavigateToCollection?: (collectionId: string) => void;
}

export function CollectionsWorkArea({
  sponsor,
  onNavigateToCollection,
}: CollectionsWorkAreaProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCollectionTitle, setNewCollectionTitle] = useState('');
  const [newCollectionSummary, setNewCollectionSummary] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: myPermissions } = useMyPermissions(sponsor.type === 'group' ? sponsor.slug : '');
  const canCreateCollection =
    sponsor.type !== 'group'
      ? true
      : myPermissions?.is_admin || myPermissions?.decorators?.includes('can__ManageWriting') || false;

  // Fetch all collections (filtered by sponsor in backend)
  const { collections, isLoading, refetch } = useCollections();
  const createMutation = useCreateCollection();

  // Filter collections by sponsor (client-side safety check)
  const sponsorCollections = useMemo(() => {
    return collections.filter(
      c => c.sponsor_type === sponsor.type && c.sponsor_id === sponsor.id
    );
  }, [collections, sponsor]);

  // Filter by search query
  const filteredCollections = useMemo(() => {
    if (!searchQuery) return sponsorCollections;
    const query = searchQuery.toLowerCase();
    return sponsorCollections.filter(
      c =>
        c.title.toLowerCase().includes(query) ||
        c.summary.toLowerCase().includes(query)
    );
  }, [sponsorCollections, searchQuery]);

  const handleCreateCollection = async () => {
    if (!newCollectionTitle.trim()) {
      toaster.create({
        title: 'Title required',
        description: 'Please enter a title for the collection',
        type: 'error',
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: newCollectionTitle,
        summary: newCollectionSummary,
        sponsor_type: sponsor.type,
        sponsor_id: sponsor.id,
      });

      toaster.create({
        title: 'Collection created',
        description: `"${newCollectionTitle}" has been created`,
        type: 'success',
      });

      setNewCollectionTitle('');
      setNewCollectionSummary('');
      setShowCreateForm(false);
      refetch();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toaster.create({
        title: 'Failed to create collection',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  const handleCollectionClick = (collection: CollectionListItem) => {
    if (onNavigateToCollection) {
      onNavigateToCollection(collection.id);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="1200px" py={8}>
        <Box textAlign="center" py={20}>
          <Spinner size="xl" />
          <Text mt={4} color="gray.600">
            Loading collections...
          </Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="1200px" py={8}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="start">
          <Box>
            <Heading size="xl" mb={2}>
              Collections
            </Heading>
            <Text color="gray.600">
              Curated content collections for {sponsor.displayName}
            </Text>
          </Box>

          {canCreateCollection && (
            <Button
              colorPalette="blue"
              onClick={() => setShowCreateForm(!showCreateForm)}
              size="md"
            >
              <HStack gap={2}>
                <IconPlus size={20} />
                <Text>Add Collection</Text>
              </HStack>
            </Button>
          )}
        </HStack>

        {/* Create Collection Form */}
        {showCreateForm && canCreateCollection && (
          <Card.Root bg="blue.50">
            <Card.Body>
              <VStack gap={4} align="stretch">
                <Heading size="sm">Add Collection</Heading>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Title
                  </Text>
                  <Input
                    placeholder="Collection title"
                    value={newCollectionTitle}
                    onChange={(e) => setNewCollectionTitle(e.target.value)}
                    size="md"
                  />
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={2}>
                    Summary (optional)
                  </Text>
                  <Textarea
                    placeholder="Brief description of this collection"
                    value={newCollectionSummary}
                    onChange={(e) => setNewCollectionSummary(e.target.value)}
                    size="md"
                    rows={3}
                  />
                </Box>

                <HStack>
                  <Button
                    colorPalette="blue"
                    onClick={handleCreateCollection}
                    loading={createMutation.isPending}
                    size="sm"
                  >
                    Add Collection
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewCollectionTitle('');
                      setNewCollectionSummary('');
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* Search */}
        {sponsorCollections.length > 0 && (
          <Input
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="md"
          />
        )}

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <EmptyState.Root>
            <EmptyState.Content>
              <Box color="gray.400" mb={4}>
                <IconFolder size={64} />
              </Box>
              <EmptyState.Title>
                {searchQuery
                  ? 'No collections match your search'
                  : 'No collections yet'}
              </EmptyState.Title>
              <EmptyState.Description>
                {searchQuery
                  ? `No collections match "${searchQuery}"`
                  : canCreateCollection
                    ? 'Create your first collection to organize and curate content'
                    : 'No collections yet.'}
              </EmptyState.Description>
              {!searchQuery && canCreateCollection && sponsor.type === 'group' && (
                <Link as={NextLink} href={`/groups/${sponsor.slug}?view=admin&section=collections-landing`}>
                  <Button size="sm" variant="outline" mt={4}>
                    Add Collection
                  </Button>
                </Link>
              )}
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={4}
          >
            {filteredCollections.map((collection) => (
              <Card.Root
                key={collection.id}
                cursor="pointer"
                _hover={{ shadow: 'md', borderColor: 'blue.300' }}
                onClick={() => handleCollectionClick(collection)}
              >
                <Card.Body>
                  <VStack align="stretch" gap={3}>
                    {/* Title */}
                    <HStack justify="space-between" align="start">
                      <HStack gap={2}>
                        <IconFolder size={20} color="var(--chakra-colors-blue-500)" />
                        <Heading size="sm" lineClamp={1}>
                          {collection.title}
                        </Heading>
                      </HStack>
                    </HStack>

                    {/* Summary */}
                    {collection.summary && (
                      <Text fontSize="sm" color="gray.600" lineClamp={2}>
                        {collection.summary}
                      </Text>
                    )}

                    {/* Stats */}
                    <HStack gap={4} fontSize="sm" color="gray.600">
                      <HStack gap={1}>
                        <IconFile size={16} />
                        <Text>{collection.item_count} items</Text>
                      </HStack>
                      <HStack gap={1}>
                        <IconFolder size={16} />
                        <Text>{collection.file_count} files</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </Card.Body>
              </Card.Root>
            ))}
          </Grid>
        )}

        {/* Stats Footer */}
        {filteredCollections.length > 0 && (
          <Text fontSize="sm" color="gray.600" textAlign="center">
            Showing {filteredCollections.length} of {sponsorCollections.length}{' '}
            collections
          </Text>
        )}
      </VStack>
    </Container>
  );
}

// Collection Browser - Browse and add files/documents to a Collection

'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Badge,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { IconFiles, IconFileText, IconFolders, IconUpload, IconVideo } from '@tabler/icons-react';
import { useAvailableFiles, useAvailableDocuments, useCollections, useCreateLibraryItem } from '@mixtape/api/hooks/stackroom/useCollections';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import { AvailableFilesList } from './AvailableFilesList';
import { AvailableDocumentsList } from './AvailableDocumentsList';
import { AvailableCollectionsList } from './AvailableCollectionsList';
import { FileUpload } from './FileUpload';
import { toaster } from '../ui/toaster';

interface CollectionBrowserProps {
  collectionId: string;
  onItemAdded?: () => void;
}

type TopFilter = 'upload' | 'writing' | 'collections' | 'uploaded' | 'screencasts';

const TOP_FILTERS: { id: TopFilter; label: string; icon: React.ReactNode; help: string }[] = [
  {
    id: 'upload',
    label: 'Upload',
    icon: <IconUpload size={16} />,
    help: 'Upload PDFs, docs, markdown files.',
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: <IconFileText size={16} />,
    help: 'Add published writing pieces or dispatch posts from this group.',
  },
  {
    id: 'collections',
    label: 'Colls',
    icon: <IconFolders size={16} />,
    help: 'Link another Collection or copy all its items into this one.',
  },
  {
    id: 'uploaded',
    label: 'Uploaded',
    icon: <IconFiles size={16} />,
    help: 'Add previously uploaded files from your library.',
  },
  {
    id: 'screencasts',
    label: 'Screencasts',
    icon: <IconVideo size={16} />,
    help: 'Add a ready screencast (transcription complete) from your captures.',
  },
];

export function CollectionBrowser({
  collectionId,
  onItemAdded,
}: CollectionBrowserProps) {
  const [activeTop, setActiveTop] = useState<TopFilter>('upload');

  const { files, isLoading: filesLoading, refetch: refetchFiles } = useAvailableFiles(collectionId);
  const { documents, isLoading: docsLoading } = useAvailableDocuments(collectionId);
  const { collections, isLoading: collectionsLoading } = useCollections();
  const createMutation = useCreateLibraryItem();

  const { data: captures = [], isLoading: capturesLoading } = useQuery<{
    capture_id: string; title: string; status: string; created_at: string;
  }[]>({
    queryKey: ['media-captures'],
    queryFn: () => axiosInstance.get('/api/media-capture/').then((r) => r.data),
    enabled: activeTop === 'screencasts',
  });
  const availableCollectionsCount = collections.filter(
    (collection) => collection.id !== collectionId
  ).length;

  const handleAddFile = async (fileId: string, filename: string) => {
    try {
      await createMutation.mutateAsync({
        collectionId,
        data: { content_type: 'source_file', content_id: fileId, title: filename },
      });
      toaster.create({ title: 'File added', type: 'success' });
      onItemAdded?.();
    } catch (error: unknown) {
      toaster.create({
        title: 'Error adding file',
        description: error instanceof Error ? error.message : 'Failed to add file',
        type: 'error',
      });
    }
  };

  const handleAddDocument = async (documentId: string, docType: 'writing_piece' | 'dispatch_post' = 'writing_piece') => {
    try {
      await createMutation.mutateAsync({
        collectionId,
        data: { content_type: docType, content_id: documentId },
      });
      toaster.create({ title: 'Document added', type: 'success' });
      onItemAdded?.();
    } catch (error: unknown) {
      toaster.create({
        title: 'Error adding document',
        description: error instanceof Error ? error.message : 'Failed to add document',
        type: 'error',
      });
    }
  };

  const handleUploadComplete = async (fileId: string, filename: string) => {
    try {
      await createMutation.mutateAsync({
        collectionId,
        data: { content_type: 'source_file', content_id: fileId, title: filename },
      });
      toaster.create({ title: 'File uploaded and added', type: 'success' });
      await refetchFiles();
      onItemAdded?.();
    } catch (error: unknown) {
      toaster.create({
        title: 'Upload succeeded but failed to add',
        description: error instanceof Error ? error.message : 'File was uploaded but could not be added',
        type: 'error',
      });
    }
  };

  const handleLinkCollection = async (linkedCollectionId: string) => {
    try {
      await createMutation.mutateAsync({
        collectionId,
        data: { content_type: 'collection', content_id: linkedCollectionId },
      });
      toaster.create({ title: 'Collection linked', type: 'success' });
      onItemAdded?.();
    } catch (error: unknown) {
      toaster.create({
        title: 'Error linking collection',
        description: error instanceof Error ? error.message : 'Failed to link collection',
        type: 'error',
      });
    }
  };

  const handleAddScreencast = async (captureId: string, title: string) => {
    try {
      await createMutation.mutateAsync({
        collectionId,
        data: { content_type: 'media_capture', content_id: captureId, title },
      });
      toaster.create({ title: 'Screencast added', type: 'success' });
      onItemAdded?.();
    } catch (error: unknown) {
      toaster.create({
        title: 'Error adding screencast',
        description: error instanceof Error ? error.message : 'Failed to add screencast',
        type: 'error',
      });
    }
  };

  const handleAddAllItems = async (sourceCollectionId: string) => {
    try {
      const response = await fetch(
        `/api/collections/${collectionId}/items/copy-from/${sourceCollectionId}/`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' } }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to copy items');
      }
      const data = await response.json();
      toaster.create({
        title: 'Items copied',
        description: `Copied ${data.copied_count} items from source collection`,
        type: 'success',
      });
      onItemAdded?.();
    } catch (error: unknown) {
      toaster.create({
        title: 'Error copying items',
        description: error instanceof Error ? error.message : 'Failed to copy items',
        type: 'error',
      });
    }
  };

  const activeTopMeta = TOP_FILTERS.find((f) => f.id === activeTop)!;

  const renderContent = () => {
    if (activeTop === 'upload') {
      return (
        <Box>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Files are added to your group&apos;s library and then automatically
            attached to this collection.
          </Text>
          <FileUpload
            libraryId={collectionId}
            mode="collection"
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => {
              toaster.create({ title: 'Upload failed', description: error, type: 'error' });
            }}
          />
        </Box>
      );
    }

    if (activeTop === 'writing') {
      return (
        <AvailableDocumentsList
          documents={documents}
          onAddDocument={handleAddDocument}
          isLoading={docsLoading}
        />
      );
    }

    if (activeTop === 'uploaded') {
      return (
        <AvailableFilesList
          files={files}
          onAddFile={handleAddFile}
          isLoading={filesLoading}
        />
      );
    }

    if (activeTop === 'screencasts') {
      const ready = captures.filter((c) => c.status === 'ready');
      if (capturesLoading) return <Spinner size="sm" />;
      if (ready.length === 0) return (
        <Text fontSize="sm" color="gray.500">No ready screencasts found. Record and transcribe a screencast first.</Text>
      );
      return (
        <VStack align="stretch" gap={2}>
          {ready.map((c) => (
            <HStack key={c.capture_id} justify="space-between" px={3} py={2}
              borderWidth="1px" borderColor="border" borderRadius="md">
              <VStack align="start" gap={0}>
                <Text fontSize="sm" fontWeight="medium">{c.title || 'Untitled screencast'}</Text>
                <Text fontSize="xs" color="gray.500">
                  {new Date(c.created_at).toLocaleDateString()}
                </Text>
              </VStack>
              <Button size="xs" colorPalette="blue" variant="outline"
                onClick={() => handleAddScreencast(c.capture_id, c.title || 'Untitled screencast')}>
                Add
              </Button>
            </HStack>
          ))}
        </VStack>
      );
    }

    return (
      <AvailableCollectionsList
        currentCollectionId={collectionId}
        onLinkCollection={handleLinkCollection}
        onAddAllItems={handleAddAllItems}
      />
    );
  };

  return (
    <VStack align="stretch" gap={4}>
      {/* Top-level filter buttons */}
      <HStack gap={2} flexWrap="wrap">
        {TOP_FILTERS.map(({ id, label, icon }) => {
          const count = id === 'collections'
            ? availableCollectionsCount
            : id === 'uploaded'
            ? files.length
            : null;
          const isCountLoading = id === 'collections'
            ? collectionsLoading
            : id === 'uploaded'
            ? filesLoading
            : false;

          return (
            <Button
              key={id}
              size="sm"
              variant={activeTop === id ? 'solid' : 'outline'}
              colorPalette={activeTop === id ? 'blue' : 'gray'}
              onClick={() => setActiveTop(id)}
            >
              <HStack gap={2}>
                {icon}
                <Text>{label}</Text>
                {count !== null && !isCountLoading && (
                  <Badge size="xs" colorPalette={activeTop === id ? 'blue' : 'gray'}>
                    {count}
                  </Badge>
                )}
              </HStack>
            </Button>
          );
        })}
      </HStack>

      {/* Help text */}
      <Text fontSize="xs" color="gray.500">
        {activeTopMeta.help}
      </Text>

      {/* Content */}
      <Box>{renderContent()}</Box>
    </VStack>
  );
}

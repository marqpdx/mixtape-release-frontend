// Collection Browser - Browse and add files/documents to a Collection

'use client';

import { useState } from 'react';
import {
  Box,
  Text,
  Badge,
  HStack,
  VStack,
  Button,
} from '@chakra-ui/react';
import { IconUpload, IconFileText, IconFolders } from '@tabler/icons-react';
import { useAvailableFiles, useAvailableDocuments, useCreateLibraryItem } from '@mixtape/api/hooks/stackroom/useCollections';
import { AvailableFilesList } from './AvailableFilesList';
import { AvailableDocumentsList } from './AvailableDocumentsList';
import { AvailableCollectionsList } from './AvailableCollectionsList';
import { FileUpload } from './FileUpload';
import { toaster } from '../ui/toaster';

interface CollectionBrowserProps {
  collectionId: string;
  onItemAdded?: () => void;
}

type TopFilter = 'upload' | 'writing' | 'collections';
type UploadSubFilter = 'browse' | 'new';

const TOP_FILTERS: { id: TopFilter; label: string; icon: React.ReactNode; help: string }[] = [
  {
    id: 'upload',
    label: 'Upload',
    icon: <IconUpload size={16} />,
    help: 'Add files from your library — PDFs, docs, markdown — or upload something new.',
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: <IconFileText size={16} />,
    help: 'Add published writing pieces or dispatch posts from this group.',
  },
  {
    id: 'collections',
    label: 'Collections',
    icon: <IconFolders size={16} />,
    help: 'Link another collection or copy all its items into this one.',
  },
];

export function CollectionBrowser({
  collectionId,
  onItemAdded,
}: CollectionBrowserProps) {
  const [activeTop, setActiveTop] = useState<TopFilter>('upload');
  const [uploadSub, setUploadSub] = useState<UploadSubFilter>('browse');

  const { files, isLoading: filesLoading } = useAvailableFiles(collectionId);
  const { documents, isLoading: docsLoading } = useAvailableDocuments(collectionId);
  const createMutation = useCreateLibraryItem();

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
      setUploadSub('browse');
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
        <VStack align="stretch" gap={4}>
          {/* Upload sub-tabs */}
          <HStack gap={2}>
            <Button
              size="xs"
              variant={uploadSub === 'browse' ? 'solid' : 'outline'}
              colorPalette={uploadSub === 'browse' ? 'blue' : 'gray'}
              onClick={() => setUploadSub('browse')}
            >
              Previously Uploaded
              {!filesLoading && (
                <Badge size="xs" colorPalette="gray" ml={1}>
                  {files.length}
                </Badge>
              )}
            </Button>
            <Button
              size="xs"
              variant={uploadSub === 'new' ? 'solid' : 'outline'}
              colorPalette={uploadSub === 'new' ? 'green' : 'gray'}
              onClick={() => setUploadSub('new')}
            >
              Upload New
            </Button>
          </HStack>

          {uploadSub === 'browse' ? (
            <AvailableFilesList
              files={files}
              onAddFile={handleAddFile}
              isLoading={filesLoading}
            />
          ) : (
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
          )}
        </VStack>
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
      <HStack gap={2}>
        {TOP_FILTERS.map(({ id, label, icon }) => (
          <Button
            key={id}
            size="sm"
            variant={activeTop === id ? 'solid' : 'outline'}
            colorPalette={activeTop === id ? 'blue' : 'gray'}
            onClick={() => {
              setActiveTop(id);
              if (id === 'upload') setUploadSub('browse');
            }}
          >
            <HStack gap={2}>
              {icon}
              <Text>{label}</Text>
            </HStack>
          </Button>
        ))}
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

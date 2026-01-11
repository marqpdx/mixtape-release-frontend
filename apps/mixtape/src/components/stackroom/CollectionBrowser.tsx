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
  Separator,
} from '@chakra-ui/react';
import { IconFile, IconFileText, IconFolders } from '@tabler/icons-react';
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

type FilterType = 'files' | 'documents' | 'collections';

export function CollectionBrowser({
  collectionId,
  onItemAdded,
}: CollectionBrowserProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('files');
  const [showUpload, setShowUpload] = useState(false);

  const { files, isLoading: filesLoading } = useAvailableFiles(collectionId);
  const { documents, isLoading: docsLoading } = useAvailableDocuments(collectionId);
  const createMutation = useCreateLibraryItem();

  const handleAddFile = async (fileId: string) => {
    try {
      await createMutation.mutateAsync({
        collectionId,
        data: {
          content_type: 'source_file',
          content_id: fileId,
        },
      });

      toaster.create({
        title: 'File added',
        description: 'File has been added to the collection',
        type: 'success',
      });

      onItemAdded?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add file to collection';
      toaster.create({
        title: 'Error adding file',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  const handleAddDocument = async (documentId: string) => {
    try {
      await createMutation.mutateAsync({
        collectionId,
        data: {
          content_type: 'writing_piece',
          content_id: documentId,
        },
      });

      toaster.create({
        title: 'Document added',
        description: 'Document has been added to the collection',
        type: 'success',
      });

      onItemAdded?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add document to collection';
      toaster.create({
        title: 'Error adding document',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  const handleUploadComplete = async (fileId: string) => {
    // Automatically add the uploaded file to the collection
    try {
      await createMutation.mutateAsync({
        collectionId,
        data: {
          content_type: 'source_file',
          content_id: fileId,
        },
      });

      toaster.create({
        title: 'File uploaded and added',
        description: 'File has been uploaded and added to the collection',
        type: 'success',
      });

      // Hide upload and refresh
      setShowUpload(false);
      onItemAdded?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'File was uploaded but could not be added to collection';
      toaster.create({
        title: 'Upload succeeded but failed to add',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  const handleLinkCollection = async (linkedCollectionId: string) => {
    try {
      await createMutation.mutateAsync({
        collectionId,
        data: {
          content_type: 'collection',
          content_id: linkedCollectionId,
        },
      });

      toaster.create({
        title: 'Collection linked',
        description: 'Collection has been linked. Updates will sync automatically.',
        type: 'success',
      });

      onItemAdded?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to link collection';
      toaster.create({
        title: 'Error linking collection',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  const handleAddAllItems = async (sourceCollectionId: string) => {
    try {
      const response = await fetch(
        `/api/collections/${collectionId}/items/copy-from/${sourceCollectionId}/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to copy items from collection';
      toaster.create({
        title: 'Error copying items',
        description: errorMessage,
        type: 'error',
      });
    }
  };

  const renderContent = () => {
    // Show upload form if toggled
    if (showUpload && activeFilter === 'files') {
      return (
        <Box>
          <Text fontSize="sm" color="gray.600" mb={4}>
            Upload files to add them directly to this collection.
            Files will be automatically added after successful upload.
          </Text>
          <FileUpload
            libraryId={collectionId}
            mode="collection"
            onUploadComplete={handleUploadComplete}
            onUploadError={(error) => {
              toaster.create({
                title: 'Upload failed',
                description: error,
                type: 'error',
              });
            }}
          />
        </Box>
      );
    }

    // Show appropriate list based on active filter
    switch (activeFilter) {
      case 'files':
        return (
          <AvailableFilesList
            files={files}
            onAddFile={handleAddFile}
            isLoading={filesLoading}
          />
        );
      case 'documents':
        return (
          <AvailableDocumentsList
            documents={documents}
            onAddDocument={handleAddDocument}
            isLoading={docsLoading}
          />
        );
      case 'collections':
        return (
          <AvailableCollectionsList
            currentCollectionId={collectionId}
            onLinkCollection={handleLinkCollection}
            onAddAllItems={handleAddAllItems}
          />
        );
      default:
        return null;
    }
  };

  return (
    <VStack align="stretch" gap={4}>
      {/* Filter Buttons */}
      <HStack gap={2} flexWrap="wrap">
        <Button
          size="sm"
          variant={activeFilter === 'files' ? 'solid' : 'outline'}
          colorPalette={activeFilter === 'files' ? 'blue' : 'gray'}
          onClick={() => {
            setActiveFilter('files');
            setShowUpload(false);
          }}
        >
          <HStack gap={2}>
            <IconFile size={16} />
            <Text>Previously Uploaded</Text>
            {!filesLoading && (
              <Badge size="xs" colorPalette="gray">
                {files.length}
              </Badge>
            )}
          </HStack>
        </Button>

        <Button
          size="sm"
          variant={activeFilter === 'documents' ? 'solid' : 'outline'}
          colorPalette={activeFilter === 'documents' ? 'blue' : 'gray'}
          onClick={() => {
            setActiveFilter('documents');
            setShowUpload(false);
          }}
        >
          <HStack gap={2}>
            <IconFileText size={16} />
            <Text>Internal Docs</Text>
            {!docsLoading && (
              <Badge size="xs" colorPalette="gray">
                {documents.length}
              </Badge>
            )}
          </HStack>
        </Button>

        <Button
          size="sm"
          variant={activeFilter === 'collections' ? 'solid' : 'outline'}
          colorPalette={activeFilter === 'collections' ? 'blue' : 'gray'}
          onClick={() => {
            setActiveFilter('collections');
            setShowUpload(false);
          }}
        >
          <HStack gap={2}>
            <IconFolders size={16} />
            <Text>Existing Collections</Text>
          </HStack>
        </Button>

        {/* Upload Toggle (only show for files filter) */}
        {activeFilter === 'files' && (
          <>
            <Separator orientation="vertical" height="24px" />
            <Button
              size="sm"
              variant={showUpload ? 'solid' : 'outline'}
              colorPalette={showUpload ? 'green' : 'gray'}
              onClick={() => setShowUpload(!showUpload)}
            >
              {showUpload ? 'Browse Files' : 'Upload New'}
            </Button>
          </>
        )}
      </HStack>

      {/* Content Area */}
      <Box>{renderContent()}</Box>
    </VStack>
  );
}

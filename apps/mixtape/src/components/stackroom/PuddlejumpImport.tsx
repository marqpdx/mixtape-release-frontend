// apps/mixtape/src/components/stackroom/PuddlejumpImport.tsx

'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  Spinner,
} from '@chakra-ui/react';
import {
  CloudArrowUpIcon,
  ArchiveBoxIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { usePuddlejumpImport } from '@mixtape/api/hooks/puddlejump/usePuddlejump';
import { toaster } from '@/components/ui/toaster';
import type { PuddlejumpImportResponse } from '@mixtape/core/types/puddlejump';

interface PuddlejumpImportProps {
  /** Callback fired when import completes successfully */
  onImportComplete?: (result: PuddlejumpImportResponse) => void;
  /** Callback fired when import fails */
  onImportError?: (error: string) => void;
  /** Conflict resolution strategy */
  conflictStrategy?: 'replace' | 'version' | 'skip';
  /** Whether to auto-trigger Stackroom ingestion */
  autoIngest?: boolean;
}

interface ImportState {
  status: 'idle' | 'importing' | 'complete' | 'error';
  filename?: string;
  result?: PuddlejumpImportResponse;
  error?: string;
}

export function PuddlejumpImport({
  onImportComplete,
  onImportError,
  conflictStrategy = 'replace',
  autoIngest = true,
}: PuddlejumpImportProps) {
  const router = useRouter();
  const [isDragActive, setIsDragActive] = useState(false);
  const [importState, setImportState] = useState<ImportState>({ status: 'idle' });

  // Puddlejump import mutation
  const importMutation = usePuddlejumpImport({
    onSuccess: (result) => {
      setImportState({
        status: 'complete',
        result,
      });

      toaster.create({
        title: 'Import Successful',
        description: `Created collection "${result.library_slug}" with ${result.counts.new_files} items`,
        type: 'success',
        duration: 5000,
      });

      // Large bundle warning (A2: >100 files)
      if (result.warning === 'large_bundle') {
        toaster.create({
          title: 'Large Bundle',
          description: `This bundle contains ${result.file_count ?? 'many'} files. Processing may take longer than usual.`,
          type: 'info',
          duration: 8000,
        });
      }

      onImportComplete?.(result);

      // Navigate to imported collection after short delay
      setTimeout(() => {
        router.push(`/collections/${result.library_slug}`);
      }, 1500);
    },
    onError: (error) => {
      const errorMessage = error.message || 'Import failed';

      setImportState({
        status: 'error',
        error: errorMessage,
      });

      toaster.create({
        title: 'Import Failed',
        description: errorMessage,
        type: 'error',
        duration: 8000,
      });

      onImportError?.(errorMessage);
    },
  });

  // Validate and process file
  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (!file.name.endsWith('.zip')) {
        const error = 'Only .zip files are supported';
        toaster.create({
          title: 'Invalid File Type',
          description: error,
          type: 'error',
        });
        setImportState({ status: 'error', error });
        return;
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        const error = `File size exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
        toaster.create({
          title: 'File Too Large',
          description: error,
          type: 'error',
        });
        setImportState({ status: 'error', error });
        return;
      }

      // Start import
      setImportState({
        status: 'importing',
        filename: file.name,
      });

      // Perform import
      await importMutation.mutateAsync({
        file,
        conflictStrategy,
        autoIngest,
      });
    },
    [importMutation, conflictStrategy, autoIngest]
  );

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]); // Only take first file
      }
    },
    [handleFile]
  );

  // Handle file selection
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  // Get status icon and color
  const getStatusDisplay = () => {
    switch (importState.status) {
      case 'importing':
        return {
          icon: <Spinner size="sm" color="blue.500" />,
          color: 'blue.500',
          text: 'Importing bundle...',
        };
      case 'complete':
        return {
          icon: <CheckCircleIcon style={{ width: '20px', height: '20px' }} />,
          color: 'green.500',
          text: `Successfully imported ${importState.result?.counts.new_files} files`,
        };
      case 'error':
        return {
          icon: <XCircleIcon style={{ width: '20px', height: '20px' }} />,
          color: 'red.500',
          text: importState.error || 'Import failed',
        };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();
  const isProcessing = importState.status === 'importing';

  return (
    <VStack gap={6} align="stretch">
      {/* Drop Zone */}
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={isDragActive ? 'blue.500' : 'gray.300'}
        borderRadius="lg"
        p={12}
        bg={isDragActive ? 'blue.50' : 'gray.50'}
        transition="all 0.2s"
        cursor={isProcessing ? 'not-allowed' : 'pointer'}
        opacity={isProcessing ? 0.6 : 1}
        _hover={{
          borderColor: isProcessing ? 'gray.300' : 'blue.400',
          bg: isProcessing ? 'gray.50' : 'blue.50',
        }}
      >
        <VStack gap={4}>
          <Box color={isDragActive ? 'blue.500' : 'gray.400'}>
            <CloudArrowUpIcon style={{ width: '48px', height: '48px' }} />
          </Box>

          <VStack gap={2}>
            <Text fontSize="lg" fontWeight="medium">
              {isDragActive
                ? 'Drop Puddlejump bundle here'
                : 'Drag and drop Puddlejump bundle'}
            </Text>
            <Text fontSize="sm" color="gray.600">
              or
            </Text>
          </VStack>

          <Button
            as="label"
            colorPalette="blue"
            size="md"
            cursor="pointer"
            disabled={isProcessing}
          >
            Browse for .zip Bundle
            <input
              id="puddlejump-upload"
              type="file"
              accept=".zip"
              onChange={handleFileInput}
              disabled={isProcessing}
              style={{ display: 'none' }}
            />
          </Button>

          <Text fontSize="xs" color="gray.500">
            Supported: .zip bundles (max 50MB)
          </Text>
        </VStack>
      </Box>

      {/* Import Status */}
      {statusDisplay && (
        <Card.Root borderWidth="1px">
          <Card.Body p={4}>
            <HStack gap={3}>
              <Box color={statusDisplay.color}>
                {statusDisplay.icon}
              </Box>
              <VStack gap={1} align="start" flex={1}>
                <Text fontSize="sm" fontWeight="medium">
                  {importState.filename}
                </Text>
                <Text fontSize="xs" color="gray.600">
                  {statusDisplay.text}
                </Text>
              </VStack>
            </HStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* Instructions */}
      <Card.Root bg="blue.50" borderWidth="1px" borderColor="blue.200">
        <Card.Body p={4}>
          <VStack gap={3} align="start">
            <HStack gap={2}>
              <ArchiveBoxIcon style={{ width: '20px', height: '20px', color: 'var(--chakra-colors-blue-600)' }} />
              <Text fontSize="sm" fontWeight="semibold" color="blue.900">
                What is a Puddlejump Bundle?
              </Text>
            </HStack>

            <Text fontSize="sm" color="blue.800">
              Puddlejump bundles are portable document libraries containing 50-300 canonical
              markdown files with metadata, folder structure, and integrity verification.
            </Text>

            <Text fontSize="xs" color="blue.700">
              Importing a bundle will:
            </Text>

            <VStack gap={1} align="start" pl={4}>
              <Text fontSize="xs" color="blue.700">
                • Create a new collection with folder hierarchy
              </Text>
              <Text fontSize="xs" color="blue.700">
                • Preserve canonical metadata from file front matter
              </Text>
              {autoIngest && (
                <Text fontSize="xs" color="blue.700">
                  • Trigger Stackroom ingestion for search/embeddings
                </Text>
              )}
            </VStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}

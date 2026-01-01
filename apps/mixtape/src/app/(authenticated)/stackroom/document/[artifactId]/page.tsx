'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DocumentViewer } from '@/components/stackroom/DocumentViewer';
import { useArtifactContent } from '@mixtape/api/hooks';
import { Box, Center, Spinner, Text, VStack } from '@chakra-ui/react';
import type { ChunkResult } from '@mixtape/core/types/stackroomTypes';
import { useEffect, useState } from 'react';

export default function DocumentViewerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const artifactId = params.artifactId as string;

  // Get chunk data from URL params
  const [chunkData, setChunkData] = useState<ChunkResult | null>(null);

  useEffect(() => {
    // Parse chunk data from URL params
    try {
      const chunkJson = searchParams.get('chunk');
      if (chunkJson) {
        const parsed = JSON.parse(decodeURIComponent(chunkJson));
        setChunkData(parsed);
      }
    } catch (err) {
      console.error('Failed to parse chunk data:', err);
    }
  }, [searchParams]);

  // Fetch full artifact content
  const { text, isLoading, error } = useArtifactContent(artifactId);

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  const handleClose = () => {
    router.push('/stackroom');
  };

  // Loading state
  if (isLoading || !chunkData) {
    return (
      <Center height="100vh">
        <VStack gap={4}>
          <Spinner size="xl" />
          <Text>Loading document...</Text>
        </VStack>
      </Center>
    );
  }

  // Error state
  if (error) {
    return (
      <Center height="100vh">
        <VStack gap={4}>
          <Text fontSize="xl" fontWeight="semibold" color="red.500">
            Failed to load document
          </Text>
          <Text color="gray.600">{error.message}</Text>
          <button onClick={handleBack}>Go Back</button>
        </VStack>
      </Center>
    );
  }

  // Render document viewer
  return (
    <Box>
      <DocumentViewer
        chunk={chunkData}
        fullText={text}
        onBack={handleBack}
        onClose={handleClose}
      />
    </Box>
  );
}

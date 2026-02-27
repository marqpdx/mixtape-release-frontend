'use client';

import { useParams } from 'next/navigation';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { useMindmap } from '@mixtape/api/hooks/useMindmap';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with ReactFlow
const MindMapCanvas = dynamic(
  () => import('@/components/mindmap/MindMapCanvas'),
  { ssr: false }
);

export default function MindMapEditorPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: mindmap, isLoading, error } = useMindmap(id);

  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  if (isLoading) {
    return (
      <VStack h="calc(100vh - 100px)" justify="center" align="center">
        <Spinner size="lg" />
        <Text fontSize="sm" color={mutedColor}>
          Loading...
        </Text>
      </VStack>
    );
  }

  if (error || !mindmap) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Text color="red.500">
          {error ? 'Failed to load mind map.' : 'Mind map not found.'}
        </Text>
      </Box>
    );
  }

  return <MindMapCanvas mindmap={mindmap} />;
}

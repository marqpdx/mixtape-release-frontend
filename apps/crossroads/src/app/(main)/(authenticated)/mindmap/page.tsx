'use client';

import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { IconPlus } from '@tabler/icons-react';
import { useMindmaps, useCreateMindmap } from '@mixtape/api/hooks/useMindmap';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function MindMapListPage() {
  const router = useRouter();
  const { data: mindmaps, isLoading, error } = useMindmaps();
  const createMindmap = useCreateMindmap();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const handleCreate = async () => {
    const title = window.prompt('Mind map title:', 'Untitled');
    if (title === null) return;
    createMindmap.mutate(
      { title: title || 'Untitled' },
      {
        onSuccess: (newMap) => {
          router.push(`/mindmap/${newMap.id}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box maxW="4xl" mx="auto" px="6" py="10">
      <HStack mb="6" justify="space-between" align="center">
        <Heading size="lg">Mind Maps</Heading>
        <Button
          size="sm"
          colorPalette="blue"
          onClick={handleCreate}
          loading={createMindmap.isPending}
        >
          <IconPlus size={16} />
          New Mind Map
        </Button>
      </HStack>

      {error && (
        <Text fontSize="sm" color="red.500" mb="4">
          Failed to load mind maps.
        </Text>
      )}

      {mindmaps && mindmaps.length === 0 && (
        <Box
          p="8"
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          bg={cardBg}
          textAlign="center"
        >
          <Text color={mutedColor} mb="3">
            No mind maps yet.
          </Text>
          <Button size="sm" variant="outline" onClick={handleCreate}>
            Create your first one
          </Button>
        </Box>
      )}

      <VStack gap="3" align="stretch">
        {mindmaps?.map((mm) => (
          <Box
            key={mm.id}
            p="4"
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            bg={cardBg}
            _hover={{ borderColor: 'blue.300' }}
            transition="border-color 0.15s"
            cursor="pointer"
            onClick={() => router.push(`/mindmap/${mm.id}`)}
          >
            <HStack justify="space-between">
              <Box>
                <Text fontWeight="500">{mm.title || 'Untitled'}</Text>
                <Text fontSize="xs" color={mutedColor}>
                  {mm.status} &middot; v{mm.version} &middot; {formatDate(mm.updated_at)}
                </Text>
              </Box>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
}

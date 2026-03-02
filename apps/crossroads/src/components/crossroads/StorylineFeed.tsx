// components/crossroads/StorylineFeed.tsx

'use client';

import { Box, VStack, Text, Spinner, Badge, HStack, Image } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { useStoryline, useDeleteLeaf } from '@mixtape/api/hooks/useLeaf';
import { useComposerDraft } from './ComposerContext';
import LeafCard from './LeafCard';
import { useAuth } from '@/lib/auth/AuthContext';

function PreviewCard() {
  const ctx = useComposerDraft();
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const bg = useColorModeValue('blue.50', 'blue.900');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  if (!ctx) return null;
  const { draft } = ctx;
  if (!draft.text.trim() && !draft.imageUrl) return null;

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderStyle="dashed"
      borderColor={borderColor}
      borderRadius="lg"
      bg={bg}
      opacity={0.85}
    >
      <HStack mb={2}>
        <Badge size="sm" variant="subtle" colorPalette="blue">
          Preview
        </Badge>
        <Text fontSize="xs" color={mutedColor}>
          How your post will look
        </Text>
      </HStack>
      {draft.imageUrl && (
        <Image
          src={draft.imageUrl}
          alt=""
          borderRadius="md"
          w="full"
          maxH="300px"
          objectFit="cover"
          mb={2}
        />
      )}
      {draft.text && (
        <Text fontSize="sm" whiteSpace="pre-wrap">
          {draft.text}
        </Text>
      )}
    </Box>
  );
}

export default function StorylineFeed() {
  const { data, isLoading, error } = useStoryline();
  const { user } = useAuth();
  const deleteLeaf = useDeleteLeaf();
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const handleDelete = (leafId: string) => {
    if (window.confirm('Delete this entry?')) {
      deleteLeaf.mutate(leafId);
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={12}>
        <Text color="red.500">Failed to load Storyline.</Text>
      </Box>
    );
  }

  const leaves = data?.results ?? [];

  if (leaves.length === 0) {
    return (
      <VStack gap={4} align="stretch">
        <PreviewCard />
        <Box textAlign="center" py={16}>
          <VStack gap={3}>
            <Text fontSize="lg" fontWeight="medium" color={mutedColor}>
              Your Storyline is empty
            </Text>
            <Text fontSize="sm" color={mutedColor}>
              Capture a thought in the Composer, then post it here.
            </Text>
          </VStack>
        </Box>
      </VStack>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      <PreviewCard />
      {leaves.map((leaf) => (
        <LeafCard
          key={leaf.id}
          leaf={leaf}
          onDelete={user?.username === leaf.author.username ? handleDelete : undefined}
        />
      ))}
    </VStack>
  );
}

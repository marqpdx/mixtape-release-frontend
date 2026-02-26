// components/crossroads/StorylineFeed.tsx

'use client';

import { Box, VStack, Text, Spinner } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { useStoryline } from '@mixtape/api/hooks/useLeaf';
import LeafCard from './LeafCard';

export default function StorylineFeed() {
  const { data, isLoading, error } = useStoryline();
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

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
    );
  }

  return (
    <VStack gap={0} align="stretch">
      {leaves.map((leaf) => (
        <LeafCard key={leaf.id} leaf={leaf} />
      ))}
    </VStack>
  );
}

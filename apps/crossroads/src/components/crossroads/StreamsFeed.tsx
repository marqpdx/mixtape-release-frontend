// components/crossroads/StreamsFeed.tsx

'use client';

import { Box, VStack, Text, Spinner } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { useStreams } from '@mixtape/api/hooks/useFollow';
import type { Leaf } from '@mixtape/core/types/leaf';
import LeafCard from './LeafCard';

export default function StreamsFeed() {
  const { data, isLoading, error } = useStreams();
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
        <Text color="red.500">Failed to load Streams.</Text>
      </Box>
    );
  }

  const leaves: Leaf[] = data?.results ?? [];

  if (leaves.length === 0) {
    return (
      <Box textAlign="center" py={16}>
        <VStack gap={3}>
          <Text fontSize="lg" fontWeight="medium" color={mutedColor}>
            Your Streams are quiet
          </Text>
          <Text fontSize="sm" color={mutedColor}>
            Follow other members to see their Leaves here.
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack gap={4} align="stretch">
      {leaves.map((leaf) => (
        <LeafCard key={leaf.id} leaf={leaf} />
      ))}
    </VStack>
  );
}

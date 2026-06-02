// components/crossroads/SeedCard.tsx

'use client';

import { Box, HStack, Text, Button, Badge, IconButton } from '@chakra-ui/react';
import { useColorModeValue } from '@mixtape/core';
import { IconArrowUpRight, IconTrash, IconLeaf, IconSeedlingFilled } from '@tabler/icons-react';
import { usePromoteSeedToLeaf, useDeleteSeed } from '@mixtape/api/hooks/useSeed';
import type { Seed } from '@mixtape/api/clients/writing/seedApi';

interface SeedCardProps {
  seed: Seed;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SeedCard({ seed }: SeedCardProps) {
  const promote = usePromoteSeedToLeaf();
  const deleteSeed = useDeleteSeed();

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const iconColor = useColorModeValue('gray.300', 'gray.600');

  const isPromoted = !!seed.promoted_to;
  const isSeed = seed.source === 'web';

  return (
    <Box
      p={3}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      bg={cardBg}
      opacity={isPromoted ? 0.6 : 1}
      position="relative"
    >
      {/* Type icon — top right */}
      <Box position="absolute" top={2} right={2} color={iconColor}>
        {isSeed ? (
          <IconSeedlingFilled size={14} />
        ) : (
          <IconLeaf size={14} />
        )}
      </Box>

      <Text fontSize="sm" lineClamp={3} pr={5}>
        {seed.body_text || (seed.kind === 'voice' ? '(Voice note)' : '(Empty)')}
      </Text>

      <HStack mt={2} justify="space-between">
        <HStack gap={2}>
          <Text fontSize="xs" color={mutedColor}>
            {formatTimeAgo(seed.created_at)}
          </Text>
          {seed.kind === 'voice' && (
            <Badge size="sm" variant="subtle" colorPalette="purple">
              voice
            </Badge>
          )}
          {isPromoted && (
            <Badge size="sm" variant="subtle" colorPalette="green">
              published
            </Badge>
          )}
        </HStack>

        <HStack gap={1}>
          {!isPromoted && (
            <Button
              size="xs"
              variant="ghost"
              onClick={() => promote.mutate(seed.id)}
              loading={promote.isPending}
            >
              <IconArrowUpRight size={14} />
              Add to Storyline
            </Button>
          )}
          <IconButton
            aria-label="Delete"
            size="xs"
            variant="ghost"
            color={mutedColor}
            _hover={{ color: 'red.500' }}
            onClick={() => deleteSeed.mutate(seed.id)}
            loading={deleteSeed.isPending}
          >
            <IconTrash size={12} />
          </IconButton>
        </HStack>
      </HStack>
    </Box>
  );
}

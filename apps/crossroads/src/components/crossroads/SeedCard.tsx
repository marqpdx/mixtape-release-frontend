// components/crossroads/SeedCard.tsx

'use client';

import { Box, HStack, Text, Button, Badge } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { IconArrowUpRight } from '@tabler/icons-react';
import { usePromoteSeedToLeaf } from '@mixtape/api/hooks/useSeed';
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

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  const isPromoted = !!seed.promoted_to;

  return (
    <Box
      p={3}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      bg={cardBg}
      opacity={isPromoted ? 0.6 : 1}
    >
      <Text fontSize="sm" lineClamp={3}>
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
      </HStack>
    </Box>
  );
}

// components/crossroads/LeafCard.tsx

'use client';

import { Box, VStack, HStack, Text, Badge, Image, IconButton } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { IconMessageCircle, IconLink, IconMicrophone, IconTrash } from '@tabler/icons-react';
import type { Leaf } from '@mixtape/core/types/leaf';
import NextLink from 'next/link';

interface LeafCardProps {
  leaf: Leaf;
  onDelete?: (leafId: string) => void;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function LeafBody({ leaf }: { leaf: Leaf }) {
  const linkBorderColor = useColorModeValue('gray.200', 'gray.600');
  const linkBg = useColorModeValue('gray.50', 'gray.750');
  const descColor = useColorModeValue('gray.500', 'gray.400');
  const voiceColor = useColorModeValue('purple.500', 'purple.300');

  // Image leaf — image-first layout (Instagram style)
  if (leaf.kind === 'image' && leaf.image_file) {
    return (
      <VStack align="stretch" gap={2}>
        <Box borderRadius="md" overflow="hidden">
          <Image
            src={leaf.image_file}
            alt=""
            w="full"
            aspectRatio={1}
            objectFit="cover"
          />
        </Box>
        {leaf.body_text && (
          <Text fontSize="sm" whiteSpace="pre-wrap">{leaf.body_text}</Text>
        )}
      </VStack>
    );
  }

  // Link leaf
  if (leaf.kind === 'link' && leaf.link_url) {
    return (
      <VStack align="stretch" gap={2}>
        {leaf.body_text && (
          <Text fontSize="sm">{leaf.body_text}</Text>
        )}
        <Box
          p={3}
          borderWidth="1px"
          borderColor={linkBorderColor}
          borderRadius="md"
          bg={linkBg}
        >
          <HStack gap={2}>
            <IconLink size={16} />
            <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
              {leaf.link_preview?.title || leaf.link_url}
            </Text>
          </HStack>
          {leaf.link_preview?.description && (
            <Text fontSize="xs" color={descColor} mt={1} lineClamp={2}>
              {leaf.link_preview.description}
            </Text>
          )}
        </Box>
      </VStack>
    );
  }

  // Voice leaf
  if (leaf.kind === 'voice') {
    return (
      <VStack align="stretch" gap={2}>
        <HStack gap={2} color={voiceColor}>
          <IconMicrophone size={16} />
          <Text fontSize="sm" fontStyle="italic">Voice note</Text>
        </HStack>
        {leaf.body_text && (
          <Text fontSize="sm">{leaf.body_text}</Text>
        )}
      </VStack>
    );
  }

  // Text leaf
  return (
    <VStack align="stretch" gap={2}>
      {leaf.body_text && (
        <Text fontSize="sm" whiteSpace="pre-wrap">{leaf.body_text}</Text>
      )}
    </VStack>
  );
}

function ReferenceCard({ leaf }: { leaf: Leaf }) {
  const borderColor = useColorModeValue('blue.200', 'blue.700');
  const bg = useColorModeValue('blue.50', 'blue.900');
  const labelColor = useColorModeValue('blue.600', 'blue.300');

  return (
    <Box
      mt={2}
      p={3}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      bg={bg}
    >
      <Text fontSize="xs" fontWeight="semibold" color={labelColor} mb={1}>
        {leaf.source_type || 'Reference'}
      </Text>
      <Text fontSize="sm" fontWeight="medium">
        {leaf.source_title || 'Linked content'}
      </Text>
    </Box>
  );
}

export default function LeafCard({ leaf, onDelete }: LeafCardProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const hoverBg = useColorModeValue('gray.50', 'gray.750');
  const borderColor = useColorModeValue('gray.100', 'gray.700');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const avatarBg = useColorModeValue('gray.200', 'gray.600');

  return (
    <NextLink href={`/leaf/${leaf.id}`} style={{ display: 'block' }}>
      <Box
        p={5}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        bg={cardBg}
        _hover={{ bg: hoverBg }}
        transition="background 0.15s"
        cursor="pointer"
        shadow="sm"
      >
      {/* Author header */}
      <HStack gap={3} mb={3}>
        <Box
          w="36px"
          h="36px"
          borderRadius="full"
          bg={avatarBg}
          overflow="hidden"
          flexShrink={0}
        >
          {leaf.author.avatar_url && (
            <Image src={leaf.author.avatar_url} alt="" w="full" h="full" objectFit="cover" />
          )}
        </Box>
        <Box flex={1}>
          <Text fontSize="sm" fontWeight="semibold">
            {leaf.author.display_name}
          </Text>
          <Text fontSize="xs" color={mutedColor}>
            @{leaf.author.username} · {formatTimeAgo(leaf.published_at || leaf.created_at)}
          </Text>
        </Box>
        {leaf.is_reference && (
          <Badge size="sm" variant="subtle" colorPalette="blue">
            curated
          </Badge>
        )}
      </HStack>

      {/* Caption for reference leafs */}
      {leaf.is_reference && leaf.caption && (
        <Text fontSize="sm" mb={2}>{leaf.caption}</Text>
      )}

      {/* Body content */}
      <LeafBody leaf={leaf} />

      {/* Reference source card */}
      {leaf.is_reference && <ReferenceCard leaf={leaf} />}

      {/* Footer */}
      <HStack mt={3} gap={4} justify="space-between">
        <HStack gap={1} color={mutedColor}>
          <IconMessageCircle size={16} />
          <Text fontSize="xs">
            {leaf.comment_count > 0 ? leaf.comment_count : 'Reply'}
          </Text>
        </HStack>
        {onDelete && (
          <IconButton
            aria-label="Delete entry"
            variant="ghost"
            size="xs"
            color={mutedColor}
            _hover={{ color: 'red.500' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(leaf.id);
            }}
          >
            <IconTrash size={14} />
          </IconButton>
        )}
      </HStack>
      </Box>
    </NextLink>
  );
}

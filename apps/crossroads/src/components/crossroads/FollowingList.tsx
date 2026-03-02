// components/crossroads/FollowingList.tsx

'use client';

import { Box, VStack, HStack, Text, Button, Spinner } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { IconUserMinus } from '@tabler/icons-react';
import { useFollowingList, useUnfollowUser } from '@mixtape/api/hooks/useFollow';
import NextLink from 'next/link';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function FollowingList() {
  const { data: following, isLoading } = useFollowingList();
  const unfollow = useUnfollowUser();

  const mutedColor = useColorModeValue('gray.500', 'gray.400');
  const hoverBg = useColorModeValue('gray.50', 'gray.750');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="sm" />
      </Box>
    );
  }

  if (!following || following.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Text fontSize="sm" color={mutedColor}>
          You're not following anyone yet.
        </Text>
        <Text fontSize="xs" color={mutedColor} mt={1}>
          Follow members to see their posts in your Streams feed.
        </Text>
      </Box>
    );
  }

  return (
    <VStack gap={0} align="stretch">
      <Text fontSize="xs" color={mutedColor} mb={3}>
        {following.length} {following.length === 1 ? 'person' : 'people'} in your Streams
      </Text>
      {following.map((entry) => (
        <HStack
          key={entry.id}
          gap={3}
          py={3}
          px={2}
          borderBottom="1px solid"
          borderColor={borderColor}
          _hover={{ bg: hoverBg }}
          transition="background 0.15s"
        >
          <Box flex={1} minW={0} asChild cursor="pointer">
            <NextLink href={`/members/${entry.username}`}>
              <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                {entry.display_name}
              </Text>
              <Text fontSize="xs" color={mutedColor}>
                @{entry.username} · since {formatDate(entry.followed_at)}
              </Text>
            </NextLink>
          </Box>
          <Button
            size="xs"
            variant="ghost"
            color={mutedColor}
            _hover={{ color: 'red.500' }}
            onClick={() => {
              if (window.confirm(`Unfollow ${entry.display_name}?`)) {
                unfollow.mutate(entry.user_id);
              }
            }}
            loading={unfollow.isPending}
          >
            <IconUserMinus size={14} />
          </Button>
        </HStack>
      ))}
    </VStack>
  );
}

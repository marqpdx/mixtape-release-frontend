// @mixtape/ui — shared canonical Storyline component.
// Moved from apps/crossroads/src/components/crossroads/WritingSection.tsx.
// Beacon removed from this component — pass it via the `beacon` prop from the
// consuming app so this package has no crossroads-specific dependency.

'use client';

import { type ReactNode, useState } from 'react';
import { VStack, HStack, Text, Button } from '@chakra-ui/react';
import { useColorModeValue } from '@mixtape/core';
import { IconPencilPlus } from '@tabler/icons-react';
import NextLink from 'next/link';
import FeedToggle, { type FeedMode } from './FeedToggle';
import StorylineFeed from './StorylineFeed';
import StreamsFeed from './StreamsFeed';
import FollowButton from './FollowButton';

interface WritingSectionProps {
  showStreams?: boolean;
  showFollowButton?: boolean;
  userId?: string;
  /** Optional slot — consuming app can pass <Beacon /> or any node here. */
  beacon?: ReactNode;
  isOwner?: boolean;
  currentUsername?: string;
}

export default function WritingSection({
  showStreams = true,
  showFollowButton = false,
  userId,
  beacon,
  isOwner = true,
  currentUsername,
}: WritingSectionProps) {
  const [feedMode, setFeedMode] = useState<FeedMode>(isOwner ? 'streams' : 'storyline');
  const headingColor = useColorModeValue('gray.700', 'gray.300');
  const mutedColor = useColorModeValue('gray.500', 'gray.400');

  return (
    <VStack gap={6} align="stretch">
      <HStack justify="space-between" align="center">
        {isOwner ? (
          showStreams ? (
            <FeedToggle activeMode={feedMode} onModeChange={setFeedMode} />
          ) : (
            <FeedToggle activeMode="storyline" onModeChange={() => {}} />
          )
        ) : (
          <Text fontSize="xl" fontWeight="semibold" color={headingColor}>
            Storylines
          </Text>
        )}
        <HStack gap={2}>
          {!isOwner && currentUsername && (
            <Button
              asChild
              size="sm"
              variant="outline"
            >
              <NextLink href={`/members/${currentUsername}`}>
                <IconPencilPlus size={16} />
                Add to My Storyline
              </NextLink>
            </Button>
          )}
          {showFollowButton && userId && (
            <FollowButton userId={userId} />
          )}
        </HStack>
      </HStack>
      {isOwner && feedMode === 'streams' && (
        <Text fontSize="sm" color={mutedColor} mt={-3}>
          See what the people you follow are posting, then jump back to your own Storyline when you want to publish.
        </Text>
      )}
      {isOwner && feedMode === 'streams' ? (
        <StreamsFeed />
      ) : (
        <StorylineFeed />
      )}
      {beacon}
    </VStack>
  );
}

// components/crossroads/WritingSection.tsx

'use client';

import { useState } from 'react';
import { VStack, HStack, Text, Button } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { IconPencilPlus } from '@tabler/icons-react';
import NextLink from 'next/link';
import FeedToggle, { type FeedMode } from './FeedToggle';
import StorylineFeed from './StorylineFeed';
import StreamsFeed from './StreamsFeed';
import FollowButton from './FollowButton';
import { Beacon } from './Beacon';

interface WritingSectionProps {
  showStreams?: boolean;
  showFollowButton?: boolean;
  userId?: string;
  beaconKey?: string;
  isOwner?: boolean;
  currentUsername?: string;
}

export default function WritingSection({
  showStreams = true,
  showFollowButton = false,
  userId,
  beaconKey,
  isOwner = true,
  currentUsername,
}: WritingSectionProps) {
  const [feedMode, setFeedMode] = useState<FeedMode>('storyline');
  const headingColor = useColorModeValue('gray.700', 'gray.300');

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
          <Text fontSize="lg" fontWeight="semibold" color={headingColor}>
            Storyline
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
      {isOwner && feedMode === 'streams' ? (
        <StreamsFeed />
      ) : (
        <StorylineFeed />
      )}
      {beaconKey && (
        <Beacon beaconKey={beaconKey} areaLabel="Writing" />
      )}
    </VStack>
  );
}

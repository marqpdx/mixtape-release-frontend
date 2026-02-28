// components/crossroads/WritingSection.tsx

'use client';

import { useState } from 'react';
import { VStack, HStack } from '@chakra-ui/react';
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
}

export default function WritingSection({
  showStreams = true,
  showFollowButton = false,
  userId,
  beaconKey,
}: WritingSectionProps) {
  const [feedMode, setFeedMode] = useState<FeedMode>('storyline');

  return (
    <VStack gap={6} align="stretch">
      <HStack justify="space-between" align="center">
        {showStreams ? (
          <FeedToggle activeMode={feedMode} onModeChange={setFeedMode} />
        ) : (
          <FeedToggle activeMode="storyline" onModeChange={() => {}} />
        )}
        {showFollowButton && userId && (
          <FollowButton userId={userId} />
        )}
      </HStack>
      {feedMode === 'storyline' ? (
        <StorylineFeed />
      ) : (
        <StreamsFeed />
      )}
      {beaconKey && (
        <Beacon beaconKey={beaconKey} areaLabel="Writing" />
      )}
    </VStack>
  );
}

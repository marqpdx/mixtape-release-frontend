// apps/crossroads/src/app/(main)/(authenticated)/members/[username]/page.tsx

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { HStack, VStack } from '@chakra-ui/react';
import { useAuth } from '@/lib/auth/AuthContext';
import MyCrossroadsLayout from '@/components/crossroads/MyCrossroadsLayout';
import FeedToggle, { type FeedMode } from '@/components/crossroads/FeedToggle';
import StorylineFeed from '@/components/crossroads/StorylineFeed';
import StreamsFeed from '@/components/crossroads/StreamsFeed';
import Composer from '@/components/crossroads/Composer';
import FollowButton from '@/components/crossroads/FollowButton';
import { Beacon } from '@/components/crossroads/Beacon';
import { fetchPublicMemberProfile } from '@mixtape/api/clients/public/publicApi';

export default function MyCrossroadsPage() {
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuth();
  const [feedMode, setFeedMode] = useState<FeedMode>('storyline');

  const isOwner = user?.username === username;

  const { data: profile } = useQuery({
    queryKey: ['public-member-profile', username],
    queryFn: () => fetchPublicMemberProfile(username),
    enabled: !isOwner && !!username,
  });

  const narrativePane = (
    <VStack gap={6} align="stretch">
      <HStack justify="space-between" align="center">
        <FeedToggle activeMode={feedMode} onModeChange={setFeedMode} />
        {!isOwner && user && profile?.user_id && (
          <FollowButton userId={profile.user_id} />
        )}
      </HStack>
      {feedMode === 'storyline' ? (
        <StorylineFeed />
      ) : (
        <StreamsFeed />
      )}
      <Beacon
        beaconKey="my_crossroads_v1"
        areaLabel="My Crossroads"
      />
    </VStack>
  );

  const composerPane = <Composer />;

  return (
    <MyCrossroadsLayout
      narrativePane={narrativePane}
      composerPane={composerPane}
      isOwner={isOwner}
    />
  );
}

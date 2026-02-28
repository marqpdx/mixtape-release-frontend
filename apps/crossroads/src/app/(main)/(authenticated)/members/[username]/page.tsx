// apps/crossroads/src/app/(main)/(authenticated)/members/[username]/page.tsx

'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import MyCrossroadsLayout from '@/components/crossroads/MyCrossroadsLayout';
import WritingSection from '@/components/crossroads/WritingSection';
import Composer from '@/components/crossroads/Composer';
import { ComposerProvider } from '@/components/crossroads/ComposerContext';
import { fetchPublicMemberProfile } from '@mixtape/api/clients/public/publicApi';

export default function MyCrossroadsPage() {
  const params = useParams();
  const username = params.username as string;
  const { user } = useAuth();

  const isOwner = user?.username === username;

  const { data: profile } = useQuery({
    queryKey: ['public-member-profile', username],
    queryFn: () => fetchPublicMemberProfile(username),
    enabled: !isOwner && !!username,
  });

  const narrativePane = (
    <WritingSection
      showStreams
      showFollowButton={!isOwner && !!user}
      userId={profile?.user_id}
      beaconKey="my_crossroads_v1"
    />
  );

  const composerPane = <Composer />;

  return (
    <ComposerProvider>
      <MyCrossroadsLayout
        narrativePane={narrativePane}
        composerPane={composerPane}
        isOwner={isOwner}
      />
    </ComposerProvider>
  );
}

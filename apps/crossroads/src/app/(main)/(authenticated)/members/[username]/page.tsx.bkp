// apps/crossroads/src/app/(main)/(authenticated)/members/[username]/page.tsx

'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import MyCrossroadsLayout from '@/components/crossroads/MyCrossroadsLayout';
import WritingSection from '@/components/crossroads/WritingSection';
import ComposerPane from '@/components/crossroads/ComposerPane';
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

  const writingBeaconKey =
    user?.is_superuser
      ? process.env.NEXT_PUBLIC_MY_CROSSROADS_BEACON_KEY
      : undefined;

  const narrativePane = (
    <WritingSection
      showStreams={isOwner}
      showFollowButton={!isOwner && !!user}
      userId={profile?.user_id}
      beaconKey={writingBeaconKey}
      isOwner={isOwner}
      currentUsername={user?.username}
    />
  );

  const composerPane = <ComposerPane />;

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

"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthContext";
import MyCrossroadsLayout from "@/components/crossroads/MyCrossroadsLayout";
import { WritingSection, ComposerPane, ComposerProvider } from "@mixtape/ui";
import { Beacon } from "@/components/crossroads/Beacon";
import { fetchPublicMemberProfile } from "@mixtape/api/clients/public/publicApi";

interface StorylineExperienceProps {
  username: string;
}

export default function StorylineExperience({ username }: StorylineExperienceProps) {
  const { user } = useAuth();
  const isOwner = user?.username === username;

  const { data: profile } = useQuery({
    queryKey: ["public-member-profile", username],
    queryFn: () => fetchPublicMemberProfile(username),
    enabled: !!username,
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
      beacon={writingBeaconKey ? <Beacon beaconKey={writingBeaconKey} areaLabel="Writing" /> : undefined}
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

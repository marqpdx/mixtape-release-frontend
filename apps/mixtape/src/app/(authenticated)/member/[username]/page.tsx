// apps/mixtape/src/app/(authenticated)/member/[username]/page.tsx

"use client";

import { useCallback, useEffect } from "react";
import { Text } from "@chakra-ui/react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useMemberProfile } from "@hooks/member/useMemberProfile";

import DashboardLayout, { WorkAreaProps } from "@components/common/DashboardLayout";
import MemberWorkArea from "@components/dashboard/member/MemberWorkArea";
import { MEMBER_HUB_CONFIG } from "@components/dashboard/member/memberHubConfig";
import ProfileHeaderWrapper from "@components/profiles/ProfileHeaderWrapper";

export default function MemberHubPage() {
  const params = useParams();
  const usernameParam = params?.username as string | undefined;

  const { user: identity, isLoading: identityLoading } = useAuth();
  const username = usernameParam || identity?.username;
  const { member, isLoading: memberLoading } = useMemberProfile(username);
  const groupsLoading = false;

  const isOwner = Boolean(identity && member && identity.username === member.username);
  const headerTitle = member?.display_name || member?.username || "Member";
  const headerSubtitle = member?.username ? `@${member.username}` : undefined;

  const WorkAreaWrapper = useCallback(
    (props: WorkAreaProps) => {
      if (!identity) return null;

      return (
        <MemberWorkArea
          {...props}
          identity={identity}
        />
      );
    },
    [identity]
  );

  useEffect(() => {
    if (member) {
      document.title = `${headerTitle} - Mixtape Crossroads`;
    }
  }, [member, headerTitle]);

  if (identityLoading || memberLoading) {
    return <Text>Loading your hub...</Text>;
  }

  if (!identity) {
    return <Text>Authentication required...</Text>;
  }

  return (
    <DashboardLayout
      title={headerTitle}
      header={
        <ProfileHeaderWrapper
          mode={isOwner ? "self" : "public"}
          title={headerTitle}
          subtitle={headerSubtitle}
          bannerImageUrl={member?.background_image_url || null}
          avatarImageUrl={member?.profile_image_url || member?.avatar_url || null}
          avatarFallbackText={member?.display_name?.charAt(0) || member?.username?.charAt(0) || "?"}
        />
      }
      menuItems={MEMBER_HUB_CONFIG.menuItems}
      defaultSection={MEMBER_HUB_CONFIG.defaultSection}
      localStorageKey={MEMBER_HUB_CONFIG.localStorageKey}
      WorkAreaComponent={WorkAreaWrapper}
      workAreaProps={{}}
      loading={identityLoading || groupsLoading}
    />
  );
}

// apps/mixtape/src/app/(authenticated)/member/[username]/edit/page.tsx

"use client";

import { Container, Text } from "@chakra-ui/react";
import { useParams } from "next/navigation";
import { useMyMemberProfile } from "@hooks/member/useMemberProfile";
import MemberProfileEdit from "@components/dashboard/member/MemberProfileEdit";
import ProfileHeaderWrapper from "@components/profiles/ProfileHeaderWrapper";

export default function MemberEditPage() {
  const params = useParams();
  const { member, isLoading } = useMyMemberProfile();
  void params;

  if (isLoading) {
    return <Text>Loading profile...</Text>;
  }

  return (
    <>
      <ProfileHeaderWrapper
        mode="self"
        title="Edit Profile"
        subtitle={member?.username ? `@${member.username}` : undefined}
        bannerImageUrl={null}
        avatarImageUrl={member?.avatar_url || null}
        avatarFallbackText={member?.display_name?.charAt(0) || member?.username?.charAt(0) || "?"}
      />
      <Container maxW="5xl" py={8}>
        <MemberProfileEdit />
      </Container>
    </>
  );
}

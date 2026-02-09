// apps/mixtape/src/components/members/layout/MemberLanding.tsx

import { useColorModeValue } from "@components/ui/color-mode";
import { Box, Container } from "@chakra-ui/react";
import ProfileHeaderWrapper from "@components/profiles/ProfileHeaderWrapper";
import type { MemberProfile } from "@mixtape/core/types/memberTypes";
import MemberTabs from "../tabs/MemberTabs";

interface MemberLandingProps {
  member: MemberProfile;
}

export default function MemberLanding({ member }: MemberLandingProps) {
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const title = member.display_name || member.username;
  const subtitle = member.username ? `@${member.username}` : undefined;

  return (
    <Box className="member-landing" bg={bgColor} minH="100vh">
      <ProfileHeaderWrapper
        mode="public"
        title={title}
        subtitle={subtitle}
        bannerImageUrl={member.background_image_url || null}
        avatarImageUrl={member.profile_image_url || member.avatar_url || null}
        avatarFallbackText={title.charAt(0)}
      />

      <Container maxW="7xl" py={8}>
        <MemberTabs member={member} />
      </Container>
    </Box>
  );
}

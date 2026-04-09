"use client";

import { useMemberProfile } from "@hooks/member/useMemberProfile";
import MemberLanding from "@components/members/layout/MemberLanding";
import { Box, Text } from "@chakra-ui/react";

export default function MemberLandingWrapper({ username }: { username: string }) {
  const { member, isLoading } = useMemberProfile(username);

  if (isLoading) return <Box py={20}><Text textAlign="center">Loading...</Text></Box>;
  if (!member) return <Box py={20}><Text textAlign="center">Member not found.</Text></Box>;

  return <MemberLanding member={member} />;
}

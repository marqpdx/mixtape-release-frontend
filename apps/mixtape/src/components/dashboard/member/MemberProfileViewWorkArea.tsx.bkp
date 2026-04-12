// apps/mixtape/src/components/dashboard/member/MemberProfileViewWorkArea.tsx

"use client";

import { Box, Text, VStack, HStack, Heading, Badge } from "@chakra-ui/react";
import { useMyMemberProfile } from "@hooks/member/useMemberProfile";
import { useColorModeValue } from "@components/ui/color-mode";
import { MixtapeAlert } from "@/components/ui/alerts";
import { TipTapRenderer } from "@components/tiptap/TipTapRenderer";

export default function MemberProfileViewWorkArea() {
  const { member, isLoading, error } = useMyMemberProfile();
  const muted = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  if (isLoading) {
    return <Text>Loading profile...</Text>;
  }

  if (error) {
    return (
      <MixtapeAlert
        status="error"
        title="Error Loading Profile"
        description={error.message || "Unable to load your profile"}
      />
    );
  }

  if (!member) {
    return (
      <MixtapeAlert
        status="warning"
        title="Profile Not Found"
        description="Your member profile could not be found."
      />
    );
  }

  const displayName = member.display_name || member.username;

  return (
    <VStack gap={6} align="stretch">
      <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" p={6}>
        <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="lg">{displayName}</Heading>
            <Text color={muted}>@{member.username}</Text>
          </Box>
          <Badge colorScheme="green">Member</Badge>
        </HStack>

        {member.quick_intro && (
          <Text mt={4} color={muted}>
            {member.quick_intro}
          </Text>
        )}
      </Box>

      <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="xl" p={6}>
        <Heading size="md" mb={3}>
          Bio
        </Heading>
        {member.bio_json && (member.bio_json as { content?: unknown[] }).content?.length ? (
          <TipTapRenderer content={member.bio_json as never} />
        ) : (
          <Text color={muted}>No bio yet.</Text>
        )}
      </Box>
    </VStack>
  );
}

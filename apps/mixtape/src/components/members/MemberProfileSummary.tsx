// apps/mixtape/src/components/members/MemberProfileSummary.tsx

"use client";

import { Box, Text, VStack, HStack, Heading, Badge } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { TipTapRenderer } from "@components/tiptap/TipTapRenderer";
import type { MemberProfile } from "@mixtape/core/types/memberTypes";

interface MemberProfileSummaryProps {
  member: MemberProfile;
}

export default function MemberProfileSummary({ member }: MemberProfileSummaryProps) {
  const muted = useColorModeValue("gray.600", "gray.400");
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");

  const displayName = member.display_name || member.username;
  const bioContent =
    member.bio_json && (member.bio_json as { content?: unknown[] }).content?.length
      ? member.bio_json
      : null;

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
        {bioContent ? (
          <TipTapRenderer content={bioContent as never} />
        ) : (
          <Text color={muted}>No bio yet.</Text>
        )}
      </Box>
    </VStack>
  );
}

// apps/mixtape/src/components/members/MemberProfileSummary.tsx

"use client";

import { Box, Text, VStack, HStack, Heading, Badge, Separator } from "@chakra-ui/react";
import { IconMapPin, IconBriefcase } from "@tabler/icons-react";
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

        {(member.practice_area || member.location) && (
          <HStack mt={3} gap={4} flexWrap="wrap">
            {member.practice_area && (
              <HStack gap={1} fontSize="sm" color={muted}>
                <IconBriefcase size={14} />
                <Text>{member.practice_area}</Text>
              </HStack>
            )}
            {member.location && (
              <HStack gap={1} fontSize="sm" color={muted}>
                <IconMapPin size={14} />
                <Text>{member.location}</Text>
              </HStack>
            )}
          </HStack>
        )}

        {member.quick_intro && (
          <Text mt={4} color={muted}>
            {member.quick_intro}
          </Text>
        )}

        {member.right_now && (
          <>
            <Separator mt={4} />
            <Text mt={3} fontSize="sm" color={muted} fontStyle="italic">
              Right now: {member.right_now}
            </Text>
          </>
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

// apps/mixtape/src/components/dashboard/member/MemberProfileViewWorkArea.tsx

"use client";

import NextLink from "next/link";
import { Box, Text, VStack, HStack, Heading, Badge, Button, Link } from "@chakra-ui/react";
import { IconArrowLeft, IconExternalLink } from "@tabler/icons-react";
import { useMyMemberProfile } from "@hooks/member/useMemberProfile";
import { useColorModeValue } from "@components/ui/color-mode";
import { MixtapeAlert } from "@/components/ui/alerts";
import { TipTapRenderer } from "@components/tiptap/TipTapRenderer";

function splitProfileList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

interface Props {
  setActiveSection: (section: string, params?: Record<string, string>) => void;
  sectionParams?: Record<string, string>;
  username: string;
}

export default function MemberProfileViewWorkArea({ setActiveSection, sectionParams, username }: Props) {
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
  const skills = splitProfileList(member.skills);
  const workAreas = splitProfileList(member.work_areas);
  const returnTo = sectionParams?.returnTo || "overview";

  return (
    <VStack gap={6} align="stretch">
      {/* Top chrome */}
      <HStack justify="space-between" align="center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveSection(returnTo)}
        >
          <IconArrowLeft size={15} />
          return
        </Button>
        <HStack gap={3}>
          <Link as={NextLink} href={`/member/handle/${username}`} display="flex" alignItems="center" gap={1} fontSize="sm" color={muted}>
            Full Profile
            <IconExternalLink size={14} />
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveSection("edit-profile")}
          >
            Edit Profile
          </Button>
        </HStack>
      </HStack>

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

        {member.right_now && (
          <Text mt={3} fontSize="sm" color={muted} fontStyle="italic">
            Right now: {member.right_now}
          </Text>
        )}

        {(skills.length > 0 || workAreas.length > 0) && (
          <VStack mt={4} gap={3} align="stretch">
            {workAreas.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" color={muted} mb={2}>
                  Work Areas
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  {workAreas.map((area) => (
                    <Badge key={area} variant="subtle" colorScheme="blue">
                      {area}
                    </Badge>
                  ))}
                </HStack>
              </Box>
            )}
            {skills.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="medium" color={muted} mb={2}>
                  Skills
                </Text>
                <HStack gap={2} flexWrap="wrap">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="subtle" colorScheme="green">
                      {skill}
                    </Badge>
                  ))}
                </HStack>
              </Box>
            )}
          </VStack>
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

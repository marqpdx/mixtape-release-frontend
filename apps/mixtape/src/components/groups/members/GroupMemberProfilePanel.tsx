// apps/mixtape/src/components/groups/members/GroupMemberProfilePanel.tsx

"use client";

import {
  Box,
  Flex,
  HStack,
  Heading,
  Text,
  Badge,
  VStack,
  Button,
  IconButton,
  Spinner,
  Avatar,
  AvatarGroup,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { IconChevronLeft, IconChevronRight, IconArrowLeft, IconExternalLink } from "@tabler/icons-react";
import Image from "next/image";
import { useMemberProfile } from "@mixtape/api/hooks/member/useMemberProfile";
import { TipTapRenderer } from "@components/tiptap/TipTapRenderer";

function splitList(value?: string | null): string[] {
  if (!value) return [];
  return value.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
}

interface GroupMemberProfilePanelProps {
  username: string;
  displayName: string;
  avatarUrl?: string;
  onReturn: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  onViewComplete: () => void;
}

export function GroupMemberProfilePanel({
  username,
  displayName,
  avatarUrl,
  onReturn,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  onViewComplete,
}: GroupMemberProfilePanelProps) {
  const { member, isLoading, error } = useMemberProfile(username);

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  const profile = member;
  const skills = splitList(profile?.skills);
  const workAreas = splitList(profile?.work_areas);
  const effectiveAvatar = profile?.profile_image || profile?.avatar_url || avatarUrl;
  const effectiveName = profile?.display_name || displayName;

  return (
    <VStack align="stretch" gap={4}>
      {/* Navigation bar */}
      <Flex justify="space-between" align="center">
        <Button
          size="sm"
          variant="ghost"
          onClick={onReturn}
          color={muted}
        >
          <IconArrowLeft size={16} />
          <Text ml={1}>Return to members</Text>
        </Button>

        <HStack gap={2}>
          <IconButton
            aria-label="Previous member"
            size="sm"
            variant="ghost"
            onClick={onPrev}
            disabled={!hasPrev}
            color={muted}
          >
            <IconChevronLeft size={16} />
          </IconButton>
          <IconButton
            aria-label="Next member"
            size="sm"
            variant="ghost"
            onClick={onNext}
            disabled={!hasNext}
            color={muted}
          >
            <IconChevronRight size={16} />
          </IconButton>
          <Button
            size="sm"
            variant="outline"
            onClick={onViewComplete}
          >
            <IconExternalLink size={14} />
            <Text ml={1}>View complete profile</Text>
          </Button>
        </HStack>
      </Flex>

      {/* Profile content */}
      {isLoading ? (
        <Box textAlign="center" py={16}>
          <Spinner size="lg" color="green.500" />
          <Text mt={3} color={muted}>Loading profile…</Text>
        </Box>
      ) : error ? (
        <Box
          bg={cardBg}
          border="1px solid"
          borderColor={cardBorder}
          borderRadius="xl"
          p={6}
          textAlign="center"
        >
          <Text color={muted}>Profile unavailable.</Text>
        </Box>
      ) : (
        <VStack gap={4} align="stretch">
          {/* Header card */}
          <Box
            bg={cardBg}
            border="1px solid"
            borderColor={cardBorder}
            borderRadius="xl"
            p={6}
          >
            <HStack gap={5} align="start" flexWrap="wrap">
              {/* Avatar */}
              <Box flexShrink={0}>
                {effectiveAvatar ? (
                  <Box
                    w="80px"
                    h="80px"
                    borderRadius="xl"
                    overflow="hidden"
                    border="2px solid"
                    borderColor="green.200"
                  >
                    <Image
                      src={effectiveAvatar}
                      alt={effectiveName}
                      width={80}
                      height={80}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                ) : (
                  <AvatarGroup>
                    <Avatar.Root size="2xl">
                      <Avatar.Fallback fontSize="2xl">
                        {effectiveName.charAt(0).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                  </AvatarGroup>
                )}
              </Box>

              {/* Identity */}
              <Box flex={1}>
                <Heading size="lg">{effectiveName}</Heading>
                <Text color={muted} fontFamily="mono">@{username}</Text>
                {profile?.practice_area && (
                  <Text fontSize="sm" color={muted} mt={1}>
                    {profile.practice_area}
                  </Text>
                )}
                {profile?.location && (
                  <Text fontSize="sm" color={muted}>
                    {profile.location}
                  </Text>
                )}
              </Box>
            </HStack>

            {profile?.quick_intro && (
              <Text mt={4} color={muted} lineHeight="tall">
                {profile.quick_intro}
              </Text>
            )}

            {profile?.right_now && (
              <Text mt={3} fontSize="sm" color={muted} fontStyle="italic">
                Right now: {profile.right_now}
              </Text>
            )}

            {(workAreas.length > 0 || skills.length > 0) && (
              <VStack mt={5} gap={3} align="stretch">
                {workAreas.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color={muted} mb={2}>
                      Work Areas
                    </Text>
                    <HStack gap={2} flexWrap="wrap">
                      {workAreas.map((a) => (
                        <Badge key={a} variant="subtle" colorPalette="blue">{a}</Badge>
                      ))}
                    </HStack>
                  </Box>
                )}
                {skills.length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color={muted} mb={2}>
                      Skills
                    </Text>
                    <HStack gap={2} flexWrap="wrap">
                      {skills.map((s) => (
                        <Badge key={s} variant="subtle" colorPalette="green">{s}</Badge>
                      ))}
                    </HStack>
                  </Box>
                )}
              </VStack>
            )}
          </Box>

          {/* Bio card */}
          {profile && (
            <Box
              bg={cardBg}
              border="1px solid"
              borderColor={cardBorder}
              borderRadius="xl"
              p={6}
            >
              <Heading size="sm" mb={3} color={muted}>
                Bio
              </Heading>
              {profile.bio_json &&
              (profile.bio_json as { content?: unknown[] }).content?.length ? (
                <TipTapRenderer content={profile.bio_json as never} />
              ) : (
                <Text color={muted} fontSize="sm">
                  No bio yet.
                </Text>
              )}
            </Box>
          )}
        </VStack>
      )}
    </VStack>
  );
}

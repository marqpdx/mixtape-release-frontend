// apps/mixtape/src/components/groups/members/GroupMemberProfilePanel.tsx

"use client";

import {
  Box,
  Checkbox,
  Flex,
  HStack,
  Heading,
  Input,
  Text,
  Badge,
  Textarea,
  VStack,
  Button,
  IconButton,
  Spinner,
  Avatar,
  AvatarGroup,
} from "@chakra-ui/react";
import { useState } from "react";
import { useColorModeValue } from "@components/ui/color-mode";
import { IconChevronLeft, IconChevronRight, IconArrowLeft, IconExternalLink, IconMapPin, IconMail } from "@tabler/icons-react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/AuthContext";
import { useMemberProfile } from "@mixtape/api/hooks/member/useMemberProfile";
import { contactMember } from "@mixtape/api/clients/member/memberApi";
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
  const { user: authUser } = useAuth();
  const { member, isLoading, error } = useMemberProfile(username);

  const [contactOpen, setContactOpen] = useState(false);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState(authUser?.email ?? "");
  const [saveEmail, setSaveEmail] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentOk, setSentOk] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const muted = useColorModeValue("gray.600", "gray.400");

  const showSaveEmailPrompt = !authUser?.email && senderEmail.trim().length > 0;

  async function handleSendContact() {
    if (!senderEmail.trim() || !message.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      await contactMember(username, {
        sender_name: senderName.trim(),
        sender_email: senderEmail.trim(),
        message: message.trim(),
        save_email: saveEmail,
      });
      setSentOk(true);
    } catch {
      setSendError("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const profile = member;
  const skills = splitList(profile?.skills);
  const workAreas = splitList(profile?.work_areas);
  const effectiveAvatar = profile?.profile_image_url || profile?.avatar_url || avatarUrl;
  const effectiveBanner = profile?.background_image_url || null;
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
            overflow="hidden"
          >
            <Box
              minH="160px"
              bg={effectiveBanner ? undefined : "gray.100"}
              backgroundImage={effectiveBanner ? `linear-gradient(to bottom, rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0.72)), url(${effectiveBanner})` : undefined}
              backgroundSize="cover"
              backgroundPosition="center"
              backgroundRepeat="no-repeat"
            />
            <Box p={6} pt={effectiveBanner ? 0 : 6}>
            <HStack gap={5} align="start" flexWrap="wrap" mt={effectiveBanner ? "-40px" : 0}>
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
                    bg={cardBg}
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
              <Box flex={1} pt={effectiveBanner ? 10 : 0}>
                <Heading size="lg">{effectiveName}</Heading>
                <Text color={muted} fontFamily="mono">@{username}</Text>
                {profile?.practice_area && (
                  <Text fontSize="sm" color={muted} mt={1}>
                    {profile.practice_area}
                  </Text>
                )}
                {profile?.location && (
                  <HStack gap={1} mt={0.5}>
                    <IconMapPin size={13} color="var(--chakra-colors-gray-400)" />
                    <Text fontSize="sm" color={muted}>{profile.location}</Text>
                  </HStack>
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

            {(profile?.who_are_you || profile?.why_are_you_here) && (
              <VStack mt={4} gap={3} align="stretch">
                {profile.who_are_you && (
                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" color={muted} mb={1} textTransform="uppercase" letterSpacing="wide">
                      Who I am
                    </Text>
                    <Text fontSize="sm">{profile.who_are_you}</Text>
                  </Box>
                )}
                {profile.why_are_you_here && (
                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" color={muted} mb={1} textTransform="uppercase" letterSpacing="wide">
                      Why I'm here
                    </Text>
                    <Text fontSize="sm">{profile.why_are_you_here}</Text>
                  </Box>
                )}
              </VStack>
            )}

            {profile?.quick_link && (
              <Box mt={3}>
                <Box
                  as="a"
                  href={profile.quick_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  display="inline-flex"
                  alignItems="center"
                  gap={1}
                  fontSize="sm"
                  color="blue.400"
                  _hover={{ textDecoration: "underline" }}
                >
                  <IconExternalLink size={14} />
                  {profile.quick_link.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </Box>
              </Box>
            )}

            {/* Email Me */}
            {username !== authUser?.username && (
              <Box mt={4}>
                {!contactOpen ? (
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="gray"
                    onClick={() => setContactOpen(true)}
                  >
                    <IconMail size={14} />
                    <Text ml={1}>Email Me</Text>
                  </Button>
                ) : sentOk ? (
                  <Box fontSize="sm" color="green.400">Message sent.</Box>
                ) : (
                  <VStack gap={2} align="stretch" pt={1}>
                    <HStack gap={2}>
                      <Input
                        size="sm"
                        placeholder="Your name"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                      />
                      <Input
                        size="sm"
                        placeholder="Your email"
                        type="email"
                        value={senderEmail}
                        onChange={(e) => setSenderEmail(e.target.value)}
                        required
                      />
                    </HStack>
                    {showSaveEmailPrompt && (
                      <HStack gap={2}>
                        <Checkbox.Root
                          size="sm"
                          checked={saveEmail}
                          onCheckedChange={(d) => setSaveEmail(!!d.checked)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize="xs">Save as my email</Checkbox.Label>
                        </Checkbox.Root>
                      </HStack>
                    )}
                    <Textarea
                      size="sm"
                      placeholder="Your message…"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                    />
                    {sendError && <Text fontSize="xs" color="red.400">{sendError}</Text>}
                    <HStack gap={2} justify="flex-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        colorPalette="gray"
                        onClick={() => setContactOpen(false)}
                        disabled={sending}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        colorPalette="blue"
                        onClick={() => void handleSendContact()}
                        loading={sending}
                        disabled={!senderEmail.trim() || !message.trim()}
                      >
                        Send
                      </Button>
                    </HStack>
                  </VStack>
                )}
              </Box>
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

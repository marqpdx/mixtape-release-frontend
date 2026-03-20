"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Image,
  Spinner,
  Text,
  VStack,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  fetchPublicGroup,
  fetchAdmissionStatus,
  joinGroup,
  requestToJoinGroup,
} from "@mixtape/api/clients/public/publicApi";
import type {
  PublicGroupDetail,
  AdmissionStatus,
} from "@mixtape/api/clients/public/publicApi";
import NextLink from "next/link";
import { GroupOnboardingTour } from "@/features/onboarding/GroupOnboardingTour";

export default function GroupPublicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [group, setGroup] = useState<PublicGroupDetail | null>(null);
  const [admissionStatus, setAdmissionStatus] = useState<AdmissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardBg = useColorModeValue("gray.50", "gray.800");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const avatarFallbackBg = useColorModeValue("gray.300", "gray.600");
  const ctaBg = useColorModeValue("gray.50", "gray.800");
  const ctaBorderColor = useColorModeValue("gray.200", "gray.700");
  const accentBg = useColorModeValue("white", "gray.900");

  useEffect(() => {
    async function load() {
      try {
        const [data, status] = await Promise.all([
          fetchPublicGroup(slug),
          fetchAdmissionStatus(slug),
        ]);
        setGroup(data);
        setAdmissionStatus(status);
      } catch {
        setError("Group not found.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  // Re-fetch admission status once auth finishes loading.
  // Needed when navigating from a different app (e.g. after invite acceptance):
  // the in-memory JWT is lost on full-page load and is only restored after
  // useAuth() runs checkAuth() via the httpOnly refresh cookie. The initial
  // fetchAdmissionStatus() above races against this and often loses, returning
  // an anonymous (is_member: false) result. This effect corrects it.
  useEffect(() => {
    if (authLoading) return;
    fetchAdmissionStatus(slug)
      .then(setAdmissionStatus)
      .catch(() => {});
  }, [slug, authLoading]);

  if (loading) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Spinner size="lg" />
      </Box>
    );
  }

  if (error || !group) {
    return (
      <Box px="6" py="20" textAlign="center">
        <Text color={mutedColor}>{error || "Group not found."}</Text>
      </Box>
    );
  }

  // Derive emblem colors for accent
  const emblemBg = group.emblem?.bg || "#5b8a6f";
  const emblemFg = group.emblem?.fg || "#ffffff";

  const emblemUrl =
    group.emblem?.image_url || group.profile_image_url || undefined;

  return (
    <Box>
      <GroupOnboardingTour
        groupSlug={slug}
        groupTitle={group.title}
        groupEmblemUrl={emblemUrl}
        isMember={admissionStatus?.is_member ?? false}
      />
      {/* Background image banner */}
      {group.background_image_url ? (
        <Box w="full" h="220px" overflow="hidden" mb="-40px">
          <Image
            src={group.background_image_url}
            alt=""
            w="full"
            h="full"
            objectFit="cover"
          />
        </Box>
      ) : (
        // Color accent banner from emblem
        <Box
          w="full"
          h="120px"
          mb="-40px"
          background={`linear-gradient(135deg, ${emblemBg}40 0%, ${emblemBg}15 100%)`}
        />
      )}

      <Box
        maxW="3xl"
        mx="auto"
        px="6"
        pt={group.background_image_url ? "0" : "0"}
        pb="10"
      >
        {/* Header Block */}
        <HStack gap="4" align="end" mb="4">
          {/* Emblem */}
          <EmblemAvatar
            group={group}
            emblemBg={emblemBg}
            emblemFg={emblemFg}
            avatarFallbackBg={avatarFallbackBg}
            cardBg={accentBg}
          />

          <VStack gap="0" align="start">
            <Heading size="2xl">{group.title}</Heading>
            <HStack gap="2">
              <Badge
                variant="subtle"
                size="sm"
                borderRadius="full"
                px="3"
                py="1"
                textTransform="capitalize"
              >
                {group.group_type}
              </Badge>
              <Text color={mutedColor} fontSize="sm">
                {group.member_count}{" "}
                {group.member_count === 1 ? "member" : "members"}
              </Text>
            </HStack>
          </VStack>
        </HStack>

        {/* Quick intro */}
        {group.quick_intro && <Text mb="2">{group.quick_intro}</Text>}

        {/* Parent group link */}
        {group.parent_title && (
          <HStack gap="1" mb="2">
            <Text fontSize="sm" color={mutedColor}>
              Part of
            </Text>
            <ChakraLink
              asChild
              fontSize="sm"
              color="blue.500"
              fontWeight="500"
            >
              <NextLink href={`/group/${group.parent_title.slug}`}>
                {group.parent_title.title}
              </NextLink>
            </ChakraLink>
          </HStack>
        )}

        {/* Decorator badges */}
        {group.decorators && group.decorators.length > 0 && (
          <HStack gap="2" flexWrap="wrap" mb="4">
            {group.decorators.map((d) => (
              <Badge
                key={d}
                variant="subtle"
                size="sm"
                borderRadius="full"
                px="3"
                py="1"
              >
                {formatDecorator(d)}
              </Badge>
            ))}
          </HStack>
        )}

        {/* Description */}
        {group.description && (
          <Box mb="6">
            <Text color={mutedColor} whiteSpace="pre-wrap">
              {group.description}
            </Text>
          </Box>
        )}

        {/* Member preview strip */}
        {group.member_preview && group.member_preview.length > 0 && (
          <Box mb="6" data-tour="group-members">
            <Text
              fontSize="xs"
              fontWeight="600"
              color={mutedColor}
              textTransform="uppercase"
              letterSpacing="0.05em"
              mb="2"
            >
              Members
            </Text>
            <HStack gap="0" flexWrap="wrap">
              {group.member_preview.map((m, i) => (
                <ChakraLink asChild key={m.username}>
                  <NextLink href={`/member/${m.username}`}>
                    <Box
                      w="36px"
                      h="36px"
                      borderRadius="full"
                      overflow="hidden"
                      border="2px solid"
                      borderColor={accentBg}
                      ml={i > 0 ? "-8px" : "0"}
                      position="relative"
                      zIndex={group.member_preview.length - i}
                      bg={avatarFallbackBg}
                      title={m.display_name}
                    >
                      {m.avatar_url ? (
                        <Image
                          src={m.avatar_url}
                          alt={m.display_name}
                          w="full"
                          h="full"
                          objectFit="cover"
                        />
                      ) : (
                        <Box
                          w="full"
                          h="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize="xs"
                          fontWeight="bold"
                          color="white"
                        >
                          {m.display_name.charAt(0).toUpperCase()}
                        </Box>
                      )}
                    </Box>
                  </NextLink>
                </ChakraLink>
              ))}
              {group.member_count > group.member_preview.length && (
                <Box
                  w="36px"
                  h="36px"
                  borderRadius="full"
                  border="2px solid"
                  borderColor={accentBg}
                  ml="-8px"
                  bg={cardBg}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  position="relative"
                  zIndex={0}
                >
                  <Text fontSize="2xs" fontWeight="600" color={mutedColor}>
                    +{group.member_count - group.member_preview.length}
                  </Text>
                </Box>
              )}
            </HStack>
          </Box>
        )}

        {/* Child groups */}
        {group.child_groups && group.child_groups.length > 0 && (
          <Box mb="6" data-tour="group-feed">
            <Text
              fontSize="xs"
              fontWeight="600"
              color={mutedColor}
              textTransform="uppercase"
              letterSpacing="0.05em"
              mb="2"
            >
              Groups within {group.title}
            </Text>
            <VStack gap="2" align="stretch">
              {group.child_groups.map((child) => (
                <ChakraLink
                  asChild
                  key={child.slug}
                  _hover={{ textDecoration: "none" }}
                >
                  <NextLink href={`/group/${child.slug}`}>
                    <HStack
                      p="3"
                      bg={cardBg}
                      borderRadius="md"
                      border="1px solid"
                      borderColor={borderColor}
                      _hover={{ boxShadow: "sm" }}
                      transition="box-shadow 0.2s"
                    >
                      <Text fontWeight="500">{child.title}</Text>
                      <Badge
                        variant="subtle"
                        size="sm"
                        borderRadius="full"
                        textTransform="capitalize"
                      >
                        {child.group_type}
                      </Badge>
                    </HStack>
                  </NextLink>
                </ChakraLink>
              ))}
            </VStack>
          </Box>
        )}

        {/* Viewer context / CTAs */}
        <ViewerStrip
          isAuthenticated={isAuthenticated}
          authLoading={authLoading}
          admissionStatus={admissionStatus}
          groupSlug={group.slug}
          groupTitle={group.title}
          mutedColor={mutedColor}
          ctaBg={ctaBg}
          ctaBorderColor={ctaBorderColor}
          onStatusChange={setAdmissionStatus}
        />
      </Box>
    </Box>
  );
}

// --- Sub-components ---

function EmblemAvatar({
  group,
  emblemBg,
  emblemFg,
  avatarFallbackBg,
  cardBg,
}: {
  group: PublicGroupDetail;
  emblemBg: string;
  emblemFg: string;
  avatarFallbackBg: string;
  cardBg: string;
}) {
  const hasEmblemImage = !!group.emblem?.image_url;
  const hasProfileImage = !!group.profile_image_url;

  return (
    <Box
      w="72px"
      h="72px"
      borderRadius="full"
      overflow="hidden"
      border="3px solid"
      borderColor={cardBg}
      flexShrink={0}
      bg={hasEmblemImage || hasProfileImage ? undefined : emblemBg || avatarFallbackBg}
      position="relative"
      zIndex={1}
    >
      {hasEmblemImage ? (
        <Image
          src={group.emblem!.image_url!}
          alt={group.title}
          w="full"
          h="full"
          objectFit="cover"
        />
      ) : hasProfileImage ? (
        <Image
          src={group.profile_image_url!}
          alt={group.title}
          w="full"
          h="full"
          objectFit="cover"
        />
      ) : (
        <Box
          w="full"
          h="full"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontSize="2xl"
          fontWeight="bold"
          color={emblemFg}
        >
          {group.title.charAt(0).toUpperCase()}
        </Box>
      )}
    </Box>
  );
}

function ViewerStrip({
  isAuthenticated,
  authLoading,
  admissionStatus,
  groupSlug,
  groupTitle,
  mutedColor,
  ctaBg,
  ctaBorderColor,
  onStatusChange,
}: {
  isAuthenticated: boolean;
  authLoading: boolean;
  admissionStatus: AdmissionStatus | null;
  groupSlug: string;
  groupTitle: string;
  mutedColor: string;
  ctaBg: string;
  ctaBorderColor: string;
  onStatusChange: (status: AdmissionStatus) => void;
}) {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (authLoading) return null;

  if (admissionStatus?.is_member) {
    return (
      <HStack py="2" px="3" mb="6" gap="3">
        <Text fontSize="sm" color={mutedColor}>
          You are a member of {groupTitle}.
        </Text>
        {admissionStatus.is_moderator && (
          <>
            <ChakraLink asChild fontSize="xs" color="blue.500">
              <NextLink href={`/group/${groupSlug}/admin/join-requests`}>
                Join requests
              </NextLink>
            </ChakraLink>
            <Text fontSize="xs" color={mutedColor}>{"\u00B7"}</Text>
            <ChakraLink asChild fontSize="xs" color="blue.500">
              <NextLink href={`/group/${groupSlug}/admin/settings`}>
                Settings
              </NextLink>
            </ChakraLink>
          </>
        )}
      </HStack>
    );
  }

  if (!isAuthenticated) {
    return (
      <Box
        py="3"
        px="4"
        mb="6"
        borderRadius="md"
        border="1px solid"
        borderColor={ctaBorderColor}
        bg={ctaBg}
      >
        <Text fontSize="sm" color={mutedColor} mb="2">
          You{"\u2019"}re viewing as a guest.
        </Text>
        <HStack gap="3">
          <ChakraLink asChild fontSize="sm" color="blue.500">
            <NextLink href="/app/login">Log in</NextLink>
          </ChakraLink>
          <Text fontSize="sm" color={mutedColor}>
            {"\u00B7"}
          </Text>
          <ChakraLink asChild fontSize="sm" color="blue.500">
            <NextLink href="/welcome/start">Join to participate</NextLink>
          </ChakraLink>
        </HStack>
      </Box>
    );
  }

  // Authenticated, not a member
  const status = admissionStatus;

  async function handleJoin() {
    setActionLoading(true);
    setActionMessage(null);
    try {
      await joinGroup(groupSlug);
      setActionMessage("You have joined this group!");
      const updated = await fetchAdmissionStatus(groupSlug);
      onStatusChange(updated);
    } catch {
      setActionMessage("Could not join. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRequestJoin() {
    setActionLoading(true);
    setActionMessage(null);
    try {
      await requestToJoinGroup(groupSlug);
      setActionMessage("Your request has been submitted.");
      const updated = await fetchAdmissionStatus(groupSlug);
      onStatusChange(updated);
    } catch {
      setActionMessage("Could not submit request. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Box
      py="3"
      px="4"
      mb="6"
      borderRadius="md"
      border="1px solid"
      borderColor={ctaBorderColor}
      bg={ctaBg}
    >
      {actionMessage && (
        <Text fontSize="sm" mb="2" color={actionMessage.includes("Could not") ? "red.500" : "green.600"}>
          {actionMessage}
        </Text>
      )}

      {status?.has_pending_request && (
        <Text fontSize="sm" color={mutedColor}>
          Your request to join is pending review.
        </Text>
      )}

      {!status?.has_pending_request && status?.can_join && (
        <VStack align="start" gap="2">
          {status.requires_parent_membership && !status.is_parent_member && status.parent_group ? (
            <Text fontSize="sm" color={mutedColor}>
              Join{" "}
              <ChakraLink asChild color="blue.500">
                <NextLink href={`/group/${status.parent_group.slug}`}>
                  {status.parent_group.title}
                </NextLink>
              </ChakraLink>
              {" "}first to join this group.
            </Text>
          ) : (
            <Button
              size="sm"
              colorScheme="blue"
              onClick={handleJoin}
              disabled={actionLoading}
            >
              {actionLoading ? "Joining..." : "Join this Group"}
            </Button>
          )}
        </VStack>
      )}

      {!status?.has_pending_request && status?.can_request && (
        <VStack align="start" gap="2">
          {status.requires_parent_membership && !status.is_parent_member && status.parent_group ? (
            <Text fontSize="sm" color={mutedColor}>
              Join{" "}
              <ChakraLink asChild color="blue.500">
                <NextLink href={`/group/${status.parent_group.slug}`}>
                  {status.parent_group.title}
                </NextLink>
              </ChakraLink>
              {" "}first to request to join this group.
            </Text>
          ) : (
            <Button
              size="sm"
              variant="outline"
              colorScheme="blue"
              onClick={handleRequestJoin}
              disabled={actionLoading}
            >
              {actionLoading ? "Sending..." : "Ask to Join"}
            </Button>
          )}
        </VStack>
      )}

      {!status?.has_pending_request && !status?.can_join && !status?.can_request && status?.policy === "invite_only" && (
        <Text fontSize="sm" color={mutedColor}>
          This group is invite-only.
        </Text>
      )}

      {!status?.has_pending_request && !status?.can_join && !status?.can_request && status?.policy === "closed" && (
        <Text fontSize="sm" color={mutedColor}>
          This group is not accepting new members.
        </Text>
      )}
    </Box>
  );
}

// --- Helpers ---

function formatDecorator(code: string): string {
  return code
    .replace(/^(isA__|can__|has__)/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

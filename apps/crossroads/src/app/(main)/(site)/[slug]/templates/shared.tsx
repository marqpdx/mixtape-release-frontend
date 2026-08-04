"use client";

// Shared sub-components used across all layout templates.

import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Heading,
  HStack,
  Image,
  Text,
  VStack,
  Link as ChakraLink,
} from "@chakra-ui/react";
import NextLink from "next/link";
import type { PublicGroupDetail, AdmissionStatus, PageComponent } from "@mixtape/api/clients/public/publicApi";
import { joinGroup, requestToJoinGroup, fetchAdmissionStatus } from "@mixtape/api/clients/public/publicApi";

// ---------------------------------------------------------------------------
// GroupEmblem
// ---------------------------------------------------------------------------

export function GroupEmblem({
  group,
  emblemBg,
  emblemFg,
  avatarFallbackBg,
  cardBg,
  size = "72px",
}: {
  group: PublicGroupDetail;
  emblemBg: string;
  emblemFg: string;
  avatarFallbackBg: string;
  cardBg: string;
  size?: string;
}) {
  const hasEmblemImage = !!group.emblem?.image_url;
  const hasProfileImage = !!group.profile_image_url;

  return (
    <Box
      w={size}
      h={size}
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
        <Image src={group.emblem!.image_url!} alt={group.title} w="full" h="full" objectFit="cover" />
      ) : hasProfileImage ? (
        <Image src={group.profile_image_url!} alt={group.title} w="full" h="full" objectFit="cover" />
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

// ---------------------------------------------------------------------------
// AdmissionStrip
// ---------------------------------------------------------------------------

export function AdmissionStrip({
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

  if (authLoading || !admissionStatus) return null;

  if (admissionStatus.is_member) {
    return (
      <HStack py="2" px="3" mb="6" gap="3">
        <Text fontSize="sm" color={mutedColor}>
          You are a member of {groupTitle}.
        </Text>
        {admissionStatus.is_moderator && (
          <>
            <ChakraLink asChild fontSize="xs" color="blue.500">
              <NextLink href={`/group/${groupSlug}/admin/join-requests`}>Join requests</NextLink>
            </ChakraLink>
            <Text fontSize="xs" color={mutedColor}>{"·"}</Text>
            <ChakraLink asChild fontSize="xs" color="blue.500">
              <NextLink href={`/group/${groupSlug}/admin/settings`}>Settings</NextLink>
            </ChakraLink>
          </>
        )}
      </HStack>
    );
  }

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

  if (!isAuthenticated) {
    return (
      <Box
        className="cp-cta"
        py="3"
        px="4"
        mb="6"
        borderRadius="md"
        border="1px solid"
        borderColor={ctaBorderColor}
        bg={ctaBg}
      >
        <Text fontSize="sm" color={mutedColor} mb="2">
          You{"'"}re viewing as a guest.
        </Text>
        <HStack gap="3">
          <ChakraLink asChild fontSize="sm" color="blue.500">
            <NextLink href="/app/login">Log in</NextLink>
          </ChakraLink>
          <Text fontSize="sm" color={mutedColor}>{"·"}</Text>
          <ChakraLink asChild fontSize="sm" color="blue.500">
            <NextLink href="/welcome/start">Join to participate</NextLink>
          </ChakraLink>
        </HStack>
      </Box>
    );
  }

  const s = admissionStatus;

  return (
    <Box
      className="cp-cta"
      py="3"
      px="4"
      mb="6"
      borderRadius="md"
      border="1px solid"
      borderColor={ctaBorderColor}
      bg={ctaBg}
    >
      {actionMessage && (
        <Text
          fontSize="sm"
          mb="2"
          color={actionMessage.includes("Could not") ? "red.500" : "green.600"}
        >
          {actionMessage}
        </Text>
      )}
      {s.has_pending_request && (
        <Text fontSize="sm" color={mutedColor}>Your request to join is pending review.</Text>
      )}
      {!s.has_pending_request && s.can_join && (
        <VStack align="start" gap="2">
          {s.requires_parent_membership && !s.is_parent_member && s.parent_group ? (
            <Text fontSize="sm" color={mutedColor}>
              Join{" "}
              <ChakraLink asChild color="blue.500">
                <NextLink href={`/group/${s.parent_group.slug}`}>{s.parent_group.title}</NextLink>
              </ChakraLink>
              {" "}first to join this group.
            </Text>
          ) : (
            <Button size="sm" colorScheme="blue" onClick={handleJoin} disabled={actionLoading}>
              {actionLoading ? "Joining..." : "Join this Group"}
            </Button>
          )}
        </VStack>
      )}
      {!s.has_pending_request && s.can_request && (
        <VStack align="start" gap="2">
          {s.requires_parent_membership && !s.is_parent_member && s.parent_group ? (
            <Text fontSize="sm" color={mutedColor}>
              Join{" "}
              <ChakraLink asChild color="blue.500">
                <NextLink href={`/group/${s.parent_group.slug}`}>{s.parent_group.title}</NextLink>
              </ChakraLink>
              {" "}first to request to join this group.
            </Text>
          ) : (
            <Button size="sm" variant="outline" colorScheme="blue" onClick={handleRequestJoin} disabled={actionLoading}>
              {actionLoading ? "Sending..." : "Ask to Join"}
            </Button>
          )}
        </VStack>
      )}
      {!s.has_pending_request && !s.can_join && !s.can_request && s.policy === "invite_only" && (
        <Text fontSize="sm" color={mutedColor}>This group is invite-only.</Text>
      )}
      {!s.has_pending_request && !s.can_join && !s.can_request && s.policy === "closed" && (
        <Text fontSize="sm" color={mutedColor}>This group is not accepting new members.</Text>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// MemberPreviewStrip
// ---------------------------------------------------------------------------

export function MemberPreviewStrip({
  group,
  mutedColor,
  accentBg,
  avatarFallbackBg,
}: {
  group: PublicGroupDetail;
  mutedColor: string;
  accentBg: string;
  avatarFallbackBg: string;
}) {
  if (!group.member_preview || group.member_preview.length === 0) return null;
  return (
    <Box className="cp-members" mb="6">
      <Text fontSize="xs" fontWeight="600" color={mutedColor} textTransform="uppercase" letterSpacing="0.05em" mb="2">
        Members
      </Text>
      <HStack gap="0" flexWrap="wrap">
        {group.member_preview.map((m, i) => (
          <ChakraLink asChild key={m.username}>
            <NextLink href={`/member/handle/${m.username}`}>
              <Box
                w="36px" h="36px" borderRadius="full" overflow="hidden"
                border="2px solid" borderColor={accentBg}
                ml={i > 0 ? "-8px" : "0"}
                position="relative" zIndex={group.member_preview.length - i}
                bg={avatarFallbackBg} title={m.display_name}
              >
                {m.avatar_url ? (
                  <Image src={m.avatar_url} alt={m.display_name} w="full" h="full" objectFit="cover" />
                ) : (
                  <Box w="full" h="full" display="flex" alignItems="center" justifyContent="center" fontSize="xs" fontWeight="bold" color="white">
                    {m.display_name.charAt(0).toUpperCase()}
                  </Box>
                )}
              </Box>
            </NextLink>
          </ChakraLink>
        ))}
      </HStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// PageComponentBlock — renders a single ad hoc PageComponent
// ---------------------------------------------------------------------------

export function PageComponentBlock({ component, mutedColor, borderColor }: {
  component: PageComponent;
  mutedColor: string;
  borderColor: string;
}) {
  // All values are unknown from JSONField — stringify everything before rendering.
  const str = (v: unknown): string => (v != null ? String(v) : "");
  const has = (v: unknown): boolean => v != null && v !== "";
  const c = component.content_json;

  switch (component.component_type) {
    case "text":
      return (
        <Box mb="4">
          {has(c.heading) && <Heading size="md" mb="1">{str(c.heading)}</Heading>}
          {has(c.body) && <Text whiteSpace="pre-wrap">{str(c.body)}</Text>}
        </Box>
      );
    case "image":
      return (
        <Box mb="4">
          {has(c.url) && (
            <Image
              src={str(c.url)}
              alt={has(c.alt) ? str(c.alt) : ""}
              maxW="full"
              borderRadius="md"
            />
          )}
          {has(c.caption) && (
            <Text fontSize="sm" color={mutedColor} mt="1">{str(c.caption)}</Text>
          )}
        </Box>
      );
    case "link":
      return (
        <Box mb="3">
          {has(c.url) && (
            <ChakraLink asChild color="blue.500" fontWeight="500">
              <a href={str(c.url)} target="_blank" rel="noopener noreferrer">
                {str(has(c.label) ? c.label : c.url)}
              </a>
            </ChakraLink>
          )}
          {has(c.description) && (
            <Text fontSize="sm" color={mutedColor}>{str(c.description)}</Text>
          )}
        </Box>
      );
    case "callout":
      return (
        <Box
          mb="4" p="4" borderRadius="md"
          border="1px solid" borderColor={borderColor}
          bg={c.style === "highlight" ? "yellow.50" : "blue.50"}
        >
          {has(c.heading) && <Heading size="sm" mb="1">{str(c.heading)}</Heading>}
          {has(c.body) && <Text fontSize="sm">{str(c.body)}</Text>}
        </Box>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// ChildGroupsSection
// ---------------------------------------------------------------------------

export function ChildGroupsSection({ group, mutedColor }: { group: PublicGroupDetail; mutedColor: string }) {
  if (!group.child_groups || group.child_groups.length === 0) return null;
  return (
    <Box className="cp-child-groups" mb="6">
      <Text fontSize="xs" fontWeight="600" color={mutedColor} textTransform="uppercase" letterSpacing="0.05em" mb="2">
        Groups within {group.title}
      </Text>
      <VStack align="start" gap="1">
        {group.child_groups.map((g) => (
          <ChakraLink asChild key={g.slug} fontSize="sm" color="blue.500">
            <NextLink href={`/${g.slug}`}>{g.title}</NextLink>
          </ChakraLink>
        ))}
      </VStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// DecoratorBadges
// ---------------------------------------------------------------------------

export function DecoratorBadges({ decorators }: { decorators: string[] }) {
  if (!decorators || decorators.length === 0) return null;
  return (
    <HStack gap="2" flexWrap="wrap" mb="4">
      {decorators.map((d) => (
        <Badge key={d} variant="subtle" size="sm" borderRadius="full" px="3" py="1">
          {formatDecorator(d)}
        </Badge>
      ))}
    </HStack>
  );
}

export function formatDecorator(code: string): string {
  return code
    .replace(/^(isA__|can__|has__)/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// SlotComponents — components filtered to a named slot, sorted
// ---------------------------------------------------------------------------

export function SlotComponents({ components, slot, mutedColor, borderColor }: {
  components: PageComponent[];
  slot: string;
  mutedColor: string;
  borderColor: string;
}) {
  const slotComponents = components.filter((c) => c.slot === slot);
  if (slotComponents.length === 0) return null;
  return (
    <>
      {slotComponents.map((c) => (
        <PageComponentBlock key={c.id} component={c} mutedColor={mutedColor} borderColor={borderColor} />
      ))}
    </>
  );
}

"use client";

// Directory — member strip is the hero element; group type badge prominent.
// Good for groups that are primarily a roster: a circle, a team, a cohort.
// Ad hoc slots: "about", "links", "extra".

import { Badge, Box, Heading, HStack, Image, Text, VStack, Link as ChakraLink } from "@chakra-ui/react";
import NextLink from "next/link";
import type { TemplateProps } from "./types";
import {
  GroupEmblem,
  AdmissionStrip,
  ChildGroupsSection,
  DecoratorBadges,
  SlotComponents,
  groupLinkStyles,
} from "./shared";

export default function DirectoryTemplate({
  group,
  components,
  admissionStatus,
  isAuthenticated,
  authLoading,
  onStatusChange,
}: TemplateProps) {
  const mutedColor = "theme.textMuted";
  const borderColor = "ui.borderSubtle";
  const avatarFallbackBg = "ui.surfaceSubtle";
  const ctaBg = "ui.surfaceSubtle";
  const accentBg = "theme.surface";

  const emblemBg = group.emblem?.bg || "#5b8a6f";
  const emblemFg = group.emblem?.fg || "#ffffff";

  return (
    <Box className="cpt-directory-root" bg="theme.bg" color="theme.text" maxW="3xl" mx="auto" px="6" py="8">
      {/* Header row */}
      <HStack className="cpt-directory-header" gap="4" mb="6" align="center">
        <GroupEmblem
          group={group}
          emblemBg={emblemBg}
          emblemFg={emblemFg}
          avatarFallbackBg={avatarFallbackBg}
          cardBg={accentBg}
        />
        <VStack align="start" gap="1">
          <Heading size="xl">{group.title || "Untitled Group"}</Heading>
          <HStack gap="2">
            <Badge
              bg="ui.surfaceSubtle"
              color="theme.text"
              variant="solid"
              size="md"
              borderRadius="full"
              px="3"
              py="1"
              textTransform="capitalize"
              fontSize="sm"
            >
              {group.group_type}
            </Badge>
            <DecoratorBadges decorators={group.decorators} />
          </HStack>
        </VStack>
      </HStack>

      {group.quick_intro && <Text mb="4" fontWeight="500">{group.quick_intro}</Text>}

      {/* Member grid — primary content area */}
      {group.member_preview && group.member_preview.length > 0 && (
        <Box className="cpt-directory-members" mb="8">
          <Text
            fontSize="xs" fontWeight="700" color={mutedColor}
            textTransform="uppercase" letterSpacing="0.08em" mb="3"
          >
            {group.member_count} {group.member_count === 1 ? "Member" : "Members"}
          </Text>
          <Box
            className="cpt-directory-member-grid"
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(120px, 1fr))"
            gap="3"
          >
            {group.member_preview.map((m) => (
              <ChakraLink asChild key={m.username} {...groupLinkStyles} textDecoration="none" aria-label={m.display_name}>
                <NextLink href={`/member/handle/${m.username}`}>
                  <VStack
                    className="cpt-directory-member-card"
                    bg="theme.surface" color="theme.text"
                    gap="1"
                    p="2"
                    borderRadius="md"
                    border="1px solid"
                    borderColor={borderColor}
                    _hover={{ borderColor: "ui.borderControl", bg: ctaBg }}
                    transition="all 0.15s"
                  >
                    <Box
                      className="cpt-directory-avatar"
                      w="48px" h="48px" borderRadius="full" overflow="hidden"
                      bg={avatarFallbackBg} flexShrink={0}
                    >
                      {m.avatar_url ? (
                        <Image src={m.avatar_url} alt={m.display_name} w="full" h="full" objectFit="cover" />
                      ) : (
                        <Box w="full" h="full" display="flex" alignItems="center" justifyContent="center"
                          fontSize="xl" fontWeight="bold" color="theme.text">
                          {m.display_name.charAt(0).toUpperCase()}
                        </Box>
                      )}
                    </Box>
                    <Text fontSize="xs" fontWeight="500" textAlign="center" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" w="full">{m.display_name}</Text>
                  </VStack>
                </NextLink>
              </ChakraLink>
            ))}
          </Box>
        </Box>
      )}

      <SlotComponents components={components} slot="about" mutedColor={mutedColor} borderColor={borderColor} />

      {group.description && (
        <Box mb="6">
          <Text color={mutedColor} fontSize="sm" whiteSpace="pre-wrap">{group.description}</Text>
        </Box>
      )}

      <SlotComponents components={components} slot="links" mutedColor={mutedColor} borderColor={borderColor} />

      <AdmissionStrip
        isAuthenticated={isAuthenticated}
        authLoading={authLoading}
        admissionStatus={admissionStatus}
        groupSlug={group.slug}
        groupTitle={group.title}
        onStatusChange={onStatusChange}
      />

      <SlotComponents components={components} slot="extra" mutedColor={mutedColor} borderColor={borderColor} />

      <ChildGroupsSection group={group} mutedColor={mutedColor} />
    </Box>
  );
}

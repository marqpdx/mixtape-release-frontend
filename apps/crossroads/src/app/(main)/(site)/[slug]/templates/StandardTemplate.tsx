"use client";

// Standard — banner + emblem header, quick_intro, admission CTA, description,
// members, child groups. Ad hoc slots: "about" (below quick_intro),
// "links" (below description), "cta" (above admission strip).

import { Badge, Box, Heading, HStack, Image, Text, VStack, Link as ChakraLink } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import NextLink from "next/link";
import type { TemplateProps } from "./types";
import {
  GroupEmblem,
  AdmissionStrip,
  MemberPreviewStrip,
  ChildGroupsSection,
  DecoratorBadges,
  SlotComponents,
} from "./shared";

export default function StandardTemplate({
  group,
  components,
  admissionStatus,
  isAuthenticated,
  authLoading,
  onStatusChange,
}: TemplateProps) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const avatarFallbackBg = useColorModeValue("gray.300", "gray.600");
  const ctaBg = useColorModeValue("gray.50", "gray.800");
  const accentBg = useColorModeValue("white", "gray.900");

  const emblemBg = group.emblem?.bg || "#5b8a6f";
  const emblemFg = group.emblem?.fg || "#ffffff";

  return (
    <Box className="cpt-standard-root">
      {group.background_image_url ? (
        <Box className="cpt-banner" w="full" h="220px" overflow="hidden" mb="-40px">
          <Image src={group.background_image_url} alt="" w="full" h="full" objectFit="cover" />
        </Box>
      ) : (
        <Box
          className="cpt-banner-accent"
          w="full" h="120px" mb="-40px"
          background={`linear-gradient(135deg, ${emblemBg}40 0%, ${emblemBg}15 100%)`}
        />
      )}

      <Box className="cpt-content" maxW="3xl" mx="auto" px="6" pb="10">
        <HStack className="cpt-header" gap="4" align="end" mb="4">
          <GroupEmblem
            group={group}
            emblemBg={emblemBg}
            emblemFg={emblemFg}
            avatarFallbackBg={avatarFallbackBg}
            cardBg={accentBg}
          />
          <VStack gap="0" align="start">
            <Heading size="2xl">{group.title || "Untitled Group"}</Heading>
            <HStack gap="2">
              <Badge variant="subtle" size="sm" borderRadius="full" px="3" py="1" textTransform="capitalize">
                {group.group_type}
              </Badge>
              <Text color={mutedColor} fontSize="sm">
                {group.member_count} {group.member_count === 1 ? "member" : "members"}
              </Text>
            </HStack>
          </VStack>
        </HStack>

        {group.quick_intro && <Text mb="2">{group.quick_intro}</Text>}

        {group.parent_title && (
          <HStack gap="1" mb="2">
            <Text fontSize="sm" color={mutedColor}>Part of</Text>
            <ChakraLink asChild fontSize="sm" color="blue.500" fontWeight="500">
              <NextLink href={`/group/${group.parent_title.slug}`}>{group.parent_title.title}</NextLink>
            </ChakraLink>
          </HStack>
        )}

        <DecoratorBadges decorators={group.decorators} />

        <SlotComponents components={components} slot="about" mutedColor={mutedColor} borderColor={borderColor} />
        <SlotComponents components={components} slot="cta" mutedColor={mutedColor} borderColor={borderColor} />

        <AdmissionStrip
          isAuthenticated={isAuthenticated}
          authLoading={authLoading}
          admissionStatus={admissionStatus}
          groupSlug={group.slug}
          groupTitle={group.title}
          mutedColor={mutedColor}
          ctaBg={ctaBg}
          ctaBorderColor={borderColor}
          onStatusChange={onStatusChange}
        />

        {group.description && (
          <Box mb="6">
            <Text color={mutedColor} whiteSpace="pre-wrap">{group.description}</Text>
          </Box>
        )}

        <SlotComponents components={components} slot="links" mutedColor={mutedColor} borderColor={borderColor} />

        <MemberPreviewStrip
          group={group}
          mutedColor={mutedColor}
          accentBg={accentBg}
          avatarFallbackBg={avatarFallbackBg}
        />

        <SlotComponents components={components} slot="extra" mutedColor={mutedColor} borderColor={borderColor} />

        <ChildGroupsSection group={group} mutedColor={mutedColor} />
      </Box>
    </Box>
  );
}

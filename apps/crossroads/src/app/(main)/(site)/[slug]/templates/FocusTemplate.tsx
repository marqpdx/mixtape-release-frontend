"use client";

// Focus — compact header, description and ad hoc "about" content take
// the main stage. Good for pre-signup groups where the fields aren't set yet:
// the body area is roomy and the member strip / child groups are de-emphasized.
// Ad hoc slots: "about", "links", "cta", "extra".

import { Badge, Box, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { TemplateProps } from "./types";
import {
  GroupEmblem,
  AdmissionStrip,
  MemberPreviewStrip,
  ChildGroupsSection,
  DecoratorBadges,
  SlotComponents,
} from "./shared";

export default function FocusTemplate({
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
  const headerBg = useColorModeValue("gray.50", "gray.900");

  const emblemBg = group.emblem?.bg || "#5b8a6f";
  const emblemFg = group.emblem?.fg || "#ffffff";

  return (
    <Box className="cpt-focus-root">
      {/* Compact header bar */}
      <Box
        className="cpt-focus-header"
        bg={headerBg}
        borderBottom="1px solid"
        borderColor={borderColor}
        px="6"
        py="4"
        mb="8"
      >
        <HStack gap="4" maxW="3xl" mx="auto">
          <GroupEmblem
            group={group}
            emblemBg={emblemBg}
            emblemFg={emblemFg}
            avatarFallbackBg={avatarFallbackBg}
            cardBg={accentBg}
            size="52px"
          />
          <VStack align="start" gap="0">
            <Heading size="lg">{group.title || "Untitled Group"}</Heading>
            <HStack gap="2">
              <Badge variant="subtle" size="sm" borderRadius="full" px="2" py="0.5" textTransform="capitalize">
                {group.group_type}
              </Badge>
              {group.member_count > 0 && (
                <Text fontSize="xs" color={mutedColor}>
                  {group.member_count} {group.member_count === 1 ? "member" : "members"}
                </Text>
              )}
            </HStack>
          </VStack>
        </HStack>
      </Box>

      {/* Body */}
      <Box className="cpt-focus-content" maxW="3xl" mx="auto" px="6" pb="10">
        {group.quick_intro && (
          <Text fontSize="lg" fontWeight="500" mb="4">{group.quick_intro}</Text>
        )}

        <DecoratorBadges decorators={group.decorators} />

        {/* Ad hoc "about" slot — prominent in Focus */}
        <SlotComponents components={components} slot="about" mutedColor={mutedColor} borderColor={borderColor} />

        {group.description && (
          <Box mb="6">
            <Text whiteSpace="pre-wrap">{group.description}</Text>
          </Box>
        )}

        <SlotComponents components={components} slot="links" mutedColor={mutedColor} borderColor={borderColor} />
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

        <SlotComponents components={components} slot="extra" mutedColor={mutedColor} borderColor={borderColor} />

        <MemberPreviewStrip
          group={group}
          mutedColor={mutedColor}
          accentBg={accentBg}
          avatarFallbackBg={avatarFallbackBg}
        />

        <ChildGroupsSection group={group} mutedColor={mutedColor} />
      </Box>
    </Box>
  );
}

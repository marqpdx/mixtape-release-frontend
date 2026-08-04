"use client";

// Hero — large banner with centered overlay title, minimal body below.
// Best for groups with a strong background image and a short, punchy quick_intro.
// Ad hoc slots: "hero" (over banner), "about" (below title), "links", "extra".

import { Box, Heading, Image, Text, VStack } from "@chakra-ui/react";
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

export default function HeroTemplate({
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
  const hasBanner = !!group.background_image_url;

  return (
    <Box className="cpt-hero-root">
      {/* Hero banner — tall, title overlaid */}
      <Box
        className="cpt-hero-banner"
        position="relative"
        w="full"
        h={{ base: "260px", md: "360px" }}
        overflow="hidden"
        mb="8"
      >
        {hasBanner ? (
          <Image src={group.background_image_url!} alt="" w="full" h="full" objectFit="cover" />
        ) : (
          <Box
            w="full" h="full"
            background={`linear-gradient(160deg, ${emblemBg} 0%, ${emblemBg}80 60%, ${emblemBg}30 100%)`}
          />
        )}
        {/* Dark scrim for legibility */}
        <Box position="absolute" inset="0" bg="blackAlpha.500" />

        {/* Centered overlay content */}
        <VStack
          className="cpt-hero-overlay"
          position="absolute"
          inset="0"
          justify="center"
          align="center"
          gap="3"
          px="6"
        >
          <GroupEmblem
            group={group}
            emblemBg={emblemBg}
            emblemFg={emblemFg}
            avatarFallbackBg={avatarFallbackBg}
            cardBg="transparent"
            size="80px"
          />
          <Heading size="3xl" color="white" textAlign="center" textShadow="0 1px 4px rgba(0,0,0,0.5)">
            {group.title || "Untitled Group"}
          </Heading>
          {group.quick_intro && (
            <Text color="whiteAlpha.900" fontSize="lg" textAlign="center" maxW="2xl" textShadow="0 1px 3px rgba(0,0,0,0.4)">
              {group.quick_intro}
            </Text>
          )}
          <SlotComponents components={components} slot="hero" mutedColor="white" borderColor="whiteAlpha.400" />
        </VStack>
      </Box>

      {/* Body */}
      <Box className="cpt-hero-content" maxW="2xl" mx="auto" px="6" pb="10">
        <SlotComponents components={components} slot="about" mutedColor={mutedColor} borderColor={borderColor} />

        <DecoratorBadges decorators={group.decorators} />

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

"use client";

// Hero — large banner with centered overlay title, minimal body below.
// Best for groups with a strong background image and a short, punchy quick_intro.
// Ad hoc slots: "hero" (over banner), "about" (below title), "links", "extra".

import { Box, Heading, Image, Text, VStack } from "@chakra-ui/react";
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
  const mutedColor = "theme.textMuted";
  const borderColor = "ui.borderSubtle";
  const avatarFallbackBg = "ui.surfaceSubtle";
  const accentBg = "theme.surface";

  const emblemBg = group.emblem?.bg || "#5b8a6f";
  const emblemFg = group.emblem?.fg || "#ffffff";
  const hasBanner = !!group.background_image_url;

  return (
    <Box className="cpt-hero-root" bg="theme.bg" color="theme.text">
      {/* Keep the artwork behind an opaque, independently readable copy panel.
          Content stays in flow so long copy and hero slots can grow the banner. */}
      <Box
        className="cpt-hero-banner"
        position="relative"
        w="full"
        minH={{ base: "260px", md: "360px" }}
        mb="8"
      >
        {hasBanner ? (
          <Image className="cpt-hero-artwork" position="absolute" inset="0" src={group.background_image_url!} alt="" w="full" h="full" objectFit="cover" />
        ) : (
          <Box
            className="cpt-hero-fallback-artwork"
            position="absolute" inset="0"
            w="full" h="full"
            background={`linear-gradient(160deg, ${emblemBg} 0%, ${emblemBg}80 60%, ${emblemBg}30 100%)`}
          />
        )}
        <Box className="cpt-hero-scrim" position="absolute" inset="0" bg="ui.overlayScrim" />

        {/* Centered overlay content */}
        <VStack
          className="cpt-hero-overlay"
          position="relative"
          minH="inherit"
          justify="center"
          align="center"
          gap="3"
          px="6"
          py="6"
        >
          <GroupEmblem
            group={group}
            emblemBg={emblemBg}
            emblemFg={emblemFg}
            avatarFallbackBg={avatarFallbackBg}
            cardBg="transparent"
            size="80px"
          />
          <VStack className="cpt-hero-copy" bg="theme.surface" color="theme.text" w="full" maxW="2xl" minW="0" align="stretch" p="4" gap="3" overflowWrap="anywhere">
            <Heading size="3xl" textAlign="center">
              {group.title || "Untitled Group"}
            </Heading>
            {group.quick_intro && (
              <Text color="theme.textMuted" fontSize="lg" textAlign="center">
                {group.quick_intro}
              </Text>
            )}
            <SlotComponents components={components} slot="hero" mutedColor={mutedColor} borderColor={borderColor} />
          </VStack>
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

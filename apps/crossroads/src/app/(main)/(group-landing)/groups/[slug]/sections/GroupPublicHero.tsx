"use client";

// GroupPublicHero — T2 hero. Full-bleed background image is the universal anchor.
// Hero copy (eyebrow, headline, body, CTAs) renders over the image with a dark overlay.
// Falls back to an indigo gradient when no background_image_url is set.
// Decision 11: no platform chrome. Decision 1: first section.

import { Box, Flex, Text, Button } from "@chakra-ui/react";
import type { GroupPublicLandingConfig } from "../types";

function resolveCtaHref(action: string): string {
  if (action.startsWith("scroll:")) {
    const target = action.replace("scroll:", "");
    return `#gpl-${target}`;
  }
  return action || "#";
}

interface Props {
  config: GroupPublicLandingConfig;
  hasFeatured: boolean;
}

export function GroupPublicHero({ config }: Props) {
  const { hero, group } = config;

  const primaryHref = hero?.primary_cta.action
    ? resolveCtaHref(hero.primary_cta.action)
    : null;
  const secondaryHref = hero?.secondary_cta.action
    ? resolveCtaHref(hero.secondary_cta.action)
    : null;

  return (
    <Box
      className="gpl-hero"
      as="section"
      position="relative"
      minH={{ base: "420px", md: "540px", lg: "600px" }}
      display="flex"
      alignItems="flex-end"
      style={
        group.background_image_url
          ? {
              backgroundImage: `url(${group.background_image_url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : { background: "linear-gradient(135deg, #3730a3 0%, #6d28d9 100%)" }
      }
    >
      {/* Dark overlay — keeps text readable against any image */}
      <Box
        position="absolute"
        inset={0}
        style={{ background: "rgba(0,0,0,0.50)" }}
      />

      <Box
        className="gpl-hero-content"
        position="relative"
        zIndex={1}
        px={{ base: 6, md: 12, lg: 20 }}
        py={{ base: 12, md: 16, lg: 20 }}
        maxW="800px"
      >
        {hero?.eyebrow && (
          <Text
            className="gpl-hero-eyebrow"
            fontSize="xs"
            fontWeight="600"
            color="whiteAlpha.700"
            textTransform="uppercase"
            letterSpacing="wider"
            mb={4}
          >
            {hero.eyebrow}
          </Text>
        )}

        {hero?.headline && (
          <Text
            className="gpl-hero-headline"
            as="h1"
            fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
            fontWeight="700"
            color="white"
            lineHeight={1.2}
            mb={6}
          >
            {hero.headline}
          </Text>
        )}

        {hero?.body && (
          <Text
            className="gpl-hero-body"
            fontSize={{ base: "md", md: "lg" }}
            color="whiteAlpha.800"
            lineHeight={1.7}
            mb={10}
            maxW="620px"
          >
            {hero.body}
          </Text>
        )}

        {(primaryHref || secondaryHref) && (
          <Flex className="gpl-hero-ctas" gap={3} flexWrap="wrap">
            {primaryHref && hero?.primary_cta.label && (
              <a href={primaryHref} style={{ textDecoration: "none" }}>
                <Button size="lg" colorPalette="indigo" variant="solid">
                  {hero.primary_cta.label}
                </Button>
              </a>
            )}
            {secondaryHref && hero?.secondary_cta.label && (
              <a href={secondaryHref} style={{ textDecoration: "none" }}>
                <Button
                  size="lg"
                  variant="outline"
                  style={{ color: "white", borderColor: "rgba(255,255,255,0.5)" }}
                >
                  {hero.secondary_cta.label}
                </Button>
              </a>
            )}
          </Flex>
        )}
      </Box>
    </Box>
  );
}

"use client";

// GroupPublicHero — Decision 1 (first section), Decision 11 (no platform chrome)

import { Box, Flex, Text, Button, Stack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import type { GroupPublicLandingConfig } from "../types";

function resolveCtaHref(action: string, groupSlug: string): string {
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

export function GroupPublicHero({ config, hasFeatured }: Props) {
  const { hero, group } = config;
  const bg = useColorModeValue("white", "gray.950");
  const eyebrowColor = useColorModeValue("gray.500", "gray.400");
  const headlineColor = useColorModeValue("gray.900", "gray.50");
  const bodyColor = useColorModeValue("gray.600", "gray.300");
  const borderColor = useColorModeValue("gray.100", "gray.800");

  const primaryHref = hero.primary_cta.action
    ? resolveCtaHref(hero.primary_cta.action, group.slug)
    : null;
  const secondaryHref = hero.secondary_cta.action
    ? resolveCtaHref(hero.secondary_cta.action, group.slug)
    : null;

  return (
    <Box
      className="gpl-hero"
      as="section"
      bg={bg}
      borderBottomWidth="1px"
      borderColor={borderColor}
      px={{ base: 6, md: 12, lg: 20 }}
      py={{ base: 20, md: 28, lg: 36 }}
    >
      <Box maxW="760px">
        {hero.eyebrow && (
          <Text
            className="gpl-hero-eyebrow"
            fontSize="xs"
            fontWeight="600"
            color={eyebrowColor}
            textTransform="uppercase"
            letterSpacing="wider"
            mb={4}
          >
            {hero.eyebrow}
          </Text>
        )}

        {hero.headline && (
          <Text
            className="gpl-hero-headline"
            as="h1"
            fontSize={{ base: "3xl", md: "4xl", lg: "5xl" }}
            fontWeight="700"
            color={headlineColor}
            lineHeight={1.2}
            mb={6}
          >
            {hero.headline}
          </Text>
        )}

        {hero.body && (
          <Text
            className="gpl-hero-body"
            fontSize={{ base: "md", md: "lg" }}
            color={bodyColor}
            lineHeight={1.7}
            mb={10}
            maxW="620px"
          >
            {hero.body}
          </Text>
        )}

        {(primaryHref || secondaryHref) && (
          <Flex className="gpl-hero-ctas" gap={3} flexWrap="wrap">
            {primaryHref && hero.primary_cta.label && (
              <a href={primaryHref} style={{ textDecoration: "none" }}>
                <Button size="lg" colorPalette="indigo" variant="solid">
                  {hero.primary_cta.label}
                </Button>
              </a>
            )}
            {secondaryHref && hero.secondary_cta.label && (
              <a href={secondaryHref} style={{ textDecoration: "none" }}>
                <Button size="lg" variant="outline">
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

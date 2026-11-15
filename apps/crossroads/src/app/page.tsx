// apps/crossroads/src/app/page.tsx
// Navy/gold stays a fixed brand palette for this migration (CTO, 2026-11-13).
// Provisional: a broader branding pass across all colours may supersede it
// in the medium term; these values are not a permanent brand standard.

"use client";

import NextLink from "next/link";
import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  IconArrowRight,
  IconBook2,
  IconCompass,
  IconHeartHandshake,
  IconMap2,
  IconUsers,
} from "@tabler/icons-react";
import HomeVariantSwitcher from "@components/home/HomeVariantSwitcher";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";

const homepageArtwork = {
  gold: "#B8922A",
  photoOverlay: "linear-gradient(180deg, rgba(26, 33, 56, 0.08), rgba(26, 33, 56, 0.16))",
} as const;

const needs = [
  {
    label: "For work that lives in too many places",
    body: "The knowledge that matters most tends to scatter across files, systems, people's heads, and conversations that were never designed to hold it. Crossroads gives it a home worth tending.",
    icon: IconBook2,
  },
  {
    label: "For groups that need more than a channel",
    body: "Most collaboration tools are built for volume and velocity. Crossroads is for working in common. Some groups need a space that rewards depth, continuity, and care — where the important things don't get buried.",
    icon: IconUsers,
  },
  {
    label: "For people ready to be found well",
    body: "Some groups are ready to be discovered by the right neighbors, collaborators, clients, or allies. Tapestry makes that possible on their own terms, when the timing is right.",
    icon: IconMap2,
  },
];

const productSignals = [
  {
    name: "Catalyst",
    text: "A private knowledge practice for organizations whose understanding has outgrown memory and folders.",
  },
  {
    name: "Crossroads",
    text: "A home for working in common, for groups who need depth, continuity, and care in one place.",
  },
  {
    name: "Tapestry",
    text: "An opt-in collective layer for relational discovery across the wider Crossroads map.",
  },
];

export default function CrossroadsHomepage() {
  const backgroundImage = "/homepage/noaa-zdj3p00Rep0-unsplash.jpg";

  return (
    <Box
      className="crhp-root crhp-art-deco"
      minH="100vh"
      bg="theme.bg"
      color="theme.text"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <UnifiedNavbar />

      <Box className="crhp-masthead" borderBottom="2px solid" borderColor={homepageArtwork.gold}>
        <Container className="crhp-hero-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 18 }}>
          <Flex
            className="crhp-hero-grid"
            minH={{ base: "auto", lg: "calc(100vh - 180px)" }}
            align="center"
            justify="space-between"
            gap={{ base: 10, lg: 16 }}
            direction={{ base: "column", lg: "row" }}
          >
            <VStack className="crhp-hero-copy" align="start" gap={7} flex="1 1 58%" maxW="720px">
              <HStack className="crhp-tags" gap={2} flexWrap="wrap">
                {["Crossroads", "Catalyst", "Mixtape", "Tapestry"].map((tag) => (
                  <Badge
                    key={tag}
                    bg="ui.surfaceSubtle"
                    color="theme.text"
                    borderRadius="3px"
                    px={2}
                    py={1}
                    fontSize="9.5px"
                    letterSpacing="0.12em"
                    textTransform="uppercase"
                  >
                    {tag}
                  </Badge>
                ))}
              </HStack>

              <Box className="crhp-hero-title">
                <Heading
                  as="h1"
                  fontFamily='Georgia, "Times New Roman", serif'
                  fontSize={{ base: "xl", md: "3xl", xl: "4.5xl" }}
                  fontWeight="400"
                  lineHeight="1.04"
                  letterSpacing="0"
                  maxW="760px"
                >
                  More to know than ever
                </Heading>
                <Heading
                  as="h2"
                  fontFamily='Georgia, "Times New Roman", serif'
                  fontSize={{ base: "xl", md: "2xl" }}
                  fontWeight="400"
                  lineHeight="1.1"
                  letterSpacing="0"
                  color="theme.textMuted"
                  maxW="760px"
                  mt={2}
                >
                  ...more reason to tend what truly matters.
                </Heading>
                <Text
                  mt={6}
                  fontSize={{ base: "md", md: "lg" }}
                  lineHeight="1.7"
                  color="theme.textMuted"
                  maxW="65ch"
                >
                  We found ourselves hemmed in by too much — too much information, too much apparent choice, too much to wade through before thinking clearly. So we built a way through: toward abundance, spaciousness, and work that helps us feel fulfilled.
                </Text>
                <Text
                  mt={4}
                  fontSize={{ base: "md", md: "lg" }}
                  lineHeight="1.7"
                  color="theme.textMuted"
                  maxW="65ch"
                >
                  What's scarce — the thing that lets us do the work well — is knowledge we can trust. That is what Crossroads is built to cultivate.
                </Text>
              </Box>

              <HStack className="crhp-hero-actions" gap={3} flexWrap="wrap">
                <Button asChild maxW="full" h="auto" py={3} whiteSpace="normal" size="md" variant="solid" borderRadius="3px">
                  <Link textDecoration="none" _focusVisible={{ outline: "3px solid", outlineColor: "ui.borderControl", outlineOffset: "2px" }} color="theme.accentText" _hover={{ color: "theme.accentText" }} as={NextLink} href="/products">
                    <HStack className="crhp-cta-label" gap={2}>
                      <Text>See the product paths</Text>
                      <IconArrowRight size={18} />
                    </HStack>
                  </Link>
                </Button>
                <Button asChild maxW="full" h="auto" py={3} whiteSpace="normal" size="md" variant="outline" borderColor="ui.borderControl" color="theme.text" borderRadius="3px">
                  <Link textDecoration="none" _focusVisible={{ outline: "3px solid", outlineColor: "ui.borderControl", outlineOffset: "2px" }} color="theme.text" _hover={{ color: "theme.text" }} as={NextLink} href="/contact?interest=inquiry">
                    <Text>Start an inquiry</Text>
                  </Link>
                </Button>
              </HStack>
            </VStack>

            <Box className="crhp-hero-plate" flex="0 1 410px" w="100%">
              <Box
                className="crhp-image-frame"
                h={{ base: "360px", md: "520px" }}
                bgImage={`${homepageArtwork.photoOverlay}, url(${backgroundImage})`}
                bgSize="cover"
                backgroundPosition="center"
                border="1px solid"
                borderColor="ui.borderSubtle"
                borderRadius="4px"
              />
              <Box className="crhp-thesis" mt={5} bg="ui.surfaceSubtle" borderLeft="3px solid" borderColor="ui.borderSubtle" p={5}>
                <Text fontFamily='Georgia, "Times New Roman", serif' lineHeight="1.65" color="theme.text">
                  Information has never been more available.
                </Text>
                <Text fontFamily='Georgia, "Times New Roman", serif' lineHeight="1.65" color="theme.text">
                  Working together has never been more vital.
                </Text>
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>

      <Box className="crhp-needs-section" py={{ base: 12, md: 16 }}>
        <Container className="crhp-needs-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <VStack className="crhp-needs-content" align="stretch" gap={8}>
            <Box className="crhp-section-heading" maxW="760px">
              <Text color="theme.textMuted" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                The product story starts with what we are trying to protect.
              </Text>
              <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="var(--chakra-font-sizes-2xl)" letterSpacing="0">
                Crossroads honors that knowledge lives everywhere.
              </Heading>
            </Box>

            <SimpleGrid className="crhp-need-grid" columns={{ base: 1, md: 3 }} gap={4}>
              {needs.map((need) => {
                const Icon = need.icon;
                return (
                  <Box
                    className="crhp-need-card"
                    key={need.label}
                    bg="theme.surface"
                    border="1px solid"
                    borderColor="ui.borderSubtle"
                    borderRadius="4px"
                    p={6}
                    minH="260px"
                  >
                    <VStack className="crhp-need-content" align="start" gap={5}>
                      <Box className="crhp-need-icon" color="theme.text">
                        <Icon size={28} />
                      </Box>
                      <Box className="crhp-need-copy">
                        <Heading as="h3" fontSize="sm" color="theme.textMuted" letterSpacing="0.06em" textTransform="uppercase" mb={3}>
                          {need.label}
                        </Heading>
                        <Text color="theme.textMuted" lineHeight="1.7">
                          {need.body}
                        </Text>
                      </Box>
                    </VStack>
                  </Box>
                );
              })}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      <Box className="crhp-product-section" bg="theme.surface" borderTop="1px solid" borderBottom="1px solid" borderColor="ui.borderSubtle" py={{ base: 12, md: 16 }}>
        <Container className="crhp-product-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <Flex className="crhp-product-layout" gap={{ base: 8, lg: 14 }} align={{ base: "start", lg: "center" }} direction={{ base: "column", lg: "row" }}>
            <Box className="crhp-product-copy" flex="1" maxW="620px">
              <Text color="theme.textMuted" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                Three ways to begin
              </Text>
              <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="var(--chakra-font-sizes-2xl)" letterSpacing="0" mb={5}>
                Begin with what you know.
              </Heading>
              <Text color="theme.textMuted" lineHeight="1.7" maxW="65ch">
                Catalyst, Crossroads, and Tapestry are not competing doors. They are different ways into Mixtape as the work and the people doing it become clearer.
              </Text>
            </Box>

            <VStack className="crhp-product-list" align="stretch" gap={0} flex="1" w="100%" borderTop="1px solid" borderColor="ui.borderSubtle">
              {productSignals.map((signal) => (
                <Flex
                  className="crhp-product-row"
                  key={signal.name}
                  gap={5}
                  direction={{ base: "column", md: "row" }}
                  align="start"
                  py={5}
                  borderBottom="1px solid"
                  borderColor="ui.borderSubtle"
                >
                  <Text color="theme.text" fontFamily='Georgia, "Times New Roman", serif' fontSize="2xl" minW="112px" flexShrink={0} whiteSpace="nowrap">
                    {signal.name}
                  </Text>
                  <Text color="theme.textMuted" lineHeight="1.65">
                    {signal.text}
                  </Text>
                </Flex>
              ))}
            </VStack>
          </Flex>
        </Container>
      </Box>

      <Box className="crhp-closing-section" py={{ base: 12, md: 16 }}>
        <Container className="crhp-closing-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <Box className="crhp-closing-callout" bg="ui.surfaceSubtle" border="1px solid" borderColor="ui.borderSubtle" borderRadius="4px" p={{ base: 6, md: 8 }}>
            <Flex className="crhp-closing-layout" gap={5} align={{ base: "start", md: "center" }} justify="space-between" direction={{ base: "column", md: "row" }}>
              <HStack className="crhp-closing-summary" align="start" gap={4}>
                <Box className="crhp-closing-icon" color="theme.text" pt={1}>
                  <IconHeartHandshake size={28} />
                </Box>
                <Box className="crhp-closing-copy">
                  <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="var(--chakra-font-sizes-2xl)" letterSpacing="0" mb={2}>
                    Coherence can be built with software, service, or both.
                  </Heading>
                  <Text color="theme.textMuted" maxW="720px" lineHeight="1.7">
                    Some clients need a clean place to begin. Others need a partner who helps carry the knowledge-building practice until the organization owns it fully. We offer both.
                  </Text>
                </Box>
              </HStack>
              <Button asChild maxW="full" h="auto" py={3} whiteSpace="normal" variant="solid" borderRadius="3px">
                <Link textDecoration="none" _focusVisible={{ outline: "3px solid", outlineColor: "ui.borderControl", outlineOffset: "2px" }} color="theme.accentText" _hover={{ color: "theme.accentText" }} as={NextLink} href="/contact?interest=stewardship">
                  <HStack className="crhp-cta-label" gap={2}>
                    <Text>Talk through fit</Text>
                    <IconCompass size={17} />
                  </HStack>
                </Link>
              </Button>
            </Flex>
          </Box>
        </Container>
      </Box>

      <HomeVariantSwitcher activeHref="/" />
    </Box>
  );
}

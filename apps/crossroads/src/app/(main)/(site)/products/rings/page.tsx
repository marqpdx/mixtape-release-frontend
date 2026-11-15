// apps/crossroads/src/app/(main)/(site)/products/rings/page.tsx

"use client";

import NextLink from "next/link";
import { productArtwork } from "../artwork";
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
import { IconArrowRight, IconCircleDot, IconCircles, IconCompass, IconSparkles } from "@tabler/icons-react";

const rings = [
  {
    name: "Foundation",
    title: "Trust, structure, longevity",
    body: "The center is canon: what the organization has reviewed, confirmed, and chosen to stand behind. Building from here is what makes every AI and human next step reliable.",
  },
  {
    name: "Reach",
    title: "More material under stewardship",
    body: "The practice widens. Clio can see drafts, uploads, references, and Voice Findings alongside canon — without treating all of it as equally trusted. More attention can be applied to more material.",
  },
  {
    name: "Knowledge Shaping Engagement",
    title: "Meaning-making with MB",
    body: "A bounded engagement where Mindful Brilliance helps find patterns, implicit structure, tacit relationships, and canonization candidates — the meaning that lies between the documents.",
  },
  {
    name: "Atrium",
    title: "Context-rich work",
    body: "The Codex becomes active context for everyday conversations, decisions, agents, and workflows. The knowledge built with care now works on behalf of the people who built it.",
  },
];

const pricing = [
  ["Catalyst Foundation", "$20/mo", "Canon-first subscription"],
  ["Catalyst Reach", "$35/mo", "Canon + non-canon subscription"],
  ["Catalyst Acceleration — Knowledge Shaping Engagement", "$1,000", "MB-led, bounded, repeatable"],
];

export default function ProductRingsPage() {
  return (
    <Box
      className="crrings-root"
      bg="theme.bg"
      color="theme.text"
      minH="100vh"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <Box className="crrings-masthead" borderBottom="2px solid" borderColor={productArtwork.gold}>
        <Container className="crrings-masthead-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
          <Flex className="crrings-hero-layout" gap={{ base: 10, lg: 16 }} align="center" direction={{ base: "column", lg: "row" }}>
            <VStack className="crrings-hero-copy" align="start" gap={6} flex="1">
              <Badge bg="ui.surfaceSubtle" color="theme.text" borderRadius="3px" px={2} py={1} letterSpacing="0.12em" textTransform="uppercase">
                Product B: Rings
              </Badge>
              <Heading as="h1" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "3xl", md: "5xl" }} lineHeight="1.08" letterSpacing="0">
                Knowledge expands from a trusted center.
              </Heading>
              <Text color="theme.textMuted" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" maxW="65ch">
                Catalyst is a knowledge practice, not a file repository. It begins with what the organization truly stands behind — canon — and expands outward as more material, relationships, and work comes under stewardship.
              </Text>
            </VStack>

            <Box className="crrings-visual" position="relative" w={{ base: "100%", md: "430px" }} maxW={{ base: "320px", md: "430px" }} aspectRatio="1" flexShrink={0}>
              {[0, 1, 2, 3].map((ring) => (
                <Box className="crrings-artwork-ring"
                  key={ring}
                  position="absolute"
                  inset={`${ring * 12}%`}
                  border="1px solid"
                  borderColor={ring === 0 ? productArtwork.blue : productArtwork.gold}
                  borderRadius="999px"
                  opacity={1 - ring * 0.12}
                />
              ))}
              <Flex className="crrings-visual-copy" position="absolute" inset="25%" bg="theme.surface" border="1px solid" borderColor="ui.borderSubtle" borderRadius="999px" align="center" justify="center" textAlign="center" p={{ base: 3, md: 5 }}>
                <VStack className="crrings-visual-label" gap={1}>
                  <IconCircleDot size={26} />
                  <Text fontFamily='Georgia, "Times New Roman", serif' fontSize={{ base: "xl", md: "2xl" }}>
                    Foundation
                  </Text>
                  <Text color="theme.textMuted" fontSize="sm">trusted canon</Text>
                </VStack>
              </Flex>
            </Box>
          </Flex>
        </Container>
      </Box>

      <Container className="crrings-ring-copy" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
        <SimpleGrid className="crrings-ring-grid" columns={{ base: 1, md: 2 }} gap={4}>
          {rings.map((ring, index) => {
            const Icon = index === 0 ? IconCircleDot : index === 1 ? IconCircles : index === 2 ? IconSparkles : IconCompass;
            return (
              <Box key={ring.name} className="crrings-ring-card" bg="theme.surface" border="1px solid" borderColor="ui.borderSubtle" borderRadius="4px" p={6}>
                <HStack className="crrings-ring-eyebrow" gap={3} mb={4} color="theme.text">
                  <Icon size={26} />
                  <Text color="theme.textMuted" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
                    Ring {index + 1}
                  </Text>
                </HStack>
                <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="0" mb={3}>
                  {ring.name}
                </Heading>
                <Text color="theme.text" fontWeight="700" mb={3}>{ring.title}</Text>
                <Text color="theme.textMuted" lineHeight="1.7">{ring.body}</Text>
              </Box>
            );
          })}
        </SimpleGrid>
      </Container>

      <Box className="crrings-pricing" bg="theme.surface" borderTop="1px solid" borderColor="ui.borderSubtle" py={{ base: 12, md: 16 }}>
        <Container className="crrings-pricing-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <Text color="theme.textMuted" fontSize="sm" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" mb={3}>
            Pricing after the story
          </Text>
          <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="0" mb={8}>
            Subscriptions widen the practice. The engagement reshapes what the practice can see.
          </Heading>
          <VStack className="crrings-pricing-rows" align="stretch" gap={0} borderTop="1px solid" borderColor="ui.borderSubtle">
            {pricing.map(([name, price, detail]) => (
              <Flex key={name} className="crrings-price-row" gap={5} align={{ base: "start", md: "center" }} justify="space-between" direction={{ base: "column", md: "row" }} py={5} borderBottom="1px solid" borderColor="ui.borderSubtle">
                <Box className="crrings-price-description">
                  <Text fontWeight="700">{name}</Text>
                  <Text color="theme.textMuted">{detail}</Text>
                </Box>
                <Text color="theme.text" fontFamily='Georgia, "Times New Roman", serif' fontSize="2xl" minW="120px" textAlign={{ base: "left", md: "right" }}>
                  {price}
                </Text>
              </Flex>
            ))}
          </VStack>
          <Button asChild maxW="full" h="auto" py={3} whiteSpace="normal" mt={8} variant="solid" borderRadius="3px">
            <Link color="theme.accentText" textDecoration="none" _hover={{ color: "theme.accentText" }} _focusVisible={{ outline: "3px solid", outlineColor: "ui.borderControl", outlineOffset: "2px" }} as={NextLink} href="/contact?interest=catalyst-rings">
              <HStack className="crrings-inquiry-label" gap={2}>
                <Text>Start with your center</Text>
                <IconArrowRight size={17} />
              </HStack>
            </Link>
          </Button>
        </Container>
      </Box>
    </Box>
  );
}

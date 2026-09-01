// apps/crossroads/src/app/(main)/(site)/products/rings/page.tsx

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
import { IconArrowRight, IconCircleDot, IconCircles, IconCompass, IconSparkles } from "@tabler/icons-react";

const rings = [
  {
    name: "Foundation",
    title: "Trust, structure, longevity",
    body: "The center is canon. The organization begins deciding what it knows, what language it uses, and what deserves to last.",
  },
  {
    name: "Reach",
    title: "More material under stewardship",
    body: "The practice widens. Beryl can see drafts, uploads, references, and Voice Findings while still respecting the canon boundary.",
  },
  {
    name: "Knowledge Shaping Engagement",
    title: "Relationship discovery and tacit synthesis",
    body: "Mindful Brilliance helps find patterns, Piton candidates, implicit structure, and canonization candidates for review.",
  },
  {
    name: "Atrium",
    title: "Context-rich work",
    body: "The Codex becomes active context for everyday conversations, decisions, agents, and workflows.",
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
      bg="#F4F5F8"
      color="#1A2138"
      minH="100vh"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <Box className="crrings-masthead" borderBottom="2px solid" borderColor="#B8922A">
        <Container maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
          <Flex gap={{ base: 10, lg: 16 }} align="center" direction={{ base: "column", lg: "row" }}>
            <VStack className="crrings-hero-copy" align="start" gap={6} flex="1">
              <Badge bg="#E8ECF6" color="#2B3D6B" borderRadius="3px" px={2} py={1} letterSpacing="0.12em" textTransform="uppercase">
                Product B: Rings
              </Badge>
              <Heading as="h1" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "3xl", md: "5xl" }} lineHeight="1.08" letterSpacing="0">
                Knowledge expands from a trusted center.
              </Heading>
              <Text color="#5C6880" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" maxW="65ch">
                Catalyst is a knowledge practice, not a file repository. It begins with a canon your people can trust, then expands outward as more material, relationships, and workflows come under stewardship.
              </Text>
            </VStack>

            <Box className="crrings-visual" position="relative" w={{ base: "320px", md: "430px" }} h={{ base: "320px", md: "430px" }} flexShrink={0}>
              {[0, 1, 2, 3].map((ring) => (
                <Box
                  key={ring}
                  position="absolute"
                  inset={`${ring * 12}%`}
                  border="1px solid"
                  borderColor={ring === 0 ? "#1E4BD2" : "#B8922A"}
                  borderRadius="999px"
                  opacity={1 - ring * 0.12}
                />
              ))}
              <Flex position="absolute" inset="33%" bg="#FFFFFF" border="1px solid" borderColor="#DDE1ED" borderRadius="999px" align="center" justify="center" textAlign="center" p={5}>
                <VStack gap={1}>
                  <IconCircleDot size={26} color="#1E4BD2" />
                  <Text fontFamily='Georgia, "Times New Roman", serif' fontSize={{ base: "xl", md: "2xl" }}>
                    Foundation
                  </Text>
                  <Text color="#5C6880" fontSize="sm">trusted canon</Text>
                </VStack>
              </Flex>
            </Box>
          </Flex>
        </Container>
      </Box>

      <Container className="crrings-ring-copy" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          {rings.map((ring, index) => {
            const Icon = index === 0 ? IconCircleDot : index === 1 ? IconCircles : index === 2 ? IconSparkles : IconCompass;
            return (
              <Box key={ring.name} className="crrings-ring-card" bg="#FFFFFF" border="1px solid" borderColor="#DDE1ED" borderRadius="4px" p={6}>
                <HStack gap={3} mb={4} color="#1E4BD2">
                  <Icon size={26} />
                  <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
                    Ring {index + 1}
                  </Text>
                </HStack>
                <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="0" mb={3}>
                  {ring.name}
                </Heading>
                <Text color="#1A2138" fontWeight="700" mb={3}>{ring.title}</Text>
                <Text color="#5C6880" lineHeight="1.7">{ring.body}</Text>
              </Box>
            );
          })}
        </SimpleGrid>
      </Container>

      <Box className="crrings-pricing" bg="#FFFFFF" borderTop="1px solid" borderColor="#DDE1ED" py={{ base: 12, md: 16 }}>
        <Container maxW="1180px" px={{ base: 5, md: 8 }}>
          <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" mb={3}>
            Pricing after the story
          </Text>
          <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="0" mb={8}>
            Subscriptions widen the practice. The engagement reshapes what the practice can see.
          </Heading>
          <VStack align="stretch" gap={0} borderTop="1px solid" borderColor="#DDE1ED">
            {pricing.map(([name, price, detail]) => (
              <Flex key={name} className="crrings-price-row" gap={5} align={{ base: "start", md: "center" }} justify="space-between" direction={{ base: "column", md: "row" }} py={5} borderBottom="1px solid" borderColor="#DDE1ED">
                <Box>
                  <Text fontWeight="700">{name}</Text>
                  <Text color="#5C6880">{detail}</Text>
                </Box>
                <Text color="#1E4BD2" fontFamily='Georgia, "Times New Roman", serif' fontSize="2xl" minW="120px" textAlign={{ base: "left", md: "right" }}>
                  {price}
                </Text>
              </Flex>
            ))}
          </VStack>
          <Button asChild mt={8} bg="#1A2138" color="white" borderRadius="3px" _hover={{ bg: "#2B3D6B" }}>
            <Link as={NextLink} href="/contact?interest=catalyst-rings">
              <HStack gap={2}>
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

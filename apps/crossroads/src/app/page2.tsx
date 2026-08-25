// apps/crossroads/src/app/page2.tsx

"use client";

import NextLink from "next/link";
import {
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
import { IconArrowRight } from "@tabler/icons-react";
import HomeVariantSwitcher from "@components/home/HomeVariantSwitcher";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";

const situations = [
  {
    title: "Your knowledge is already there, but scattered.",
    body: "It lives in email, documents, old decisions, staff memory, supplier details, and the way people explain things when a problem appears. Catalyst helps turn that scattered material into a Codex your organization can actually trust.",
  },
  {
    title: "Your group has outgrown the tools around it.",
    body: "Facebook Groups, WhatsApp, and chat threads can hold activity, but they do not preserve meaning very well. Mixtape gives a group a place to gather and remember what its people decide is worth keeping.",
  },
  {
    title: "You may want to be found, but not before you are ready.",
    body: "Tapestry is the opt-in relational map inside Crossroads. It can help people, groups, projects, services, and aligned work discover one another when participation makes sense.",
  },
];

export default function CrossroadsHomepageWordy() {
  return (
    <Box className="crh2-root" minH="100vh" bg="#FFFAF0" color="#1D2925">
      <UnifiedNavbar />

      <Container className="crh2-main" maxW="980px" py={{ base: 12, md: 20 }}>
        <VStack align="stretch" gap={{ base: 10, md: 14 }}>
          <VStack className="crh2-hero" align="start" gap={6}>
            <Text color="#A84B38" fontWeight="700">
              Crossroads
            </Text>
            <Heading as="h1" fontSize={{ base: "4xl", md: "6xl" }} lineHeight="1" letterSpacing="0" maxW="840px">
              A place for the work of gathering, knowing, and finding one another.
            </Heading>
            <Text fontSize={{ base: "lg", md: "xl" }} lineHeight="1.75" color="#44554F" maxW="820px">
              Crossroads is an orienting place first. Some people arrive with a group that needs a calmer home. Some arrive with a business or practice whose knowledge is spread across too many places. Some are ready for a wider relational map. Many will want only one of these at the start.
            </Text>
            <Text fontSize={{ base: "md", md: "lg" }} lineHeight="1.75" color="#44554F" maxW="820px">
              The point is not to force every person into community, software, or AI. The point is to see the actual need clearly, then offer the right shape: Catalyst, Mixtape, Tapestry, or the stewardship that helps keep the whole thing alive.
            </Text>
            <HStack className="crh2-actions" gap={3} flexWrap="wrap">
              <Button asChild bg="#A84B38" color="#FFF7EA" _hover={{ bg: "#7C372A" }}>
                <Link as={NextLink} href="/contact?interest=start">
                  <HStack gap={2}>
                    <Text>Start a conversation</Text>
                    <IconArrowRight size={17} />
                  </HStack>
                </Link>
              </Button>
              <Button asChild variant="outline" borderColor="#A84B38" color="#7C372A" _hover={{ bg: "rgba(168, 75, 56, 0.08)" }}>
                <Link as={NextLink} href="/about">
                  <Text>Read more</Text>
                </Link>
              </Button>
            </HStack>
          </VStack>

          <SimpleGrid className="crh2-situation-grid" columns={{ base: 1, md: 3 }} gap={5}>
            {situations.map((situation) => (
              <Box key={situation.title} className="crh2-situation-card" borderTop="3px solid" borderColor="#A84B38" pt={5}>
                <Heading as="h2" fontSize="xl" letterSpacing="0" lineHeight="1.2" mb={3}>
                  {situation.title}
                </Heading>
                <Text color="#44554F" lineHeight="1.7">
                  {situation.body}
                </Text>
              </Box>
            ))}
          </SimpleGrid>

          <Box className="crh2-summary" bg="#23352F" color="#FFF7EA" borderRadius="8px" p={{ base: 5, md: 8 }}>
            <Flex direction={{ base: "column", md: "row" }} gap={6} justify="space-between">
              <Box maxW="650px">
                <Heading as="h2" fontSize={{ base: "2xl", md: "3xl" }} letterSpacing="0" mb={3}>
                  Private by default. Relational by invitation.
                </Heading>
                <Text color="rgba(255, 247, 234, 0.82)" lineHeight="1.75">
                  You can begin with a solitary Catalyst knowledge home, a Mixtape group home, or both. Community participation and relational discovery can be turned on later, when the Tapestry is useful rather than distracting.
                </Text>
              </Box>
              <Button asChild alignSelf={{ base: "start", md: "center" }} bg="#FFF7EA" color="#23352F" _hover={{ bg: "#F1E1C6" }}>
                <Link as={NextLink} href="/contact?interest=orientation">
                  <Text>Get oriented</Text>
                </Link>
              </Button>
            </Flex>
          </Box>
        </VStack>
      </Container>

      <HomeVariantSwitcher activeHref="/page2" />
    </Box>
  );
}

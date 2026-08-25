// apps/crossroads/src/app/page1.tsx

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
import { IconArrowRight, IconBook2, IconMap2, IconMessageCircle2 } from "@tabler/icons-react";
import HomeVariantSwitcher from "@components/home/HomeVariantSwitcher";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";

const offerings = [
  {
    name: "Catalyst",
    title: "For knowledge that needs to hold together",
    body: "A private Codex for the material your organization depends on: documents, email, procedures, decisions, and living know-how.",
    icon: IconBook2,
    href: "/contact?interest=catalyst",
  },
  {
    name: "Mixtape",
    title: "For groups that need a better home",
    body: "A calmer gathering place for communities, clubs, nonprofits, and member groups ready to own their shared context.",
    icon: IconMessageCircle2,
    href: "/contact?interest=mixtape",
  },
  {
    name: "Tapestry",
    title: "For discovery when you are ready",
    body: "An opt-in relational map of people, groups, projects, needs, and nearby work across Crossroads.",
    icon: IconMap2,
    href: "/contact?interest=tapestry",
  },
];

export default function CrossroadsHomepageStructured() {
  return (
    <Box className="crh1-root" minH="100vh" bg="#F6F0E4" color="#1C2824">
      <UnifiedNavbar />

      <Box
        className="crh1-hero"
        borderBottom="1px solid"
        borderColor="#DFD0B7"
        backgroundImage="linear-gradient(135deg, rgba(188, 83, 60, 0.11) 0%, transparent 34%), linear-gradient(90deg, #F6F0E4 0%, #FFF9EF 100%)"
      >
        <Container className="crh1-hero-inner" maxW="1120px" py={{ base: 12, md: 20 }}>
          <SimpleGrid className="crh1-hero-grid" columns={{ base: 1, lg: 2 }} gap={{ base: 10, lg: 14 }} alignItems="center">
            <VStack className="crh1-hero-copy" align="start" gap={6}>
              <Badge bg="#E7D9C0" color="#7A3E31" borderRadius="full" px={3} py={1}>
                Crossroads
              </Badge>
              <Heading as="h1" fontSize={{ base: "4xl", md: "5xl" }} lineHeight="1.02" letterSpacing="0">
                Start with the need in front of you.
              </Heading>
              <Text fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" color="#465751">
                Some people need a place for their group. Some need a trustworthy home for organizational knowledge. Some are ready to be found in a wider relational map. Crossroads can hold each of those shapes without forcing them into one story too early.
              </Text>
              <HStack className="crh1-actions" gap={3} flexWrap="wrap">
                <Button asChild bg="#B9533E" color="#FFF8EC" _hover={{ bg: "#913F31" }}>
                  <Link as={NextLink} href="/contact?interest=start">
                    <HStack gap={2}>
                      <Text>Describe your situation</Text>
                      <IconArrowRight size={17} />
                    </HStack>
                  </Link>
                </Button>
                <Button asChild variant="outline" borderColor="#B9533E" color="#7A3E31" _hover={{ bg: "rgba(185, 83, 62, 0.09)" }}>
                  <Link as={NextLink} href="/about">
                    <Text>Learn the frame</Text>
                  </Link>
                </Button>
              </HStack>
            </VStack>

            <Box
              className="crh1-map-panel"
              bg="#FFF9EF"
              border="1px solid"
              borderColor="#DFD0B7"
              borderRadius="8px"
              p={{ base: 5, md: 7 }}
              boxShadow="0 24px 70px rgba(63, 47, 33, 0.14)"
            >
              <VStack align="stretch" gap={4}>
                {["Private knowledge", "Group collaboration", "Opt-in discovery"].map((item, index) => (
                  <Flex
                    key={item}
                    align="center"
                    justify="space-between"
                    gap={4}
                    border="1px solid"
                    borderColor="#E6D8C1"
                    borderRadius="8px"
                    px={4}
                    py={3}
                    bg={index === 1 ? "#F4E8D5" : "#FFFDF8"}
                  >
                    <Text fontWeight="700">{item}</Text>
                    <Text color="#8D4A3A">0{index + 1}</Text>
                  </Flex>
                ))}
              </VStack>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      <Box className="crh1-offerings" py={{ base: 10, md: 16 }}>
        <Container className="crh1-offerings-inner" maxW="1120px">
          <SimpleGrid className="crh1-offering-grid" columns={{ base: 1, md: 3 }} gap={5}>
            {offerings.map((offering) => {
              const Icon = offering.icon;
              return (
                <Box key={offering.name} className="crh1-offering-card" bg="#FFF9EF" border="1px solid" borderColor="#DFD0B7" borderRadius="8px" p={6}>
                  <VStack align="start" gap={4}>
                    <Box color="#A84B38">
                      <Icon size={26} />
                    </Box>
                    <Box>
                      <Text color="#A84B38" fontWeight="700" mb={2}>
                        {offering.name}
                      </Text>
                      <Heading as="h2" fontSize="xl" letterSpacing="0" mb={3}>
                        {offering.title}
                      </Heading>
                      <Text color="#4A5C55" lineHeight="1.65">
                        {offering.body}
                      </Text>
                    </Box>
                    <Button asChild variant="ghost" color="#A84B38" px={0} _hover={{ bg: "transparent", color: "#7C372A" }}>
                      <Link as={NextLink} href={offering.href}>
                        <HStack gap={2}>
                          <Text>Explore</Text>
                          <IconArrowRight size={16} />
                        </HStack>
                      </Link>
                    </Button>
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>
        </Container>
      </Box>

      <HomeVariantSwitcher activeHref="/page1" />
    </Box>
  );
}

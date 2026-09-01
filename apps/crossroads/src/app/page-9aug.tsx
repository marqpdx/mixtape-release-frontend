// apps/crossroads/src/app/page.tsx

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
import UnifiedNavbar from "@components/layout/UnifiedNavbar";

const needs = [
  {
    label: "For work with too much scattered knowledge",
    body: "A practice, nonprofit, association, or small company has years of useful material, but no shared place where it becomes coherent.",
    icon: IconBook2,
  },
  {
    label: "For groups outgrowing borrowed platforms",
    body: "The group is real, the relationships matter, and the work deserves more than a stream owned by someone else's attention business.",
    icon: IconUsers,
  },
  {
    label: "For people ready to be found carefully",
    body: "Some groups want to be private. Some want the right neighbors, collaborators, clients, or allies to discover them when the timing is right.",
    icon: IconMap2,
  },
];

const productSignals = [
  {
    name: "Catalyst",
    text: "A private knowledge environment for making organizational memory useful.",
  },
  {
    name: "Mixtape",
    text: "A collaborative work area for groups, writing, dispatches, and shared cadence.",
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
      bg="#F4F5F8"
      color="#1A2138"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <UnifiedNavbar />

      <Box className="crhp-masthead" borderBottom="2px solid" borderColor="#B8922A">
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
                    bg="#E8ECF6"
                    color="#2B3D6B"
                    borderRadius="3px"
                    px={2}
                    py={1}
                    fontSize="10.5px"
                    letterSpacing="0.12em"
                    textTransform="uppercase"
                  >
                    {tag}
                  </Badge>
                ))}
              </HStack>

              <Box>
                <Heading
                  as="h1"
                  fontFamily='Georgia, "Times New Roman", serif'
                  fontSize={{ base: "3xl", md: "5xl", xl: "6xl" }}
                  fontWeight="400"
                  lineHeight="1.04"
                  letterSpacing="0"
                  maxW="760px"
                >
                  A place for people whose work needs memory, cadence, and a wider map.
                </Heading>
                <Text
                  mt={6}
                  fontSize={{ base: "lg", md: "xl" }}
                  lineHeight="1.7"
                  color="#5C6880"
                  maxW="65ch"
                >
                  Crossroads helps groups and organizations gather what they know, coordinate what they are building, and choose when to become visible to a more relational commons.
                </Text>
              </Box>

              <HStack className="crhp-hero-actions" gap={3} flexWrap="wrap">
                <Button asChild size="lg" bg="#1E4BD2" color="white" borderRadius="3px" _hover={{ bg: "#173AA4" }}>
                  <Link as={NextLink} href="/products">
                    <HStack gap={2}>
                      <Text>See the product paths</Text>
                      <IconArrowRight size={18} />
                    </HStack>
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" borderColor="#B8922A" color="#1A2138" borderRadius="3px">
                  <Link as={NextLink} href="/contact?interest=inquiry">
                    <Text>Start an inquiry</Text>
                  </Link>
                </Button>
              </HStack>
            </VStack>

            <Box className="crhp-hero-plate" flex="0 1 410px" w="100%">
              <Box
                className="crhp-image-frame"
                h={{ base: "360px", md: "520px" }}
                bgImage={`linear-gradient(180deg, rgba(26, 33, 56, 0.08), rgba(26, 33, 56, 0.16)), url(${backgroundImage})`}
                bgSize="cover"
                backgroundPosition="center"
                border="1px solid"
                borderColor="#DDE1ED"
                borderRadius="4px"
              />
              <Box className="crhp-thesis" mt={5} bg="#EEF2FD" borderLeft="3px solid" borderColor="#1E4BD2" p={5}>
                <Text fontFamily='Georgia, "Times New Roman", serif' lineHeight="1.65" color="#1A2138">
                  The question is rarely just what software to buy. The question is how a group keeps becoming more coherent without losing its human judgment.
                </Text>
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>

      <Box className="crhp-needs-section" py={{ base: 12, md: 16 }}>
        <Container className="crhp-needs-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <VStack align="stretch" gap={8}>
            <Box className="crhp-section-heading" maxW="760px">
              <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                What brings people here
              </Text>
              <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="0">
                Crossroads starts by seeing the actual pressure.
              </Heading>
            </Box>

            <SimpleGrid className="crhp-need-grid" columns={{ base: 1, md: 3 }} gap={4}>
              {needs.map((need) => {
                const Icon = need.icon;
                return (
                  <Box
                    className="crhp-need-card"
                    key={need.label}
                    bg="#FFFFFF"
                    border="1px solid"
                    borderColor="#DDE1ED"
                    borderRadius="4px"
                    p={6}
                    minH="260px"
                  >
                    <VStack align="start" gap={5}>
                      <Box color="#1E4BD2">
                        <Icon size={28} />
                      </Box>
                      <Box>
                        <Heading as="h3" fontSize="sm" color="#B8922A" letterSpacing="0.06em" textTransform="uppercase" mb={3}>
                          {need.label}
                        </Heading>
                        <Text color="#5C6880" lineHeight="1.7">
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

      <Box className="crhp-product-section" bg="#FFFFFF" borderTop="1px solid" borderBottom="1px solid" borderColor="#DDE1ED" py={{ base: 12, md: 16 }}>
        <Container className="crhp-product-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <Flex gap={{ base: 8, lg: 14 }} align={{ base: "start", lg: "center" }} direction={{ base: "column", lg: "row" }}>
            <Box className="crhp-product-copy" flex="1" maxW="620px">
              <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                Three ways to begin
              </Text>
              <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="0" mb={5}>
                Begin privately. Add the collective layer when it becomes useful.
              </Heading>
              <Text color="#5C6880" lineHeight="1.7" maxW="65ch">
                Catalyst, Mixtape, and Tapestry are not competing doors. They are different forms Crossroads can take as a client's story becomes clearer.
              </Text>
            </Box>

            <VStack className="crhp-product-list" align="stretch" gap={0} flex="1" w="100%" borderTop="1px solid" borderColor="#DDE1ED">
              {productSignals.map((signal) => (
                <Flex
                  className="crhp-product-row"
                  key={signal.name}
                  gap={5}
                  align="start"
                  py={5}
                  borderBottom="1px solid"
                  borderColor="#DDE1ED"
                >
                  <Text color="#1E4BD2" fontFamily='Georgia, "Times New Roman", serif' fontSize="2xl" minW="112px">
                    {signal.name}
                  </Text>
                  <Text color="#5C6880" lineHeight="1.65">
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
          <Box className="crhp-closing-callout" bg="#FDF8EE" border="1px solid" borderColor="#DDE1ED" borderRadius="4px" p={{ base: 6, md: 8 }}>
            <Flex gap={5} align={{ base: "start", md: "center" }} justify="space-between" direction={{ base: "column", md: "row" }}>
              <HStack align="start" gap={4}>
                <Box color="#B8922A" pt={1}>
                  <IconHeartHandshake size={28} />
                </Box>
                <Box>
                  <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "xl", md: "2xl" }} letterSpacing="0" mb={2}>
                    Coherence can be built with software, service, or both.
                  </Heading>
                  <Text color="#5C6880" maxW="720px" lineHeight="1.7">
                    Some clients need a clean place to begin. Some need help operating the approvals, cadence, and knowledge-building loop until the organization can carry it well.
                  </Text>
                </Box>
              </HStack>
              <Button asChild bg="#1A2138" color="white" borderRadius="3px" _hover={{ bg: "#2B3D6B" }}>
                <Link as={NextLink} href="/contact?interest=stewardship">
                  <HStack gap={2}>
                    <Text>Talk through fit</Text>
                    <IconCompass size={17} />
                  </HStack>
                </Link>
              </Button>
            </Flex>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}

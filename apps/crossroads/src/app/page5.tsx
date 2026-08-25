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

const needs = [
  {
    label: "For work that lives in too many places",
    body: "The knowledge that matters most tends to scatter across files, systems, people's heads, and conversations that were never designed to hold it. Crossroads gives it a home worth tending.",
    icon: IconBook2,
  },
  {
    label: "For groups that need more than a channel",
    body: "Most collaboration tools are built for volume and velocity. Some groups need a space that rewards depth, continuity, and care - where the important things do not get buried.",
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
    name: "Mixtape",
    text: "A collaborative work home for groups who need depth, continuity, and care in one place.",
  },
  {
    name: "Tapestry",
    text: "An opt-in collective layer for relational discovery across the wider Crossroads map.",
  },
];

export default function CrossroadsHomepagePrinciplesClone() {
  const backgroundImage = "/homepage/noaa-zdj3p00Rep0-unsplash.jpg";

  return (
    <Box
      className="crh5-root crh5-art-deco"
      minH="100vh"
      bg="#F4F5F8"
      color="#1A2138"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <UnifiedNavbar />

      <Box className="crh5-masthead" borderBottom="2px solid" borderColor="#B8922A">
        <Container className="crh5-hero-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 18 }}>
          <Flex
            className="crh5-hero-grid"
            minH={{ base: "auto", lg: "calc(100vh - 180px)" }}
            align="stretch"
            justify="space-between"
            gap={{ base: 10, lg: 16 }}
            direction={{ base: "column", lg: "row" }}
          >
            <VStack
              className="crh5-hero-copy"
              align="start"
              justify="space-between"
              gap={7}
              flex="1 1 58%"
              maxW="720px"
              minH="100%"
            >
              <Box>
                <HStack className="crh5-tags" gap={2} flexWrap="wrap" mb={7}>
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

                <Heading
                  as="h1"
                  fontFamily='Georgia, "Times New Roman", serif'
                  fontSize={{ base: "3xl", md: "4xl" }}
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
                  fontSize="var(--chakra-font-sizes-2xl)"
                  fontWeight="400"
                  lineHeight="1.1"
                  letterSpacing="0"
                  color="#5C6880"
                  maxW="760px"
                  mt={2}
                >
                  ...more reason to tend what truly matters.
                </Heading>

                <VStack align="start" gap={3} mt={6} maxW="65ch">
                  <Text fontSize="var(--chakra-font-sizes-md)" lineHeight="1.7" color="#5C6880">
                    We{" "}
                    <Text as="span" fontWeight="700" color="#1A2138">
                      act resourcefully
                    </Text>
                    . We use powerful tools with humbleness, clarity, and proportion so the work gets lighter without becoming wasteful.
                  </Text>
                  <Text fontSize="var(--chakra-font-sizes-md)" lineHeight="1.7" color="#5C6880">
                    We recognize that{" "}
                    <Text as="span" fontWeight="700" color="#1A2138">
                      attention is precious
                    </Text>
                    . This scarce human resource allows for discernment, and knowing what counts.
                  </Text>
                  <Text fontSize="var(--chakra-font-sizes-md)" lineHeight="1.7" color="#5C6880">
                    We know, that{" "}
                    <Text as="span" fontWeight="700" color="#1A2138">
                      human curation
                    </Text>{" "}
                    is vital. AI can sift and suggest, but people still decide what becomes true, and trusted knowledge.
                  </Text>
                  <Box w="100%" pt={2} pb={1}>
                    <Box w="72px" borderTop="1px solid" borderColor="#B8922A" opacity={0.7} />
                  </Box>
                  <Text fontSize="var(--chakra-font-sizes-md)" lineHeight="1.7" color="#5C6880">
                    <Link
                      as={NextLink}
                      href="/"
                      color="fg.subtle"
                      fontWeight="700"
                      textDecoration="underline"
                      textDecorationStyle="dotted"
                      textDecorationColor="rgba(26, 33, 56, 0.22)"
                      textUnderlineOffset="0.18em"
                    >
                      Crossroads
                    </Link>{" "}
                    is a place to orient, to what one knows, to spaciousness of thought, to working well together. Drop us a{" "}
                    <Link
                      as={NextLink}
                      href="/contact?interest=inquiry"
                      color="fg.subtle"
                      fontWeight="700"
                      textDecoration="underline"
                      textDecorationStyle="dotted"
                      textDecorationColor="rgba(26, 33, 56, 0.22)"
                      textUnderlineOffset="0.18em"
                    >
                      line
                    </Link>
                    , or keep reading to learn more.
                  </Text>
                </VStack>
              </Box>
            </VStack>

            <Box className="crh5-hero-plate" flex="0 1 410px" w="100%">
              <Box
                className="crh5-image-frame"
                h={{ base: "360px", md: "520px" }}
                bgImage={`linear-gradient(180deg, rgba(26, 33, 56, 0.08), rgba(26, 33, 56, 0.16)), url(${backgroundImage})`}
                bgSize="cover"
                backgroundPosition="center"
                border="1px solid"
                borderColor="#DDE1ED"
                borderRadius="4px"
              />
            </Box>
          </Flex>
        </Container>
      </Box>

      <Box
        className="crh5-thesis-callout-wrap"
        py={{ base: 7, md: 8 }}
        bg="theme.surface"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="theme.border"
        boxShadow="inset 0 3px 0 0 var(--theme-accent)"
      >
        <Container className="crh5-thesis-callout-inner" maxW="100%" px={{ base: 2, md: 3 }}>
          <Box className="crh5-thesis-callout" px={{ base: 2, md: 3 }} py={{ base: 4, md: 5 }}>
            <VStack align="center" textAlign="center" gap={1}>
              <Text
                fontFamily='Georgia, "Times New Roman", serif'
                lineHeight="1.65"
                color="theme.text"
                fontSize="var(--chakra-font-sizes-2xl)"
              >
                Information has never been more available.
              </Text>
              <Text
                fontFamily='Georgia, "Times New Roman", serif'
                lineHeight="1.65"
                color="theme.text"
                fontSize="var(--chakra-font-sizes-2xl)"
              >
                Working together has never been more vital.
              </Text>
            </VStack>
          </Box>
        </Container>
      </Box>

      <Box className="crh5-needs-section" py={{ base: 12, md: 16 }}>
        <Container className="crh5-needs-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <VStack align="stretch" gap={8}>
            <Box className="crh5-section-heading" maxW="760px">
              <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                The product story starts with what we are trying to protect.
              </Text>
              <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="var(--chakra-font-sizes-2xl)" letterSpacing="0">
                Crossroads honors that knowledge lives everywhere.
              </Heading>
            </Box>

            <SimpleGrid className="crh5-need-grid" columns={{ base: 1, md: 3 }} gap={4}>
              {needs.map((need) => {
                const Icon = need.icon;
                return (
                  <Box
                    className="crh5-need-card"
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

      <Box
        className="crh5-section-actions-wrap"
        py={{ base: 6, md: 7 }}
        bg="bg.subtle"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="theme.border"
      >
        <Container className="crh5-section-actions-inner" maxW="100%" px={{ base: 2, md: 3 }}>
          <HStack className="crh5-section-actions" gap={3} flexWrap="wrap" justify="center" px={{ base: 2, md: 3 }}>
            <Button asChild size="lg" borderRadius="3px">
              <Link as={NextLink} href="/products">
                <HStack gap={2}>
                  <Text>See the product paths</Text>
                  <IconArrowRight size={18} />
                </HStack>
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" borderRadius="3px">
              <Link as={NextLink} href="/contact?interest=inquiry">
                <Text>Start an inquiry</Text>
              </Link>
            </Button>
          </HStack>
        </Container>
      </Box>

      <Box className="crh5-product-section" bg="#FFFFFF" borderTop="1px solid" borderBottom="1px solid" borderColor="#DDE1ED" py={{ base: 12, md: 16 }}>
        <Container className="crh5-product-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <Flex gap={{ base: 8, lg: 14 }} align={{ base: "start", lg: "center" }} direction={{ base: "column", lg: "row" }}>
            <Box className="crh5-product-copy" flex="1" maxW="620px">
              <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                Three ways to begin
              </Text>
              <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="var(--chakra-font-sizes-2xl)" letterSpacing="0" mb={5}>
                Begin with what you know.
              </Heading>
              <Text color="#5C6880" lineHeight="1.7" maxW="65ch">
                Catalyst, Mixtape, and Tapestry are not competing doors. They are different forms Crossroads can take as the work and the people doing it become clearer.
              </Text>
            </Box>

            <VStack className="crh5-product-list" align="stretch" gap={0} flex="1" w="100%" borderTop="1px solid" borderColor="#DDE1ED">
              {productSignals.map((signal) => (
                <Flex
                  className="crh5-product-row"
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

      <Box className="crh5-closing-section" py={{ base: 12, md: 16 }}>
        <Container className="crh5-closing-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <Box className="crh5-closing-callout" bg="#FDF8EE" border="1px solid" borderColor="#DDE1ED" borderRadius="4px" p={{ base: 6, md: 8 }}>
            <Flex gap={5} align={{ base: "start", md: "center" }} justify="space-between" direction={{ base: "column", md: "row" }}>
              <HStack align="start" gap={4}>
                <Box color="#B8922A" pt={1}>
                  <IconHeartHandshake size={28} />
                </Box>
                <Box>
                  <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="var(--chakra-font-sizes-2xl)" letterSpacing="0" mb={2}>
                    Coherence can be built with software, service, or both.
                  </Heading>
                  <Text color="#5C6880" maxW="720px" lineHeight="1.7">
                    Some clients need a clean place to begin. Others need a partner who helps carry the knowledge-building practice until the organization owns it fully. We offer both.
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

      <HomeVariantSwitcher activeHref="/page5" />
    </Box>
  );
}

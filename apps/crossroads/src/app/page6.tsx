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

const practiceRows = [
  {
    label: "We observe",
    body: "Acting on the mission keeps surfacing the same lessons: attention is precious, your work should remember, understanding is something you maintain, use the right tool for the work, let the tools change but keep the thread, and stay resourceful while keeping your agency.",
    icon: IconBook2,
  },
  {
    label: "We do",
    body: "We cultivate knowledge, build tools, steward continuity, convene people, publish what we learn, and help others become more capable. Sometimes that becomes software, sometimes consulting, sometimes field notes, and sometimes community space.",
    icon: IconUsers,
  },
  {
    label: "We invite",
    body: "Use something. Read something. Engage us. Join something. Share something. Bring your knowledge. Learn something. Help build abundance.",
    icon: IconMap2,
  },
];

const productSignals = [
  {
    name: "Catalyst",
    text: "A knowledge practice and software shape for tending what an organization knows, remembers, and decides to stand behind.",
  },
  {
    name: "Mixtape",
    text: "A collaborative home for continuity, community space, and the shared context that ordinary chat tools tend to lose.",
  },
  {
    name: "Tapestry",
    text: "A relational layer for discovery, participation, and the wider map of people, projects, places, and work.",
  },
];

export default function CrossroadsHomepageMissionVision() {
  const backgroundImage = "/homepage/noaa-zdj3p00Rep0-unsplash.jpg";

  return (
    <Box
      className="crh6-root crh6-art-deco"
      minH="100vh"
      bg="#F4F5F8"
      color="#1A2138"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <UnifiedNavbar />

      <Box className="crh6-masthead" borderBottom="2px solid" borderColor="#B8922A">
        <Container className="crh6-hero-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 18 }}>
          <Flex
            className="crh6-hero-grid"
            minH={{ base: "auto", lg: "calc(100vh - 180px)" }}
            align="stretch"
            justify="space-between"
            gap={{ base: 10, lg: 16 }}
            direction={{ base: "column", lg: "row" }}
          >
            <VStack
              className="crh6-hero-copy"
              align="start"
              justify="space-between"
              gap={7}
              flex="1 1 58%"
              maxW="760px"
              minH="100%"
            >
              <Box>
                <HStack className="crh6-tags" gap={2} flexWrap="wrap" mb={7}>
                  {["Crossroads", "Mission", "Vision", "Abundance"].map((tag) => (
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

                <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                  We believe
                </Text>
                <Heading
                  as="h1"
                  fontFamily='Georgia, "Times New Roman", serif'
                  fontSize={{ base: "3xl", md: "4xl" }}
                  fontWeight="400"
                  lineHeight="1.08"
                  letterSpacing="0"
                  maxW="760px"
                >
                  To explore and share knowledge in all its forms as abundantly and as resourcefully as possible.
                </Heading>

                <VStack align="start" gap={3} mt={6} maxW="68ch">
                  <Text fontSize="var(--chakra-font-sizes-md)" lineHeight="1.7" color="#5C6880">
                    We believe something, that belief gives us a vision of a better world, we choose to act, acting teaches us, those lessons become principles, and those principles inform what we make, share, and invite others into.
                  </Text>
                  <Text fontSize="var(--chakra-font-sizes-md)" lineHeight="1.7" color="#5C6880">
                    The mission is not simply to sell knowledge-management software. The software is one form that acting on the mission has taken.
                  </Text>
                  <Box w="100%" pt={2} pb={1}>
                    <Box w="72px" borderTop="1px solid" borderColor="#B8922A" opacity={0.7} />
                  </Box>
                  <Text fontSize="var(--chakra-font-sizes-md)" lineHeight="1.7" color="#5C6880" fontStyle="italic">
                    “The French had more material possessions, the Mi’kmaq conceded; but they had other, greater assets: ease, comfort and time.”
                  </Text>
                </VStack>
              </Box>
            </VStack>

            <Box className="crh6-hero-plate" flex="0 1 410px" w="100%">
              <Box
                className="crh6-image-frame"
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
        className="crh6-thesis-callout-wrap"
        py={{ base: 7, md: 8 }}
        bg="theme.surface"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="theme.border"
        boxShadow="inset 0 3px 0 0 var(--theme-accent)"
      >
        <Container className="crh6-thesis-callout-inner" maxW="100%" px={{ base: 2, md: 3 }}>
          <Box className="crh6-thesis-callout" px={{ base: 2, md: 3 }} py={{ base: 4, md: 5 }}>
            <VStack align="center" textAlign="center" gap={3} maxW="980px" mx="auto">
              <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
                We envision
              </Text>
              <Text
                fontFamily='Georgia, "Times New Roman", serif'
                lineHeight="1.5"
                color="theme.text"
                fontSize="var(--chakra-font-sizes-2xl)"
              >
                We want a world rich in ways of knowing, inhabited by people with the freedom to make use of that abundance.
              </Text>
              <Text fontSize="var(--chakra-font-sizes-md)" lineHeight="1.75" color="theme.textSecondary" maxW="78ch">
                Human knowing is abundant and plural. Knowledge can live in scholarship and databases, but also in hands, bodies, places, recipes, stories, ecosystems, lineages, communities, lived experience, gatherings, rituals, and meals simply shared.
              </Text>
            </VStack>
          </Box>
        </Container>
      </Box>

      <Box className="crh6-needs-section" py={{ base: 12, md: 16 }}>
        <Container className="crh6-needs-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <VStack align="stretch" gap={8}>
            <Box className="crh6-section-heading" maxW="840px">
              <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                Mission becomes practice
              </Text>
              <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="var(--chakra-font-sizes-2xl)" letterSpacing="0">
                We act, we learn, and what we learn changes what we make and offer.
              </Heading>
            </Box>

            <SimpleGrid className="crh6-need-grid" columns={{ base: 1, md: 3 }} gap={4}>
              {practiceRows.map((row) => {
                const Icon = row.icon;
                return (
                  <Box
                    className="crh6-need-card"
                    key={row.label}
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
                          {row.label}
                        </Heading>
                        <Text color="#5C6880" lineHeight="1.7">
                          {row.body}
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
        className="crh6-section-actions-wrap"
        py={{ base: 6, md: 7 }}
        bg="bg.subtle"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="theme.border"
      >
        <Container className="crh6-section-actions-inner" maxW="100%" px={{ base: 2, md: 3 }}>
          <HStack className="crh6-section-actions" gap={3} flexWrap="wrap" justify="center" px={{ base: 2, md: 3 }}>
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

      <Box className="crh6-product-section" bg="#FFFFFF" borderTop="1px solid" borderBottom="1px solid" borderColor="#DDE1ED" py={{ base: 12, md: 16 }}>
        <Container className="crh6-product-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <Flex gap={{ base: 8, lg: 14 }} align={{ base: "start", lg: "center" }} direction={{ base: "column", lg: "row" }}>
            <Box className="crh6-product-copy" flex="1" maxW="640px">
              <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                What this becomes
              </Text>
              <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="var(--chakra-font-sizes-2xl)" letterSpacing="0" mb={5}>
                The offerings are downstream of the mission.
              </Heading>
              <Text color="#5C6880" lineHeight="1.7" maxW="65ch">
                Catalyst, Mixtape, and Tapestry are not the mission itself. They are forms the work has taken as we try to cultivate knowledge, steward continuity, and help people participate in abundance more capably.
              </Text>
            </Box>

            <VStack className="crh6-product-list" align="stretch" gap={0} flex="1" w="100%" borderTop="1px solid" borderColor="#DDE1ED">
              {productSignals.map((signal) => (
                <Flex
                  className="crh6-product-row"
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

      <Box className="crh6-closing-section" py={{ base: 12, md: 16 }}>
        <Container className="crh6-closing-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <Box className="crh6-closing-callout" bg="#FDF8EE" border="1px solid" borderColor="#DDE1ED" borderRadius="4px" p={{ base: 6, md: 8 }}>
            <Flex gap={5} align={{ base: "start", md: "center" }} justify="space-between" direction={{ base: "column", md: "row" }}>
              <HStack align="start" gap={4}>
                <Box color="#B8922A" pt={1}>
                  <IconHeartHandshake size={28} />
                </Box>
                <Box>
                  <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="var(--chakra-font-sizes-2xl)" letterSpacing="0" mb={2}>
                    Come participate.
                  </Heading>
                  <Text color="#5C6880" maxW="720px" lineHeight="1.7">
                    Use something. Read something. Engage us. Join something. Share something. Bring your knowledge. Learn something. Help build abundance.
                  </Text>
                </Box>
              </HStack>
              <Button asChild bg="#1A2138" color="white" borderRadius="3px" _hover={{ bg: "#2B3D6B" }}>
                <Link as={NextLink} href="/contact?interest=participation">
                  <HStack gap={2}>
                    <Text>Join the conversation</Text>
                    <IconCompass size={17} />
                  </HStack>
                </Link>
              </Button>
            </Flex>
          </Box>
        </Container>
      </Box>

      <HomeVariantSwitcher activeHref="/page6" />
    </Box>
  );
}

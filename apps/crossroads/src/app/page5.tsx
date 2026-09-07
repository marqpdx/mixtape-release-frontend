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
  List,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  IconArrowRight,
} from "@tabler/icons-react";
import HomeVariantSwitcher from "@components/home/HomeVariantSwitcher";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";

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
        <Container className="crh5-hero-inner" maxW="1180px" px={{ base: 5, md: 8 }} pt={{ base: 12, md: 18 }} pb={{ base: 9, md: 12 }}>
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
                    is vital. Advanced tooling can sift and suggest, but people decide what becomes true and trusted knowledge.
                  </Text>
                  <Box w="100%" pt={2} pb={1}>
                    <Box w="72px" borderTop="1px solid" borderColor="#B8922A" opacity={0.7} />
                  </Box>
                  <Text fontSize="var(--chakra-font-sizes-md)" lineHeight="1.7" color="#5C6880">
                    We{" "}
                    <Text as="span" fontWeight="700" color="#1A2138">
                      explore knowledge
                    </Text>{" "}
                    not simply to have, but to put into relationship: with diverse ideas, with lived experience, with one another, and with the work before us.
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
        bg="bg.subtle"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="theme.border"
        boxShadow="inset 0 4px 0 0 var(--theme-accent)"
      >
        <Container className="crh5-thesis-callout-inner" maxW="100%" px={{ base: 2, md: 3 }}>
          <Box className="crh5-thesis-callout" px={{ base: 2, md: 3 }} py={{ base: 4, md: 5 }}>
            <VStack align="center" textAlign="center" gap={2}>
              <Text color="theme.accent" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase">
                Mission
              </Text>
              <Text
                fontFamily='Georgia, "Times New Roman", serif'
                lineHeight="1.55"
                color="theme.text"
                fontSize="var(--chakra-font-sizes-2xl)"
                maxW="52ch"
              >
                To explore and share knowledge in all its forms,
                <br />
                abundantly, resourcefully,
                <br/>
                and as good stewards of Earth.
              </Text>
            </VStack>
          </Box>
        </Container>
      </Box>

      <Box
        className="crh5-mission-cta-wrap"
        py={{ base: 6, md: 7 }}
        bg="theme.surface"
        borderTop="1px solid"
        borderBottom="1px solid"
        borderColor="theme.border"
      >
        <Container className="crh5-mission-cta-inner" maxW="90%" px={{ base: 2, md: 3 }}>
          <Flex
            className="crh5-mission-cta"
            align={{ base: "start", md: "center" }}
            justify="space-between"
            direction={{ base: "column", md: "row" }}
            gap={4}
            px={{ base: 3, md: 4 }}
          >
            <Text
              fontFamily='Georgia, "Times New Roman", serif'
              fontSize="var(--chakra-font-sizes-lg)"
              lineHeight="1.75"
              color="theme.textSecondary"
              maxW="56ch"
            >
              Crossroads is a place to orient, to what one knows, to spaciousness of thought, to working well together.
            </Text>
            <Button asChild size="lg" variant="outline" borderRadius="3px" alignSelf={{ base: "start", md: "center" }}>
              <Link as={NextLink} href="/contact?interest=inquiry">
                <Text>Drop us a line</Text>
              </Link>
            </Button>
          </Flex>
        </Container>
      </Box>

      <Box className="crh5-needs-section" py={{ base: 5, md: 10 }}>
        <Container className="crh5-needs-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <VStack align="stretch" gap={8}>
            <Box className="crh5-section-heading" maxW="860px">
              <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                We Envision
              </Text>
              <Box pl="25px" borderLeft="3px solid" borderColor="theme.accent">
                <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="var(--chakra-font-sizes-xl)" letterSpacing="0">
                  We see a world rich in ways of knowing, inhabited by people with freedom to make use of that abundance together, and where everyone is thriving to the greatest extent possible.
                </Heading>
              </Box>
            </Box>

            <VStack className="crh5-envision-copy" align="start" gap={4} maxW="78ch">
              <Box>
                <Text color="#5C6880" lineHeight="1.75" mb={1}>
                  We deeply value knowledge of :
                </Text>
                <SimpleGrid columns={{ base: 1, md: 2 }} gapX={8} gapY={1} maxW="60ch">
                  <List.Root as="ul" pl={5} color="#5C6880" lineHeight="1.65" gap={0.5}>
                    <List.Item>these bodies we live in</List.Item>
                    <List.Item>this universe we inhabit</List.Item>
                    <List.Item>our shared long history</List.Item>
                  </List.Root>
                  <List.Root as="ul" pl={5} color="#5C6880" lineHeight="1.65" gap={0.5}>
                    <List.Item>findings of science and study</List.Item>
                    <List.Item>all forms of lineage</List.Item>
                    <List.Item>Earth and her story</List.Item>
                  </List.Root>
                </SimpleGrid>
                <List.Root as="ul" pl={5} color="#5C6880" lineHeight="1.65" gap={0.5} mt={2}>
                  <List.Item>and so much more....</List.Item>
                </List.Root>
                <Text color="#5C6880" lineHeight="1.75" mt={5} mb={3}>
                  We celebrate each person's ability to come to know self, soul, and community, and we appreciate knowledge itself as a companion to abundance.
                </Text>
              </Box>
            </VStack>
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
              <Link as={NextLink} href="/about/what-we-do-and-why">
                <HStack gap={2}>
                  <Text>Read about what we do, and why</Text>
                  <IconArrowRight size={18} />
                </HStack>
              </Link>
            </Button>
          </HStack>
        </Container>
      </Box>

      <HomeVariantSwitcher activeHref="/page5" />
    </Box>
  );
}

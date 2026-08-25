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
import { IconArrowRight, IconBrain, IconCirclesRelation, IconStack2, IconTool } from "@tabler/icons-react";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import HomeVariantSwitcher from "@components/home/HomeVariantSwitcher";

const principleRows = [
  {
    name: "Resourcefulness",
    text: "Clarity makes AI more useful and less wasteful. We guide people toward the kind of knowledge shaping that reduces noise, retries, and unnecessary compute.",
  },
  {
    name: "Understanding, not information",
    text: "The point is not endless coherent information. The point is knowing where you stand, what is current, and what your people can trust.",
  },
  {
    name: "We practice first",
    text: "We are not asking others into a theory. Crossroads grows out of the same stewardship practice we use to build and refine it.",
  },
];

export default function CrossroadsHomepageAttention() {
  return (
    <Box
      className="crh4-root"
      minH="100vh"
      bg="#F7F3EB"
      color="#1F2926"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <UnifiedNavbar />

      <Box className="crh4-masthead" borderBottom="2px solid" borderColor="#A56A3C">
        <Container className="crh4-hero-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 18 }}>
          <Flex
            className="crh4-hero-grid"
            minH={{ base: "auto", lg: "calc(100vh - 180px)" }}
            align="center"
            justify="space-between"
            gap={{ base: 10, lg: 16 }}
            direction={{ base: "column", lg: "row" }}
          >
            <VStack className="crh4-hero-copy" align="start" gap={7} flex="1 1 58%" maxW="720px">
              <HStack className="crh4-tags" gap={2} flexWrap="wrap">
                {["Crossroads", "Attention", "Understanding", "Resourcefulness"].map((tag) => (
                  <Badge
                    key={tag}
                    bg="#EFE4D3"
                    color="#7C4A25"
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
                  lineHeight="1.02"
                  letterSpacing="0"
                  maxW="760px"
                >
                  Information is cheap. Attention is precious.
                </Heading>
                <Text mt={6} fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" color="#55635D" maxW="65ch">
                  AI can sort, summarize, draft, compare, and organize faster than any small team ever could. Used well, that does not make human judgment less important. It makes room for more of it.
                </Text>
                <Text mt={4} fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" color="#55635D" maxW="65ch">
                  Crossroads is built around that room: the space to decide what is true enough to trust, current enough to use, and important enough to keep. That is how information becomes knowledge.
                </Text>
              </Box>

              <HStack className="crh4-hero-actions" gap={3} flexWrap="wrap">
                <Button asChild size="lg" bg="#8F4A2C" color="white" borderRadius="3px" _hover={{ bg: "#723A23" }}>
                  <Link as={NextLink} href="/products/principles">
                    <HStack gap={2}>
                      <Text>See the principles</Text>
                      <IconArrowRight size={18} />
                    </HStack>
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" borderColor="#A56A3C" color="#1F2926" borderRadius="3px">
                  <Link as={NextLink} href="/contact?interest=orientation">
                    <Text>Talk through fit</Text>
                  </Link>
                </Button>
              </HStack>
            </VStack>

            <Box className="crh4-hero-plate" flex="0 1 430px" w="100%">
              <Box
                className="crh4-thesis-panel"
                bg="linear-gradient(180deg, #FFF9F0 0%, #F4E9D8 100%)"
                border="1px solid"
                borderColor="#E2D2BD"
                borderRadius="6px"
                p={{ base: 5, md: 6 }}
                boxShadow="0 18px 55px rgba(89, 62, 42, 0.10)"
              >
                <VStack align="stretch" gap={5}>
                  <HStack gap={3} align="start">
                    <Box color="#8F4A2C" pt={0.5}>
                      <IconStack2 size={24} />
                    </Box>
                    <Box>
                      <Heading as="h2" fontSize="sm" color="#8F4A2C" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                        Data and information multiply
                      </Heading>
                      <Text color="#55635D" lineHeight="1.7">
                        The information layer is getting cheaper and faster. Most tools stop there.
                      </Text>
                    </Box>
                  </HStack>

                  <HStack gap={3} align="start">
                    <Box color="#8F4A2C" pt={0.5}>
                      <IconBrain size={24} />
                    </Box>
                    <Box>
                      <Heading as="h2" fontSize="sm" color="#8F4A2C" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                        Attention makes knowledge possible
                      </Heading>
                      <Text color="#55635D" lineHeight="1.7">
                        The scarce resource is human attention applied with judgment, care, and enough continuity to mean something.
                      </Text>
                    </Box>
                  </HStack>

                  <HStack gap={3} align="start">
                    <Box color="#8F4A2C" pt={0.5}>
                      <IconTool size={24} />
                    </Box>
                    <Box>
                      <Heading as="h2" fontSize="sm" color="#8F4A2C" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                        Crossroads tends the layer beneath AI
                      </Heading>
                      <Text color="#55635D" lineHeight="1.7">
                        We help people build the trusted, reviewable knowledge layer that makes every AI tool more grounded and more resourceful.
                      </Text>
                    </Box>
                  </HStack>
                </VStack>
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>

      <Box className="crh4-principles-section" py={{ base: 12, md: 16 }}>
        <Container className="crh4-principles-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <VStack align="stretch" gap={8}>
            <Box className="crh4-section-heading" maxW="760px">
              <Text color="#A56A3C" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                Core principles
              </Text>
              <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="var(--chakra-font-sizes-2xl)" letterSpacing="0">
                The product story starts with what we are trying to protect.
              </Heading>
            </Box>

            <SimpleGrid className="crh4-principle-grid" columns={{ base: 1, md: 3 }} gap={4}>
              {principleRows.map((row, index) => (
                <Box
                  key={row.name}
                  className="crh4-principle-card"
                  bg="#FFFFFF"
                  border="1px solid"
                  borderColor="#E2D2BD"
                  borderRadius="6px"
                  p={6}
                >
                  <VStack align="start" gap={4}>
                    <HStack gap={3}>
                      <Box
                        minW="32px"
                        h="32px"
                        borderRadius="full"
                        bg="#F4E9D8"
                        color="#8F4A2C"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontSize="sm"
                        fontWeight="700"
                      >
                        0{index + 1}
                      </Box>
                      <Heading as="h3" fontSize="lg" letterSpacing="0">
                        {row.name}
                      </Heading>
                    </HStack>
                    <Text color="#55635D" lineHeight="1.7">
                      {row.text}
                    </Text>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>

            <Box className="crh4-summary-callout" bg="#1F2926" color="#FAF4EA" borderRadius="6px" p={{ base: 6, md: 8 }}>
              <HStack align="start" gap={4}>
                <Box color="#E5BB8F" pt={1}>
                  <IconCirclesRelation size={28} />
                </Box>
                <Box maxW="820px">
                  <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="2xl" letterSpacing="0" mb={3}>
                    Crossroads is not trying to produce more information.
                  </Heading>
                  <Text color="rgba(250, 244, 234, 0.82)" lineHeight="1.75">
                    It helps people turn dispersed files, tacit judgment, old decisions, and everyday work into knowledge they can trust, tend, use, and share. That is the layer AI cannot choose on their behalf.
                  </Text>
                </Box>
              </HStack>
            </Box>
          </VStack>
        </Container>
      </Box>

      <HomeVariantSwitcher activeHref="/page4" />
    </Box>
  );
}

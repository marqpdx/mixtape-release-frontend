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
import { IconArrowRight, IconHeartHandshake, IconLeaf, IconScale, IconTool } from "@tabler/icons-react";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import HomeVariantSwitcher from "@components/home/HomeVariantSwitcher";

const principles = [
  {
    title: "Resourcefulness",
    body: "Use powerful tools with care, clarity, and proportion. The clearer your knowledge is, the more resourcefully AI can work with it.",
    icon: IconTool,
  },
  {
    title: "Humans decide",
    body: "AI can suggest, sort, compare, and draft. People still decide what is true enough to trust and important enough to keep.",
    icon: IconScale,
  },
  {
    title: "Knowledge takes stewardship",
    body: "What matters most cannot be stored once and forgotten. It becomes reliable because people review it, refine it, and stand behind it over time.",
    icon: IconHeartHandshake,
  },
];

export default function CrossroadsHomepagePrinciples() {
  return (
    <Box
      className="crh3-root"
      minH="100vh"
      bg="#F4F5F8"
      color="#1A2138"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <UnifiedNavbar />

      <Box className="crh3-masthead" borderBottom="2px solid" borderColor="#B8922A">
        <Container className="crh3-hero-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 18 }}>
          <Flex
            className="crh3-hero-grid"
            minH={{ base: "auto", lg: "calc(100vh - 180px)" }}
            align="center"
            justify="space-between"
            gap={{ base: 10, lg: 16 }}
            direction={{ base: "column", lg: "row" }}
          >
            <VStack className="crh3-hero-copy" align="start" gap={7} flex="1 1 58%" maxW="720px">
              <HStack className="crh3-tags" gap={2} flexWrap="wrap">
                {["Crossroads", "Resourcefulness", "Stewardship", "Attention"].map((tag) => (
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
                  fontSize={{ base: "2xl", md: "4xl", xl: "5xl" }}
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
                  ...more reason to protect attention, practice judgment, and tend what matters.
                </Heading>
                <Text mt={6} fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" color="#5C6880" maxW="65ch">
                  Crossroads is built around a simple premise: information keeps multiplying, but trustworthy knowledge still depends on human attention. AI can help with the processing layer. People still need a place to decide what matters and stand behind it together.
                </Text>
                <Text mt={4} fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" color="#5C6880" maxW="65ch">
                  That is why our core principles come first here: use tools resourcefully, let humans decide, and treat knowledge as something worth stewarding over time.
                </Text>
              </Box>

              <HStack className="crh3-hero-actions" gap={3} flexWrap="wrap">
                <Button asChild size="lg" bg="#1E4BD2" color="white" borderRadius="3px" _hover={{ bg: "#173AA4" }}>
                  <Link as={NextLink} href="/products/principles">
                    <HStack gap={2}>
                      <Text>Read the principles</Text>
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

            <Box className="crh3-hero-plate" flex="0 1 410px" w="100%">
              <Box className="crh3-principles-panel" bg="#FFFFFF" border="1px solid" borderColor="#DDE1ED" borderRadius="4px" p={{ base: 5, md: 6 }}>
                <VStack align="stretch" gap={4}>
                  {principles.map((principle) => {
                    const Icon = principle.icon;
                    return (
                      <Box key={principle.title} borderBottom="1px solid" borderColor="#E7EAF3" pb={4} _last={{ borderBottom: "none", pb: 0 }}>
                        <HStack align="start" gap={3}>
                          <Box color="#1E4BD2" pt={0.5}>
                            <Icon size={22} />
                          </Box>
                          <Box>
                            <Heading as="h3" fontSize="sm" color="#B8922A" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                              {principle.title}
                            </Heading>
                            <Text color="#5C6880" lineHeight="1.65">
                              {principle.body}
                            </Text>
                          </Box>
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              </Box>
              <Box className="crh3-thesis" mt={5} bg="#EEF2FD" borderLeft="3px solid" borderColor="#1E4BD2" p={5}>
                <Text fontFamily='Georgia, "Times New Roman", serif' lineHeight="1.65" color="#1A2138">
                  Attention is precious.
                </Text>
                <Text fontFamily='Georgia, "Times New Roman", serif' lineHeight="1.65" color="#1A2138">
                  Knowledge is what careful attention makes possible.
                </Text>
              </Box>
            </Box>
          </Flex>
        </Container>
      </Box>

      <Box className="crh3-needs-section" py={{ base: 12, md: 16 }}>
        <Container className="crh3-needs-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <SimpleGrid className="crh3-summary-grid" columns={{ base: 1, md: 3 }} gap={4}>
            <Box className="crh3-summary-card" bg="#FFFFFF" border="1px solid" borderColor="#DDE1ED" borderRadius="4px" p={6}>
              <VStack align="start" gap={4}>
                <Box color="#1E4BD2">
                  <IconLeaf size={26} />
                </Box>
                <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="2xl" letterSpacing="0">
                  Attention is precious
                </Heading>
                <Text color="#5C6880" lineHeight="1.7">
                  The scarce resource is not information. It is human attention applied with care, judgment, and enough spaciousness to think clearly.
                </Text>
              </VStack>
            </Box>

            <Box className="crh3-summary-card" bg="#FFFFFF" border="1px solid" borderColor="#DDE1ED" borderRadius="4px" p={6}>
              <VStack align="start" gap={4}>
                <Box color="#1E4BD2">
                  <IconScale size={26} />
                </Box>
                <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="2xl" letterSpacing="0">
                  Humans decide
                </Heading>
                <Text color="#5C6880" lineHeight="1.7">
                  Crossroads does not hand over judgment. It helps groups gather context, compare what they have, and choose what they are willing to trust.
                </Text>
              </VStack>
            </Box>

            <Box className="crh3-summary-card" bg="#FFFFFF" border="1px solid" borderColor="#DDE1ED" borderRadius="4px" p={6}>
              <VStack align="start" gap={4}>
                <Box color="#1E4BD2">
                  <IconHeartHandshake size={26} />
                </Box>
                <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize="2xl" letterSpacing="0">
                  Knowledge takes stewardship
                </Heading>
                <Text color="#5C6880" lineHeight="1.7">
                  What matters most becomes more useful when it is reviewed, confirmed, corrected, and taught - not merely stored.
                </Text>
              </VStack>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      <HomeVariantSwitcher activeHref="/page3" />
    </Box>
  );
}

// apps/crossroads/src/app/(main)/(site)/products/flow/page.tsx

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
  IconDatabase,
  IconFileSpreadsheet,
  IconHeadphones,
} from "@tabler/icons-react";

const sources = [
  { label: "What the founder remembers", icon: IconHeadphones },
  { label: "An old website or CMS", icon: IconBook2 },
  { label: "Local databases and drives", icon: IconDatabase },
  { label: "Spreadsheets, recipes, notes", icon: IconFileSpreadsheet },
];

const audiences = [
  "Small business owners trying to keep judgment from living in one person's head",
  "Nonprofit boards that need continuity across volunteers, staff, and seasons",
  "Service firms in software, architecture, real estate, and food service",
  "Artists, writers, and students building bodies of work that need care over time",
];

const flowStages = [
  {
    name: "First, give the knowledge a place to live.",
    role: "Catalyst Foundation creates the private home base.",
    body: "Most organizations already have the raw material: policies, recipes, client notes, project history, board decisions, service patterns, and hard-won judgment. Foundation gives that material a simple, private place where it can be gathered, named, reviewed, and trusted.",
  },
  {
    name: "Then, include more of the living work.",
    role: "Catalyst Reach widens what can be brought into view.",
    body: "Some knowledge is polished. Some is still in drafts, meeting notes, uploads, conversations, or working documents. Reach helps a group include more of that living material so the knowledge base can notice gaps, surface useful context, and keep pace with the actual work.",
  },
  {
    name: "When needed, shape the messy middle.",
    role: "A Knowledge Shaping Engagement turns accumulated material into usable structure.",
    body: "This is a guided engagement for organizations with enough history that the hard part is not storage. It is seeing what the material means, how the pieces relate, what needs a name, and what should become part of the organization's trusted operating knowledge.",
  },
  {
    name: "Later, put the understanding to work.",
    role: "More advanced tools can come after the knowledge is ready.",
    body: "Once a group has a tended knowledge base, it can support better onboarding, clearer decisions, richer search, client-facing material, internal tools, and more useful AI assistance. The first step is making sure the organization knows what it knows.",
  },
];

const offeringCards = [
  {
    name: "Catalyst Foundation",
    price: "$20/mo",
    summary: "A private knowledge home base",
    benefits: ["Visibility into what the organization actually trusts", "Structure for present-tense understanding", "Consistency across language, context, and practice"],
    features: ["Client login", "Starter knowledge pages", "Simple review and update habit"],
  },
  {
    name: "Catalyst Reach",
    price: "$35/mo",
    summary: "A wider view of living material",
    benefits: ["Broader awareness across drafts, files, and notes", "Better capture before knowledge is fully polished", "More useful prompts about gaps, context, and next steps"],
    features: ["Drafts and uploads included", "Conversation and note capture", "Expanded search and suggestion surface"],
  },
  {
    name: "Knowledge Shaping Engagement",
    price: "$1,000",
    summary: "A guided structure-building engagement",
    benefits: ["Tacit knowledge becomes easier to review", "Relationships and clusters become visible", "The next useful product work becomes clearer"],
    features: ["Guided material review", "Knowledge map and naming work", "Recommended pages and next builds"],
  },
];

export default function ProductFlowPage() {
  return (
    <Box
      className="crflow-root"
      bg="#F4F5F8"
      color="#1A2138"
      minH="100vh"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <Box className="crflow-masthead" borderBottom="2px solid" borderColor="#B8922A">
        <Container className="crflow-masthead-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
          <VStack align="start" gap={6} maxW="880px">
            <Badge bg="#E8ECF6" color="#2B3D6B" borderRadius="3px" px={2} py={1} letterSpacing="0.12em" textTransform="uppercase">
              Catalyst Flow
            </Badge>
            <Heading as="h1" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "3xl", md: "5xl" }} lineHeight="1.08" letterSpacing="0">
              Your organization already has knowledge. Catalyst gives it somewhere to live.
            </Heading>
            <Text color="#5C6880" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" maxW="65ch">
              A small business, nonprofit, practice, studio, or student project can hold years of judgment in places that were never designed to care for it. Catalyst helps gather that knowledge, make it understandable, and tend it over time.
            </Text>
            <SimpleGrid className="crflow-audience-grid" columns={{ base: 1, md: 2 }} gap={3} w="100%">
              {audiences.map((audience) => (
                <HStack key={audience} align="start" gap={3} bg="#FFFFFF" border="1px solid" borderColor="#DDE1ED" borderRadius="4px" p={4}>
                  <Text color="#1E4BD2" fontFamily='Georgia, "Times New Roman", serif' fontSize="lg" lineHeight="1">
                    /
                  </Text>
                  <Text color="#5C6880" fontSize="sm" lineHeight="1.55">
                    {audience}
                  </Text>
                </HStack>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      <Container className="crflow-story-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
        <Box className="crflow-line-wrap" position="relative">
          <Box
            className="crflow-s-curve"
            display={{ base: "none", lg: "block" }}
            position="absolute"
            left="22%"
            right="8%"
            top="92px"
            h="520px"
            borderTop="2px solid"
            borderRight="2px solid"
            borderBottom="2px solid"
            borderColor="#B8922A"
            borderRadius="0 220px 220px 0"
            opacity={0.65}
          />
          <VStack className="crflow-stage-list" align="stretch" gap={{ base: 5, lg: 8 }} position="relative" zIndex={1}>
            {flowStages.map((stage, index) => (
              <Flex
                key={stage.name}
                className="crflow-stage-card"
                align="stretch"
                justify={index % 2 === 0 ? "flex-start" : "flex-end"}
                gap={{ base: 4, lg: 5 }}
                direction={{ base: "column", lg: "row" }}
              >
                {index === 0 && (
                  <Box
                    className="crflow-source-panel"
                    bg="#FFFFFF"
                    border="1px solid"
                    borderColor="#DDE1ED"
                    borderRadius="4px"
                    p={5}
                    w={{ base: "100%", lg: "24%" }}
                    alignSelf="flex-start"
                  >
                    <Text color="#B8922A" fontSize="xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" mb={3}>
                      Knowledge often begins dispersed
                    </Text>
                    <VStack align="stretch" gap={3}>
                      {sources.map((source) => {
                        const Icon = source.icon;
                        return (
                          <HStack key={source.label} gap={3}>
                            <Box color="#1E4BD2" flexShrink={0}>
                              <Icon size={18} />
                            </Box>
                            <Text color="#5C6880" fontSize="sm">{source.label}</Text>
                          </HStack>
                        );
                      })}
                    </VStack>
                  </Box>
                )}
                <Box
                  bg="#FFFFFF"
                  border="1px solid"
                  borderColor="#DDE1ED"
                  borderRadius="4px"
                  p={{ base: 6, md: 7 }}
                  w={{ base: "100%", lg: index === 0 ? "58%" : "58%" }}
                  boxShadow="0 18px 50px rgba(26, 33, 56, 0.06)"
                >
                  <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="0" mb={3}>
                    {stage.name}
                  </Heading>
                  <Text color="#1A2138" fontWeight="700" mb={3}>
                    {stage.role}
                  </Text>
                  <Text color="#5C6880" lineHeight="1.7" maxW="65ch">
                    {stage.body}
                  </Text>
                </Box>
              </Flex>
            ))}
          </VStack>
        </Box>
      </Container>

      <Box className="crflow-pricing" bg="#FFFFFF" borderTop="1px solid" borderColor="#DDE1ED" py={{ base: 12, md: 16 }}>
        <Container maxW="1180px" px={{ base: 5, md: 8 }}>
          <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" mb={3}>
            What the practice makes possible
          </Text>
          <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="0" mb={8}>
            Start with a trustworthy home base. Add reach or guided shaping when the work calls for it.
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {offeringCards.map((offering) => (
              <Box key={offering.name} border="1px solid" borderColor="#DDE1ED" borderRadius="4px" p={6}>
                <Text color="#1E4BD2" fontFamily='Georgia, "Times New Roman", serif' fontSize="3xl" mb={2}>
                  {offering.price}
                </Text>
                <Text fontWeight="700" mb={1}>{offering.name}</Text>
                <Text color="#5C6880" lineHeight="1.65" mb={5}>{offering.summary}</Text>

                <Text color="#B8922A" fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                  Benefits
                </Text>
                <VStack align="stretch" gap={2} mb={5}>
                  {offering.benefits.map((benefit) => (
                    <Text key={benefit} color="#1A2138" fontSize="sm" lineHeight="1.55">
                      {benefit}
                    </Text>
                  ))}
                </VStack>

                <Text color="#B8922A" fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                  Features
                </Text>
                <VStack align="stretch" gap={2}>
                  {offering.features.map((feature) => (
                    <Text key={feature} color="#5C6880" fontSize="sm" lineHeight="1.55">
                      {feature}
                    </Text>
                  ))}
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
          <Button asChild mt={8} bg="#1E4BD2" color="white" borderRadius="3px" _hover={{ bg: "#173AA4" }}>
            <Link as={NextLink} href="/contact?interest=catalyst-flow">
              <HStack gap={2}>
                <Text>Talk through your knowledge flow</Text>
                <IconArrowRight size={17} />
              </HStack>
            </Link>
          </Button>
        </Container>
      </Box>
    </Box>
  );
}

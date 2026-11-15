// apps/crossroads/src/app/(main)/(site)/products/flow/page.tsx

"use client";

import NextLink from "next/link";
import { productArtwork } from "../artwork";
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
  { label: "What the founder or long-timer actually knows", icon: IconHeadphones },
  { label: "Old websites, documents, and shared drives", icon: IconBook2 },
  { label: "Local files, databases, and internal systems", icon: IconDatabase },
  { label: "Spreadsheets, recipes, notes, and informal records", icon: IconFileSpreadsheet },
];

const audiences = [
  "Small business owners whose best knowledge lives in one person's head — and needs to outlast that",
  "Nonprofit boards that need continuity across staff, volunteers, seasons, and leadership changes",
  "Service firms in law, architecture, real estate, engineering, and food service",
  "Artists, writers, educators, and consultants building bodies of work that need care over time",
];

const flowStages = [
  {
    name: "First, give the knowledge somewhere to live.",
    role: "Catalyst Foundation creates the private home base.",
    body: "The organization already has the raw material: policies, processes, client patterns, project history, board decisions, hard-won judgment. Foundation gives that material a simple, private place to be gathered, named, reviewed, and trusted — not uploaded and forgotten.",
  },
  {
    name: "Then, let more of the living work come in.",
    role: "Catalyst Reach widens what can be tended.",
    body: "Some knowledge is polished. Some is still in drafts, working notes, uploads, and conversations that were never designed to hold it. Reach lets the knowledge base see more of that living material — so gaps and useful connections are easier to notice before they matter.",
  },
  {
    name: "When needed, shape what has accumulated.",
    role: "A Knowledge Shaping Engagement turns accumulated material into usable structure.",
    body: "For organizations with enough history that the challenge is not storage but meaning — this guided engagement helps find what the material says, how the pieces relate, and what deserves to become part of trusted operating knowledge. The work is finding the meaning that lies between the documents.",
  },
  {
    name: "Then, put that understanding to work.",
    role: "More advanced tools can come after the knowledge is ready.",
    body: "Once the knowledge base is tended and trustworthy, it can support better onboarding, clearer decisions, richer client work, internal tools, and more useful AI assistance. The first step is knowing what the organization knows.",
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
    summary: "A guided meaning-making engagement",
    benefits: ["Tacit knowledge becomes easier to review", "Relationships and clusters become visible", "The structure the work actually needs becomes clear"],
    features: ["Guided material review", "Knowledge map and naming work", "Recommended pages and next builds"],
  },
];

export default function ProductFlowPage() {
  return (
    <Box
      className="crflow-root"
      bg="theme.bg"
      color="theme.text"
      minH="100vh"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <Box className="crflow-masthead" borderBottom="2px solid" borderColor={productArtwork.gold}>
        <Container className="crflow-masthead-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
          <VStack className="crflow-masthead-copy" align="start" gap={6} maxW="880px">
            <Badge bg="ui.surfaceSubtle" color="theme.text" borderRadius="3px" px={2} py={1} letterSpacing="0.12em" textTransform="uppercase">
              Catalyst Flow
            </Badge>
            <Heading as="h1" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "3xl", md: "5xl" }} lineHeight="1.08" letterSpacing="0">
              Your organization already knows more than it can find. Catalyst helps it hold that.
            </Heading>
            <Text color="theme.textMuted" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" maxW="65ch">
              A small business, nonprofit, practice, studio, or team carries years of judgment in places that were never designed to care for it. Catalyst gathers that knowledge, helps it cohere, and tends it over time.
            </Text>
            <SimpleGrid className="crflow-audience-grid" columns={{ base: 1, md: 2 }} gap={3} w="100%">
              {audiences.map((audience) => (
                <HStack className="crflow-audience-card" key={audience} align="start" gap={3} bg="theme.surface" border="1px solid" borderColor="ui.borderSubtle" borderRadius="4px" p={4}>
                  <Text color="theme.text" fontFamily='Georgia, "Times New Roman", serif' fontSize="lg" lineHeight="1">
                    /
                  </Text>
                  <Text color="theme.textMuted" fontSize="sm" lineHeight="1.55">
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
            borderColor={productArtwork.gold}
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
                    bg="theme.surface"
                    border="1px solid"
                    borderColor="ui.borderSubtle"
                    borderRadius="4px"
                    p={5}
                    w={{ base: "100%", lg: "24%" }}
                    alignSelf="flex-start"
                  >
                    <Text color="theme.textMuted" fontSize="xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" mb={3}>
                      Knowledge often begins dispersed
                    </Text>
                    <VStack className="crflow-sources" align="stretch" gap={3}>
                      {sources.map((source) => {
                        const Icon = source.icon;
                        return (
                          <HStack className="crflow-source-row" key={source.label} gap={3}>
                            <Box className="crflow-source-icon" color="theme.text" flexShrink={0}>
                              <Icon size={18} />
                            </Box>
                            <Text color="theme.textMuted" fontSize="sm">{source.label}</Text>
                          </HStack>
                        );
                      })}
                    </VStack>
                  </Box>
                )}
                <Box className="crflow-stage-copy"
                  bg="theme.surface"
                  border="1px solid"
                  borderColor="ui.borderSubtle"
                  borderRadius="4px"
                  p={{ base: 6, md: 7 }}
                  w={{ base: "100%", lg: index === 0 ? "58%" : "58%" }}
                  boxShadow="var(--ui-shadow-raised)"
                >
                  <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="0" mb={3}>
                    {stage.name}
                  </Heading>
                  <Text color="theme.text" fontWeight="700" mb={3}>
                    {stage.role}
                  </Text>
                  <Text color="theme.textMuted" lineHeight="1.7" maxW="65ch">
                    {stage.body}
                  </Text>
                </Box>
              </Flex>
            ))}
          </VStack>
        </Box>
      </Container>

      <Box className="crflow-pricing" bg="theme.surface" borderTop="1px solid" borderColor="ui.borderSubtle" py={{ base: 12, md: 16 }}>
        <Container className="crflow-pricing-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <Text color="theme.textMuted" fontSize="sm" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" mb={3}>
            What the practice makes possible
          </Text>
          <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="0" mb={8}>
            Start with a trustworthy home base. Add reach or guided shaping when the work calls for it.
          </Heading>
          <SimpleGrid className="crflow-offerings" columns={{ base: 1, md: 3 }} gap={4}>
            {offeringCards.map((offering) => (
              <Box className="crflow-offering-card" key={offering.name} border="1px solid" borderColor="ui.borderSubtle" borderRadius="4px" p={6}>
                <Text color="theme.text" fontFamily='Georgia, "Times New Roman", serif' fontSize="3xl" mb={2}>
                  {offering.price}
                </Text>
                <Text fontWeight="700" mb={1}>{offering.name}</Text>
                <Text color="theme.textMuted" lineHeight="1.65" mb={5}>{offering.summary}</Text>

                <Text color="theme.textMuted" fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                  Benefits
                </Text>
                <VStack className="crflow-benefits" align="stretch" gap={2} mb={5}>
                  {offering.benefits.map((benefit) => (
                    <Text key={benefit} color="theme.text" fontSize="sm" lineHeight="1.55">
                      {benefit}
                    </Text>
                  ))}
                </VStack>

                <Text color="theme.textMuted" fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={2}>
                  Features
                </Text>
                <VStack className="crflow-features" align="stretch" gap={2}>
                  {offering.features.map((feature) => (
                    <Text key={feature} color="theme.textMuted" fontSize="sm" lineHeight="1.55">
                      {feature}
                    </Text>
                  ))}
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
          <Button asChild maxW="full" h="auto" py={3} whiteSpace="normal" mt={8} variant="solid" borderRadius="3px">
            <Link color="theme.accentText" textDecoration="none" _hover={{ color: "theme.accentText" }} _focusVisible={{ outline: "3px solid", outlineColor: "ui.borderControl", outlineOffset: "2px" }} as={NextLink} href="/contact?interest=catalyst-flow">
              <HStack className="crflow-inquiry-label" gap={2}>
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

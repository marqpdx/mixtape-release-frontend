// apps/crossroads/src/app/(main)/(site)/products/principles/page.tsx

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
  IconChecks,
  IconHandStop,
  IconRoute,
  IconSparkles,
} from "@tabler/icons-react";

const principles = [
  {
    name: "People Confirm What Matters",
    claim: "AI can move quickly. Judgment still comes from people.",
    body: "AI can sort, summarize, suggest, and compare faster than any small team. But important knowledge does not become trustworthy because software produced it. A person gets the final say — always visible, never assumed.",
    icon: IconHandStop,
  },
  {
    name: "Stewardship Rewards Diligence",
    claim: "The system gets better because you show up.",
    body: "When a group tends its knowledge carefully — reviewing, confirming, refining — the work becomes lighter over time. Catalyst is designed to recognize that diligence and return it: more useful context, less repetition, more room to do the actual work.",
    icon: IconChecks,
  },
  {
    name: "Your Knowledge Can Travel",
    claim: "Useful knowledge should not be trapped in one tool.",
    body: "As AI tools keep changing, the scarce thing is not another model. It is trusted context — the material, language, and decisions that make an answer relevant to your actual work, not just plausible in general.",
    icon: IconRoute,
  },
  {
    name: "Knowledge Builds As You Work",
    claim: "The best knowledge practice does not ask you to stop everything.",
    body: "Catalyst grows through ordinary moments: a note after a meeting, a clarified process, a better way of explaining how something works. Every prompt is visible, every suggestion reviewable, every addition yours to approve.",
    icon: IconSparkles,
  },
];

const proofPoints = [
  "Nothing important is accepted invisibly.",
  "AI proposes. People decide.",
  "The client can see what was captured and why.",
  "The system gets more useful as care and accuracy increase.",
];

export default function ProductPrinciplesPage() {
  return (
    <Box
      className="crprinciples-root"
      bg="theme.bg"
      color="theme.text"
      minH="100vh"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <Box className="crprinciples-masthead" borderBottom="2px solid" borderColor={productArtwork.gold}>
        <Container className="crprinciples-masthead-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
          <VStack className="crprinciples-masthead-copy" align="start" gap={6} maxW="900px">
            <Badge bg="ui.surfaceSubtle" color="theme.text" borderRadius="3px" px={2} py={1} letterSpacing="0.12em" textTransform="uppercase">
              Why Catalyst Works
            </Badge>
            <Heading as="h1" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "3xl", md: "5xl" }} lineHeight="1.08" letterSpacing="0">
              When information crowds out awareness, clarity becomes the practice.
            </Heading>
            <Text color="theme.textMuted" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" maxW="68ch">
              Catalyst is built for organizations that want to reclaim the room to think — freeing attention from the overwhelming information layer so people can do the work that matters: deciding what is true, current, and worth standing behind.
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container className="crprinciples-intro" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
        <Flex className="crprinciples-intro-layout" gap={{ base: 8, lg: 14 }} align={{ base: "start", lg: "center" }} direction={{ base: "column", lg: "row" }}>
          <Box className="crprinciples-intro-copy" flex="1" maxW="680px">
            <Text color="theme.textMuted" fontSize="sm" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" mb={3}>
              The operating promise
            </Text>
            <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="0" mb={5}>
              Catalyst helps you build knowledge while keeping responsibility where it belongs.
            </Heading>
            <Text color="theme.textMuted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.75">
              A small business, board, firm, studio, or creative practice does not need magic. It needs attention freed from drudgery, useful prompts at the right moment, and a trustworthy way to decide what deserves to last.
            </Text>
          </Box>

          <Box className="crprinciples-proof-panel" bg="theme.surface" border="1px solid" borderColor="ui.borderSubtle" borderRadius="4px" p={{ base: 5, md: 6 }} flex="0 1 390px" w="100%">
            <Text color="theme.textMuted" fontSize="xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" mb={4}>
              What this means in practice
            </Text>
            <VStack className="crprinciples-proof-list" align="stretch" gap={3}>
              {proofPoints.map((point) => (
                <HStack className="crprinciples-proof-row" key={point} gap={3} align="start">
                  <Box className="crprinciples-proof-icon" color="theme.text" flexShrink={0} pt="2px">
                    <IconChecks size={17} />
                  </Box>
                  <Text color="theme.textMuted" fontSize="sm" lineHeight="1.6">
                    {point}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </Flex>
      </Container>

      <Box className="crprinciples-band" bg="theme.surface" borderTop="1px solid" borderBottom="1px solid" borderColor="ui.borderSubtle" py={{ base: 12, md: 16 }}>
        <Container className="crprinciples-band-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <SimpleGrid className="crprinciples-grid" columns={{ base: 1, md: 2 }} gap={4}>
            {principles.map((principle) => {
              const Icon = principle.icon;
              return (
                <Box key={principle.name} className="crprinciples-card" border="1px solid" borderColor="ui.borderSubtle" borderRadius="4px" p={{ base: 6, md: 7 }} minH="330px">
                  <VStack className="crprinciples-principle-content" align="start" gap={5}>
                    <Box className="crprinciples-principle-icon" color="theme.text">
                      <Icon size={30} />
                    </Box>
                    <Box className="crprinciples-principle-copy">
                      <Text color="theme.textMuted" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                        {principle.name}
                      </Text>
                      <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "xl", md: "2xl" }} letterSpacing="0" lineHeight="1.2" mb={4}>
                        {principle.claim}
                      </Heading>
                      <Text color="theme.textMuted" lineHeight="1.7">
                        {principle.body}
                      </Text>
                    </Box>
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>
        </Container>
      </Box>

      <Container className="crprinciples-closing" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
        <Flex
          className="crprinciples-closing-panel"
          bg="ui.surfaceSubtle"
          borderLeft="3px solid"
          borderColor="ui.borderSubtle"
          p={{ base: 6, md: 8 }}
          gap={6}
          align={{ base: "start", md: "center" }}
          justify="space-between"
          direction={{ base: "column", md: "row" }}
        >
          <Box className="crprinciples-closing-copy" maxW="760px">
            <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "xl", md: "2xl" }} letterSpacing="0" mb={3}>
              We build this way ourselves.
            </Heading>
            <Text color="theme.textMuted" lineHeight="1.7">
              The knowledge practice Catalyst makes possible is the same one Mindful Brilliance uses: gathering the work, making the structure visible, letting people confirm what matters, and improving the knowledge as the work continues.
            </Text>
          </Box>
          <Button asChild maxW="full" h="auto" py={3} whiteSpace="normal" variant="solid" borderRadius="3px">
            <Link color="theme.accentText" textDecoration="none" _hover={{ color: "theme.accentText" }} _focusVisible={{ outline: "3px solid", outlineColor: "ui.borderControl", outlineOffset: "2px" }} as={NextLink} href="/contact?interest=catalyst-principles">
              <HStack className="crprinciples-inquiry-label" gap={2}>
                <Text>Talk through the principles</Text>
                <IconArrowRight size={17} />
              </HStack>
            </Link>
          </Button>
        </Flex>
      </Container>
    </Box>
  );
}

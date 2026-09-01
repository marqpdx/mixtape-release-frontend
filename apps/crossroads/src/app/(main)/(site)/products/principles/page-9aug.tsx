// apps/crossroads/src/app/(main)/(site)/products/principles/page.tsx

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
  IconChecks,
  IconHandStop,
  IconRoute,
  IconSparkles,
} from "@tabler/icons-react";

const principles = [
  {
    name: "People Confirm What Matters",
    claim: "AI can move quickly. Trust still comes from human judgment.",
    body: "Catalyst can help notice, propose, summarize, and organize. But important knowledge does not become trusted just because software produced it. A person gets the final say.",
    icon: IconHandStop,
  },
  {
    name: "Good Stewardship Gets Easier",
    claim: "The system should reward people for paying attention.",
    body: "When a group tends its knowledge carefully, the work should become lighter over time. Catalyst is meant to get out of the way as trust, accuracy, and consistency improve.",
    icon: IconChecks,
  },
  {
    name: "Your Knowledge Can Travel",
    claim: "Useful knowledge should not be trapped in one tool.",
    body: "As AI tools keep changing, the scarce thing is not another chatbot. The scarce thing is trusted context: the material, language, and decisions that make an answer relevant to your real work.",
    icon: IconRoute,
  },
  {
    name: "Knowledge Builds As You Work",
    claim: "The best knowledge practice does not ask you to stop everything.",
    body: "Catalyst can grow through ordinary activity: a note after a meeting, a clarified policy, a better explanation of how something works. The prompts are visible, transparent, and always subject to review.",
    icon: IconSparkles,
  },
];

const proofPoints = [
  "Nothing important is accepted invisibly.",
  "Suggestions are invitations, not overrides.",
  "The client can see what was captured and why.",
  "The system supports care, diligence, and continuity.",
];

export default function ProductPrinciplesPage() {
  return (
    <Box
      className="crprinciples-root"
      bg="#F4F5F8"
      color="#1A2138"
      minH="100vh"
      overflowX="hidden"
      fontFamily='-apple-system, "Helvetica Neue", Arial, sans-serif'
    >
      <Box className="crprinciples-masthead" borderBottom="2px solid" borderColor="#B8922A">
        <Container className="crprinciples-masthead-inner" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
          <VStack align="start" gap={6} maxW="900px">
            <Badge bg="#E8ECF6" color="#2B3D6B" borderRadius="3px" px={2} py={1} letterSpacing="0.12em" textTransform="uppercase">
              Why Catalyst Works
            </Badge>
            <Heading as="h1" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "3xl", md: "5xl" }} lineHeight="1.08" letterSpacing="0">
              AI is fast. Fidelity comes from people.
            </Heading>
            <Text color="#5C6880" fontSize={{ base: "lg", md: "xl" }} lineHeight="1.7" maxW="68ch">
              Catalyst is built for organizations that want help from AI without giving up human judgment. It gives people a calmer way to gather, review, and grow trusted knowledge over time.
            </Text>
          </VStack>
        </Container>
      </Box>

      <Container className="crprinciples-intro" maxW="1180px" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>
        <Flex gap={{ base: 8, lg: 14 }} align={{ base: "start", lg: "center" }} direction={{ base: "column", lg: "row" }}>
          <Box className="crprinciples-intro-copy" flex="1" maxW="680px">
            <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" mb={3}>
              The operating promise
            </Text>
            <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "2xl", md: "4xl" }} letterSpacing="0" mb={5}>
              Catalyst helps you build knowledge while keeping responsibility where it belongs.
            </Heading>
            <Text color="#5C6880" fontSize={{ base: "md", md: "lg" }} lineHeight="1.75">
              A business, board, firm, studio, or school project does not need magic. It needs continuity, useful prompts, clearer records, and a trustworthy way to decide what deserves to last.
            </Text>
          </Box>

          <Box className="crprinciples-proof-panel" bg="#FFFFFF" border="1px solid" borderColor="#DDE1ED" borderRadius="4px" p={{ base: 5, md: 6 }} flex="0 1 390px" w="100%">
            <Text color="#B8922A" fontSize="xs" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" mb={4}>
              What this means in practice
            </Text>
            <VStack align="stretch" gap={3}>
              {proofPoints.map((point) => (
                <HStack key={point} gap={3} align="start">
                  <Box color="#1E4BD2" flexShrink={0} pt="2px">
                    <IconChecks size={17} />
                  </Box>
                  <Text color="#5C6880" fontSize="sm" lineHeight="1.6">
                    {point}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        </Flex>
      </Container>

      <Box className="crprinciples-band" bg="#FFFFFF" borderTop="1px solid" borderBottom="1px solid" borderColor="#DDE1ED" py={{ base: 12, md: 16 }}>
        <Container className="crprinciples-band-inner" maxW="1180px" px={{ base: 5, md: 8 }}>
          <SimpleGrid className="crprinciples-grid" columns={{ base: 1, md: 2 }} gap={4}>
            {principles.map((principle) => {
              const Icon = principle.icon;
              return (
                <Box key={principle.name} className="crprinciples-card" border="1px solid" borderColor="#DDE1ED" borderRadius="4px" p={{ base: 6, md: 7 }} minH="330px">
                  <VStack align="start" gap={5}>
                    <Box color="#1E4BD2">
                      <Icon size={30} />
                    </Box>
                    <Box>
                      <Text color="#B8922A" fontSize="sm" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" mb={3}>
                        {principle.name}
                      </Text>
                      <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "xl", md: "2xl" }} letterSpacing="0" lineHeight="1.2" mb={4}>
                        {principle.claim}
                      </Heading>
                      <Text color="#5C6880" lineHeight="1.7">
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
          bg="#EEF2FD"
          borderLeft="3px solid"
          borderColor="#1E4BD2"
          p={{ base: 6, md: 8 }}
          gap={6}
          align={{ base: "start", md: "center" }}
          justify="space-between"
          direction={{ base: "column", md: "row" }}
        >
          <Box maxW="760px">
            <Heading as="h2" fontFamily='Georgia, "Times New Roman", serif' fontWeight="400" fontSize={{ base: "xl", md: "2xl" }} letterSpacing="0" mb={3}>
              We build this way ourselves.
            </Heading>
            <Text color="#5C6880" lineHeight="1.7">
              Crossroads, Catalyst, and Mixtape are being shaped through the same discipline: gather the work, make the structure visible, let people confirm what matters, and keep improving the knowledge as the work continues.
            </Text>
          </Box>
          <Button asChild bg="#1E4BD2" color="white" borderRadius="3px" _hover={{ bg: "#173AA4" }}>
            <Link as={NextLink} href="/contact?interest=catalyst-principles">
              <HStack gap={2}>
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

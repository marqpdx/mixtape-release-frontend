"use client";

// CS-D1: Console page shell — 5-layer control surface
// CS-D3: Re-entry panel
// CS-D4: Signals panel
// CS-D5: Orientation panel
// CS-D6: Stewardship panel (collapsed by default)
// CS-D2: Universal Action Field — desktop wrapper over the live initiatives command contract

import { Box, Container, Heading, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { ConsoleActionField } from "@components/console/ConsoleActionField";
import { ReentryPanel } from "@components/console/ReentryPanel";
import { SignalsPanel } from "@components/console/SignalsPanel";
import { OrientationPanel } from "@components/console/OrientationPanel";
import { StewardshipPanel } from "@components/console/StewardshipPanel";

function SectionHeading({ children }: { children: React.ReactNode }) {
  const color = useColorModeValue("gray.700", "gray.300");
  return (
    <Heading as="h2" size="sm" color={color} mb={3}>
      {children}
    </Heading>
  );
}

export default function ConsolePage() {
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const sectionBorder = useColorModeValue("gray.100", "gray.750");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="2xl" py={8}>
        <VStack gap={8} align="stretch">

          {/* Intentions — Universal Action Field (CS-D2) */}
          <Box>
            <SectionHeading>Console</SectionHeading>
            <Text fontSize="sm" color={mutedColor} mb={4}>
              Parse, review, and execute quick commands without leaving Console.
            </Text>
            <ConsoleActionField />
          </Box>

          {/* Re-entry (CS-D3) */}
          <Box borderTop="1px solid" borderColor={sectionBorder} pt={6}>
            <SectionHeading>Resume</SectionHeading>
            <ReentryPanel />
          </Box>

          {/* Signals (CS-D4) */}
          <Box borderTop="1px solid" borderColor={sectionBorder} pt={6}>
            <SectionHeading>Signals</SectionHeading>
            <SignalsPanel />
          </Box>

          {/* Orientation (CS-D5) */}
          <Box borderTop="1px solid" borderColor={sectionBorder} pt={6}>
            <SectionHeading>Working Context</SectionHeading>
            <OrientationPanel />
          </Box>

          {/* Stewardship (CS-D6) — collapsed by default via Accordion */}
          <Box borderTop="1px solid" borderColor={sectionBorder} pt={6}>
            <StewardshipPanel />
          </Box>

        </VStack>
      </Container>
    </Box>
  );
}

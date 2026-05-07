// apps/mixtape/src/app/(authenticated)/console/page.tsx

"use client";

// CS-D1: Console page — control surface with quick nav + two-column layout
// CS-D2: Universal Action Field
// CS-D3: Re-entry panel
// CS-D4: Signals panel
// CS-D5: Orientation panel
// CS-D6: Stewardship panel (collapsed by default)
// CS-D7: Right sidebar — Initiatives, Remind Me's, Let's Fix's, We Need More's

import { Box, Button, Container, Grid, GridItem, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { ConsoleActionField } from "@components/console/ConsoleActionField";
import { ReentryPanel } from "@components/console/ReentryPanel";
import { SignalsPanel } from "@components/console/SignalsPanel";
import { OrientationPanel } from "@components/console/OrientationPanel";
import { StewardshipPanel } from "@components/console/StewardshipPanel";
import { ConsoleSidebar } from "@components/console/ConsoleSidebar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

function SectionHeading({ children }: { children: React.ReactNode }) {
  const color = useColorModeValue("gray.700", "gray.300");
  return (
    <Heading as="h2" size="sm" color={color} mb={3}>
      {children}
    </Heading>
  );
}

function QuickNav({ username }: { username: string }) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  return (
    <HStack
      gap={3}
      pb={5}
      mb={2}
      borderBottom="1px solid"
      borderColor={borderColor}
      flexWrap="wrap"
    >
      <Text fontSize="xs" color={mutedColor} fontWeight="medium" textTransform="uppercase" letterSpacing="wide">
        Go to
      </Text>
      <a href={`${SITE_URL}/members/${encodeURIComponent(username)}`} target="_blank" rel="noopener noreferrer">
        <Button size="xs" variant="outline">Publishing</Button>
      </a>
      <Link href="/dashboard">
        <Button size="xs" variant="outline">Dashboard</Button>
      </Link>
    </HStack>
  );
}

export default function ConsolePage() {
  const { user } = useAuth();
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const sectionBorder = useColorModeValue("gray.100", "gray.750");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const sidebarBg = useColorModeValue("white", "gray.850");
  const sidebarBorder = useColorModeValue("gray.200", "gray.700");

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="6xl" py={8}>
        {user && <QuickNav username={user.username} />}

        <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={8} alignItems="start">
          {/* Main column */}
          <GridItem>
            <VStack gap={8} align="stretch">

              {/* Universal Action Field (CS-D2) */}
              <Box>
                <SectionHeading>Console</SectionHeading>
                <Text fontSize="sm" color={mutedColor} mb={4}>
                  Parse, review, and execute quick commands. Use /n Name to start a new workstream.
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

              {/* Stewardship (CS-D6) */}
              <Box borderTop="1px solid" borderColor={sectionBorder} pt={6}>
                <StewardshipPanel />
              </Box>

            </VStack>
          </GridItem>

          {/* Right sidebar (CS-D7) */}
          <GridItem
            position={{ base: "static", lg: "sticky" }}
            top={{ lg: "24px" }}
          >
            <Box
              bg={sidebarBg}
              border="1px solid"
              borderColor={sidebarBorder}
              borderRadius="lg"
              p={4}
            >
              <SectionHeading>Activity</SectionHeading>
              <ConsoleSidebar />
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}

// apps/crossroads/src/app/membership/levels/page.tsx

"use client";

import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import { ParticipationCapabilityTable } from "@components/about/ParticipationCapabilityTable";
import { ParticipationRoleCards } from "@components/about/ParticipationRoleCards";
import { ParticipationTransitionCallouts } from "@components/about/ParticipationTransitionCallouts";
import { ParticipationPricingCallout } from "./callout";

export default function AboutLevelsPage() {
  return (
    <>
      <UnifiedNavbar extraCompact />
      <Box maxW="1200px" mx="auto" py={{ base: 10, md: 16 }} px={{ base: 5, md: 8 }}>
        <Stack gap={{ base: 8, md: 12 }}>
          <Stack gap={3}>
            <Heading as="h1" size="xl">
              Participation Levels
            </Heading>
            <Text fontSize="lg" color="theme.textSecondary">
              This is not a pricing page. These patterns exist to reduce confusion, make
              responsibility legible, and honor different ways of participating.
            </Text>
          </Stack>

          <ParticipationPricingCallout />

          <Stack gap={4}>
            <Heading as="h2" size="md">
              Choose your path
            </Heading>
            <ParticipationRoleCards />
          </Stack>

          <Stack gap={4}>
            <Heading as="h2" size="md">
              Capabilities at a glance
            </Heading>
            <ParticipationCapabilityTable />
          </Stack>

          <Stack gap={4}>
            <Heading as="h2" size="md">
              What changes when you step up
            </Heading>
            <ParticipationTransitionCallouts />
          </Stack>
        </Stack>
      </Box>
    </>
  );
}

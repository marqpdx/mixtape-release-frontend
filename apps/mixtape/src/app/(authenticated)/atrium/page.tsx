"use client";

import { Box, Container, Flex } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { AtriumHeader } from "@/components/atrium/AtriumHeader";
import { AtriumResumeCard } from "@/components/atrium/AtriumResumeCard";
import { AtriumOrientationPanel } from "@/components/atrium/AtriumOrientationPanel";
import { AtriumInitiationCard } from "@/components/atrium/AtriumInitiationCard";
import { AtriumCommunityPulse } from "@/components/atrium/AtriumCommunityPulse";

export default function AtriumPage() {
  const bgColor = useColorModeValue("gray.50", "gray.900");

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="860px" px={6} pt={10} pb={12}>

        {/* Zone A — AtriumHeader */}
        <AtriumHeader />

        {/* Zone B — AtriumResumeCard */}
        <Box mt={6}>
          <AtriumResumeCard />
        </Box>

        {/* Zone C — AtriumOrientationPanel */}
        <Box mt={5}>
          <AtriumOrientationPanel />
        </Box>

        {/* Zone B/C → Beryl cross-zone slot (AT-8) */}

        {/* Zones D + E — two-column lower zone */}
        <Flex
          mt={5}
          direction={{ base: "column", md: "row" }}
          gap={6}
          align="stretch"
        >
          {/* Zone D — AtriumInitiationCard, ~45% */}
          <Box flex="45">
            <AtriumInitiationCard />
          </Box>

          {/* Zone E — AtriumCommunityPulse, ~55% */}
          <Box flex="55">
            <AtriumCommunityPulse />
          </Box>
        </Flex>

        {/* Zone F — GristCommandBar (AT-7) */}
        <Box mt={6} />

      </Container>
    </Box>
  );
}

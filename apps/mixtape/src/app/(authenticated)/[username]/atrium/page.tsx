"use client";

import { useState } from "react";
import { Box, Container, Flex } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { AtriumHeader } from "@/components/atrium/AtriumHeader";
import { AtriumResumeCard } from "@/components/atrium/AtriumResumeCard";
import { AtriumOrientationPanel } from "@/components/atrium/AtriumOrientationPanel";
import { AtriumInitiationCard } from "@/components/atrium/AtriumInitiationCard";
import { AtriumCommunityPulse } from "@/components/atrium/AtriumCommunityPulse";
import { AtriumDialogSurface } from "@/components/atrium/AtriumDialogSurface";
import { GristCommandBar } from "@/components/grist/GristCommandBar";
import { BerylPresence } from "@/components/atrium/BerylPresence";
import { RadarOverlay } from "@/components/radar/RadarOverlay";

export default function AtriumPage({
  params: _params,
}: {
  params: Promise<{ username: string }>;
}) {
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const [radarOpen, setRadarOpen] = useState(false);

  const handleGristCommand = (cmd: string) => {
    if (cmd === "radar") setRadarOpen(true);
  };

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="860px" px={6} pt={10} pb={12}>

        {/* Zone A — AtriumHeader */}
        <AtriumHeader />

        {/* Zone B — Dialog surface: session list + compose + thread (AT-D2/D3) */}
        <Box mt={6}>
          <AtriumDialogSurface />
        </Box>

        {/* Zone C — AtriumResumeCard */}
        <Box mt={6}>
          <AtriumResumeCard />
        </Box>

        {/* Zone C — AtriumOrientationPanel */}
        <Box mt={5}>
          <AtriumOrientationPanel />
        </Box>

        {/* Beryl cross-zone slot — between C and D+E */}
        <Box mt={5}>
          <BerylPresence />
        </Box>

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

        {/* Zone F — GristCommandBar */}
        <Box mt={6}>
          <GristCommandBar onCommand={handleGristCommand} />
        </Box>

      </Container>

      <RadarOverlay open={radarOpen} onClose={() => setRadarOpen(false)} />
    </Box>
  );
}

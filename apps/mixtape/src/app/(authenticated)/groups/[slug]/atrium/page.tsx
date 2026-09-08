"use client";

import { use, useState } from "react";
import { Box, Flex, Spinner, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { GroupSurfaceShell } from "@components/surfaces/GroupSurfaceShell";
import { AtriumResumeCard } from "@/components/atrium/AtriumResumeCard";
import { AtriumOrientationPanel } from "@/components/atrium/AtriumOrientationPanel";
import { AtriumInitiationCard } from "@/components/atrium/AtriumInitiationCard";
import { AtriumCommunityPulse } from "@/components/atrium/AtriumCommunityPulse";
import { AtriumSidebarWrapper } from "@/components/atrium/AtriumSidebarWrapper";
import { GristCommandBar } from "@/components/grist/GristCommandBar";
import { BerylPresence } from "@/components/atrium/BerylPresence";
import { RadarOverlay } from "@/components/radar/RadarOverlay";

export default function GroupAtriumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, isLoading } = useAuth();
  const bgColor = "var(--theme-bg)";
  const mutedText = useColorModeValue("gray.500", "gray.400");
  const [radarOpen, setRadarOpen] = useState(false);

  const handleGristCommand = (cmd: string) => {
    if (cmd === "radar") setRadarOpen(true);
  };

  if (isLoading) {
    return (
      <Box className="gatrium-loading" minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bgColor}>
        <Spinner size="lg" />
      </Box>
    );
  }

  if (!user?.is_superuser) {
    return (
      <Box className="gatrium-gate" minH="100vh" display="flex" alignItems="center" justifyContent="center" bg={bgColor}>
        <Text color={mutedText} fontSize="sm">Atrium is not available yet.</Text>
      </Box>
    );
  }

  return (
    <GroupSurfaceShell groupSlug={slug} currentSurface="atrium">
      {/* gatrium-root fills gss-main height; flex column so dialog surface can grow */}
      <Box
        className="gatrium-root"
        bg={bgColor}
        flex="1"
        display="flex"
        flexDirection="column"
        minH="0"
        px={6}
        pt={4}
        pb={4}
      >
        {/* Centered max-width wrapper — fills remaining height */}
        <Box
          className="gatrium-inner"
          maxW="860px"
          w="full"
          mx="auto"
          flex="1"
          display="flex"
          flexDirection="column"
          minH="0"
        >
          <AtriumSidebarWrapper groupSlug={slug} />
        </Box>

        {/* Zones C–F: may be obsolete — hidden pending decision to remove */}
        <Box display="none">
          <AtriumResumeCard />
          <AtriumOrientationPanel />
          <BerylPresence />
          <Flex direction={{ base: "column", md: "row" }} gap={6}>
            <AtriumInitiationCard />
            <AtriumCommunityPulse />
          </Flex>
          <GristCommandBar onCommand={handleGristCommand} />
        </Box>

        <RadarOverlay open={radarOpen} onClose={() => setRadarOpen(false)} />
      </Box>
    </GroupSurfaceShell>
  );
}

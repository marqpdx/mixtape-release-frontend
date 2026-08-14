"use client";

import { use, useState } from "react";
import { Avatar, Box, Container, Flex, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useGroup } from "@mixtape/api/hooks/groups/useGroups";
import { AtriumResumeCard } from "@/components/atrium/AtriumResumeCard";
import { AtriumOrientationPanel } from "@/components/atrium/AtriumOrientationPanel";
import { AtriumInitiationCard } from "@/components/atrium/AtriumInitiationCard";
import { AtriumCommunityPulse } from "@/components/atrium/AtriumCommunityPulse";
import { AtriumDialogSurface } from "@/components/atrium/AtriumDialogSurface";
import { GristCommandBar } from "@/components/grist/GristCommandBar";
import { BerylPresence } from "@/components/atrium/BerylPresence";
import { RadarOverlay } from "@/components/radar/RadarOverlay";

function GroupAtriumHeader({ slug }: { slug: string }) {
  const { group } = useGroup(slug);
  const borderColor = useColorModeValue("gray.100", "gray.800");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const nameColor = useColorModeValue("gray.800", "gray.100");

  return (
    <Flex
      className="gatrium-header"
      h="56px"
      align="center"
      justify="space-between"
      borderBottomWidth="1px"
      borderColor={borderColor}
    >
      {/* Left — surface label */}
      <Text fontSize="sm" fontWeight="medium" letterSpacing="wide" color={labelColor}>
        Atrium
      </Text>

      {/* Right — group sponsor identity */}
      <Flex align="center" gap={2}>
        <Text fontSize="sm" fontWeight="semibold" color={nameColor}>
          {group?.title ?? slug}
        </Text>
        <Avatar.Root size="sm">
          <Avatar.Fallback>{(group?.title ?? slug)[0].toUpperCase()}</Avatar.Fallback>
        </Avatar.Root>
      </Flex>
    </Flex>
  );
}

export default function GroupAtriumPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const [radarOpen, setRadarOpen] = useState(false);

  const handleGristCommand = (cmd: string) => {
    if (cmd === "radar") setRadarOpen(true);
  };

  return (
    <Box className="gatrium-root" bg={bgColor} minH="100vh">
      <Container maxW="860px" px={6} pt={10} pb={12}>

        {/* Zone A — Group sponsor header */}
        <GroupAtriumHeader slug={slug} />

        {/* Zone B — Dialog surface: session list + compose + thread */}
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

        {/* Beryl cross-zone slot */}
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
          <Box flex="45">
            <AtriumInitiationCard />
          </Box>
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

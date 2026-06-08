"use client";

import { Box, Container, Flex } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

export default function AtriumPage() {
  const bgColor = useColorModeValue("gray.50", "gray.900");

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="860px" px={6} pt={10} pb={12}>

        {/* Zone A — AtriumHeader (AT-2) */}
        <Box h="56px" />

        {/* Zone B — AtriumResumeCard (AT-3) */}
        <Box mt={6} />

        {/* Zone C — AtriumOrientationPanel (AT-4) */}
        <Box mt={5} />

        {/* Zone B/C → Beryl cross-zone slot (AT-8) */}

        {/* Zones D + E — two-column lower zone */}
        <Flex
          mt={5}
          direction={{ base: "column", md: "row" }}
          gap={6}
          align="stretch"
        >
          {/* Zone D — AtriumInitiationCard (AT-5), ~45% */}
          <Box flex="45" />

          {/* Zone E — AtriumCommunityPulse (AT-6), ~55% */}
          <Box flex="55" />
        </Flex>

        {/* Zone F — GristCommandBar (AT-7) */}
        <Box mt={6} />

      </Container>
    </Box>
  );
}

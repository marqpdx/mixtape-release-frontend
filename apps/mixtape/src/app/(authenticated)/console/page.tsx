// apps/mixtape/src/app/(authenticated)/console/page.tsx
//
// WorkTable W1: stream-based console surface.
// Stream replaces main column panel layout.
// OrientationHeader collapses after first command field interaction.
// Right sidebar (captures by kind + Stewardship) unchanged.

"use client";

import { useRef, useState } from "react";
import { Box, Container, Grid, GridItem, Heading } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { StewardshipPanel } from "@components/console/StewardshipPanel";
import { ConsoleSidebar } from "@components/console/ConsoleSidebar";
import { OrientationHeader } from "@components/worktable/OrientationHeader";
import { WorkTableStream } from "@components/worktable/WorkTableStream";
import { WorkTableCommandField } from "@components/worktable/WorkTableCommandField";
import type { WorkTableContext } from "@components/worktable/types";
import type { StreamEntry } from "@mixtape/api/clients/worktable/worktableApi";

function SectionHeading({ children }: { children: React.ReactNode }) {
  const color = useColorModeValue("gray.700", "gray.300");
  return (
    <Heading as="h2" size="sm" color={color} mb={3}>
      {children}
    </Heading>
  );
}

export default function ConsolePage() {
  useAuth();
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const sidebarBg = useColorModeValue("white", "gray.850");
  const sidebarBorder = useColorModeValue("gray.200", "gray.700");

  const [context, setContext] = useState<WorkTableContext>({ kind: "personal" });
  const [orientationCollapsed, setOrientationCollapsed] = useState(false);
  const appendRef = useRef<((entry: StreamEntry) => void) | null>(null);

  const groupCtx = context.kind === "group" ? context : null;

  const handleCapture = (entry: StreamEntry) => {
    appendRef.current?.(entry);
  };

  const handleFirstInteraction = () => {
    if (!orientationCollapsed) setOrientationCollapsed(true);
  };

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="6xl" py={8}>
        <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={8} alignItems="start">

          {/* Main column — stream */}
          <GridItem>
            <OrientationHeader
              collapsed={orientationCollapsed}
              onToggle={() => setOrientationCollapsed((v) => !v)}
            />

            {/* Stream */}
            <Box mb={4} minH="300px">
              <WorkTableStream context={context} appendRef={appendRef} />
            </Box>

            {/* Command field — pinned at bottom of column */}
            <Box
              position="sticky"
              bottom={4}
              onClick={handleFirstInteraction}
            >
              <WorkTableCommandField
                context={context}
                onContextSwitch={setContext}
                onContextReturn={() => setContext({ kind: "personal" })}
                onCapture={handleCapture}
              />
            </Box>
          </GridItem>

          {/* Right sidebar — capture panels + stewardship (WT-D7) */}
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
              mb={4}
            >
              <SectionHeading>Activity</SectionHeading>
              <ConsoleSidebar groupSlug={groupCtx?.slug} />
            </Box>
            <Box
              bg={sidebarBg}
              border="1px solid"
              borderColor={sidebarBorder}
              borderRadius="lg"
              p={4}
            >
              <SectionHeading>Stewardship</SectionHeading>
              <StewardshipPanel />
            </Box>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
}

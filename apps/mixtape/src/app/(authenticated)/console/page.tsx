// apps/mixtape/src/app/(authenticated)/console/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Container, Grid, GridItem, HStack, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { StewardshipPanel } from "@components/console/StewardshipPanel";
import { ConsoleSidebar } from "@components/console/ConsoleSidebar";
import { OrientationHeader } from "@components/worktable/OrientationHeader";
import { WorkTableCommandField } from "@components/worktable/WorkTableCommandField";
import { ContextSwitcher } from "@components/worktable/ContextSwitcher";
import { ActionPanel } from "@components/worktable/ActionPanel";
import { DigestStream } from "@components/worktable/DigestStream";
import type { WorkTableContext } from "@components/worktable/types";
import type { StreamEntry } from "@mixtape/api/clients/worktable/worktableApi";
import type { ApertureLogEntry } from "@mixtape/api/clients/initiatives/initiativesApi";
import type { ActionMode } from "@components/worktable/ActionPanel";

// ---------------------------------------------------------------------------
// Panel ratio — persisted per user
// ---------------------------------------------------------------------------

type PanelRatio = "1:2" | "2:1";

const RATIO_KEY = (u: string) => `mixtape.web.console.panelRatio.${u}`;

function loadRatio(username: string): PanelRatio {
  try {
    const v = localStorage.getItem(RATIO_KEY(username));
    return v === "2:1" ? "2:1" : "1:2";
  } catch {
    return "1:2";
  }
}

function saveRatio(username: string, ratio: PanelRatio) {
  try { localStorage.setItem(RATIO_KEY(username), ratio); } catch {}
}

// ---------------------------------------------------------------------------
// Sidebar section heading
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  const color = useColorModeValue("gray.700", "gray.300");
  return (
    <Text fontSize="sm" fontWeight="semibold" color={color} mb={3}>
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// ConsolePage
// ---------------------------------------------------------------------------

export default function ConsolePage() {
  const { user } = useAuth();
  const bgColor = useColorModeValue("gray.50", "gray.900");
  const username = user?.username ?? "";
  const sidebarBg = useColorModeValue("white", "gray.850");
  const sidebarBorder = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const toggleColor = useColorModeValue("gray.500", "gray.400");

  const [context, setContext] = useState<WorkTableContext>({ kind: "personal" });
  const [orientationCollapsed, setOrientationCollapsed] = useState(true);
  const [actionMode, setActionMode] = useState<ActionMode>("empty");
  const [panelRatio, setPanelRatio] = useState<PanelRatio>("1:2");

  const appendRef = useRef<((entry: StreamEntry) => void) | null>(null);
  const appendApertureRef = useRef<((entry: ApertureLogEntry) => void) | null>(null);

  // Load persisted ratio after username is available
  useEffect(() => {
    if (username) setPanelRatio(loadRatio(username));
  }, [username]);

  const groupCtx = context.kind === "group" ? context : null;

  const handleCapture = (entry: StreamEntry) => {
    appendRef.current?.(entry);
  };

  const handleApertureCapture = (entry: ApertureLogEntry) => {
    appendApertureRef.current?.(entry);
  };

  function toggleRatio() {
    const next: PanelRatio = panelRatio === "1:2" ? "2:1" : "1:2";
    setPanelRatio(next);
    if (username) saveRatio(username, next);
  }

  const leftCols = panelRatio === "1:2" ? "1fr" : "2fr";
  const rightCols = panelRatio === "1:2" ? "2fr" : "1fr";

  return (
    <Box bg={bgColor} minH="100vh">
      <Container maxW="6xl" py={8}>
        <Grid templateColumns={{ base: "1fr", lg: "1fr 300px" }} gap={8} alignItems="start">

          {/* Main column */}
          <GridItem>
            {/* 1 — Context switcher */}
            <ContextSwitcher context={context} username={username} onSelect={setContext} />

            {/* 2 — Command field */}
            <Box mb={4}>
              <WorkTableCommandField
                context={context}
                onContextSwitch={setContext}
                onContextReturn={() => setContext({ kind: "personal" })}
                onCapture={handleCapture}
                onApertureCapture={handleApertureCapture}
              />
            </Box>

            {/* 3 — Panel ratio toggle */}
            <HStack justify="flex-end" mb={2}>
              <Box
                as="button"
                fontSize="10px"
                color={toggleColor}
                onClick={toggleRatio}
                _hover={{ opacity: 0.7 }}
                letterSpacing="wide"
              >
                {panelRatio === "1:2" ? "⇤ expand left" : "expand right ⇥"}
              </Box>
            </HStack>

            {/* 4 — Two-pane work surface */}
            <Grid
              templateColumns={{ base: "1fr", md: `${leftCols} ${rightCols}` }}
              gap={4}
              mb={4}
              alignItems="start"
            >
              {/* Left — Action surface */}
              <GridItem>
                <ActionPanel mode={actionMode} context={context} onClear={() => setActionMode("empty")} />
              </GridItem>

              {/* Right — Digest stream */}
              <GridItem>
                <DigestStream context={context} onAction={setActionMode} />
              </GridItem>
            </Grid>

            {/* 5 — Orientation (collapsed by default) */}
            <OrientationHeader
              collapsed={orientationCollapsed}
              onToggle={() => setOrientationCollapsed((v) => !v)}
            />
          </GridItem>

          {/* Right sidebar */}
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

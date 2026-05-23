// apps/mixtape/src/app/(authenticated)/console/page.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, Container, Grid, GridItem, HStack, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useAuth } from "@/lib/auth/AuthContext";
import { StewardshipPanel } from "@components/console/StewardshipPanel";
import { ConsoleSidebar } from "@components/console/ConsoleSidebar";
import { OrientationHeader } from "@components/worktable/OrientationHeader";
import { WorkTableCommandField } from "@components/worktable/WorkTableCommandField";
import { ContextSwitcher } from "@components/worktable/ContextSwitcher";
import { ActionPanel } from "@components/worktable/ActionPanel";
import { DigestStream } from "@components/worktable/DigestStream";
import { ApertureLogStream } from "@components/worktable/ApertureLogStream";
import type { WorkTableContext } from "@components/worktable/types";
import type { StreamEntry } from "@mixtape/api/clients/worktable/worktableApi";
import type { ApertureLogEntry } from "@mixtape/api/clients/initiatives/initiativesApi";
import type { ActionMode } from "@components/worktable/ActionPanel";

// ---------------------------------------------------------------------------
// Panel ratio — persisted per user
// ---------------------------------------------------------------------------

type PanelWidth = "33" | "50" | "67";

const RATIO_KEY = (u: string) => `mixtape.web.console.panelRatio.${u}`;

function loadRatio(username: string): PanelWidth {
  try {
    const v = localStorage.getItem(RATIO_KEY(username));
    if (v === "33" || v === "50" || v === "67") return v;
    if (v === "2:1") return "67";
    return "33";
  } catch {
    return "33";
  }
}

function saveRatio(username: string, width: PanelWidth) {
  try { localStorage.setItem(RATIO_KEY(username), width); } catch {}
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
  const toggleColor = useColorModeValue("gray.500", "gray.400");

  const [context, setContext] = useState<WorkTableContext>({ kind: "personal" });
  const [orientationCollapsed, setOrientationCollapsed] = useState(true);
  const [actionMode, setActionMode] = useState<ActionMode>("empty");
  const [panelWidth, setPanelWidth] = useState<PanelWidth>("33");

  const appendRef = useRef<((entry: StreamEntry) => void) | null>(null);
  const appendApertureRef = useRef<((entry: ApertureLogEntry) => void) | null>(null);

  // Load persisted width after username is available
  useEffect(() => {
    if (username) setPanelWidth(loadRatio(username));
  }, [username]);

  const handleCapture = (entry: StreamEntry) => {
    appendRef.current?.(entry);
  };

  const handleApertureCapture = (entry: ApertureLogEntry) => {
    appendApertureRef.current?.(entry);
  };

  function handleWidthChange(w: PanelWidth) {
    setPanelWidth(w);
    if (username) saveRatio(username, w);
  }

  const leftCols = panelWidth === "67" ? "2fr" : "1fr";
  const rightCols = panelWidth === "33" ? "2fr" : "1fr";

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
                onHandover={() => setActionMode("handover")}
              />
            </Box>

            {/* 3 — Panel width toggle */}
            <HStack justify="flex-end" mb={2} gap={1}>
              {(["33", "50", "67"] as PanelWidth[]).map((w) => (
                <Box
                  key={w}
                  as="button"
                  fontSize="10px"
                  px={1.5}
                  py={0.5}
                  borderRadius="sm"
                  color={panelWidth === w ? "blue.400" : toggleColor}
                  fontWeight={panelWidth === w ? "700" : "400"}
                  onClick={() => handleWidthChange(w)}
                  _hover={{ opacity: 0.7 }}
                  letterSpacing="wide"
                >
                  {w}%
                </Box>
              ))}
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
                <ActionPanel
                  mode={actionMode}
                  context={context}
                  onClear={() => setActionMode("empty")}
                  onApertureCapture={handleApertureCapture}
                />
              </GridItem>

              {/* Right — Stream */}
              <GridItem>
                {context.kind === "initiative" ? (
                  <ApertureLogStream
                    initiativeId={context.id}
                    onAction={setActionMode}
                    appendRef={appendApertureRef}
                  />
                ) : (
                  <DigestStream context={context} onAction={setActionMode} />
                )}
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
              <ConsoleSidebar context={context} onInitiativeSelect={setContext} />
            </Box>
            <Box
              bg={sidebarBg}
              border="1px solid"
              borderColor={sidebarBorder}
              borderRadius="lg"
              p={4}
              mb={4}
            >
              <SectionHeading>Generate</SectionHeading>
              <VStack gap={2} align="stretch">
                <Button
                  size="sm"
                  variant={actionMode === "draft" ? "solid" : "outline"}
                  colorPalette="blue"
                  width="full"
                  onClick={() => setActionMode(actionMode === "draft" ? "empty" : "draft")}
                >
                  ✨ Draft
                </Button>
                <Button
                  size="sm"
                  variant={actionMode === "refine" ? "solid" : "outline"}
                  colorPalette="purple"
                  width="full"
                  onClick={() => setActionMode(actionMode === "refine" ? "empty" : "refine")}
                >
                  ✂ Refine
                </Button>
              </VStack>
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

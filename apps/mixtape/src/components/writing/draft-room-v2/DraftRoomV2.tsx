// apps/mixtape/components/writing/draft-room-v2/DraftRoomV2.tsx
//
// Three-pane writing workspace:
//   Left (250px, collapsible)  — Draft Queue
//   Center (flex)              — Embedded Editor (full height)
//   Right (360px, collapsible) — Tabbed: Copy Desk | Inspector
//
// When a side panel is collapsed, the editor gains 12% padding
// on that side for a narrower, more focused writing surface.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Flex, IconButton, Spinner, Tabs, Text, VStack } from "@chakra-ui/react";
import { IconSparkles } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useDraftRoom } from "./useDraftRoom";
import { DraftQueue } from "./DraftQueue";
import { DraftEditor, DraftEditorEmpty } from "./DraftEditor";
import type { CopyDeskState } from "./DraftEditor";
import { DraftInspector } from "./DraftInspector";
import { CopyDesk } from "@components/writing/copydesk/CopyDesk";

interface SponsorConfig {
  type: "member";
  id: string;
  slug: string;
  displayName: string;
}

interface DraftRoomV2Props {
  sponsor: SponsorConfig;
}

export default function DraftRoomV2({ sponsor }: DraftRoomV2Props) {
  const {
    drafts,
    draftsLoading,
    selectedPieceId,
    piece,
    pieceLoading,
    selectPiece,
    title,
    setTitle,
    docJSON,
    setDocJSON,
    excerpt,
    setExcerpt,
    createDraft,
    refetchDrafts,
    openSessions,
  } = useDraftRoom(sponsor);

  // Build a set of draft IDs with active sessions for queue indicators
  const sessionDraftIds = useMemo(
    () => new Set(openSessions.keys()),
    [openSessions]
  );

  // Get session items for the currently selected draft
  const currentSession = selectedPieceId ? openSessions.get(selectedPieceId) : undefined;

  // Panel visibility
  const [queueCollapsed, setQueueCollapsed] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState("inspector");
  const [focusMode, setFocusMode] = useState(false);

  // Focus mode: collapse both panels for distraction-free writing
  const toggleFocusMode = useCallback(() => {
    setFocusMode((prev) => {
      const next = !prev;
      if (next) {
        setQueueCollapsed(true);
        setSidePanelOpen(false);
      }
      return next;
    });
  }, []);

  // Escape exits focus mode
  useEffect(() => {
    if (!focusMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusMode(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focusMode]);

  // Fade-in tracking for optimistic draft insert
  const [freshPieceId, setFreshPieceId] = useState<string | null>(null);

  // CopyDesk state from editor
  const [copyDeskState, setCopyDeskState] = useState<CopyDeskState>({
    selection: null,
    hasSelection: false,
    backgroundSummary: "",
    summaryIsGenerating: false,
    summaryIsPending: false,
    summaryError: null,
    summaryForceUpdate: null,
    documentWordCount: 0,
  });

  const bg = useColorModeValue("white", "gray.950");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const sparklesBg = useColorModeValue("green.50", "green.900");
  const sparklesBorder = useColorModeValue("green.200", "green.700");
  const sidePanelBg = useColorModeValue("gray.50", "gray.800");

  const hasBody = Boolean(
    docJSON &&
    Array.isArray(docJSON.content) &&
    (docJSON.content as Record<string, unknown>[]).length > 0
  );

  // Extra padding when panels are collapsed — narrows the writing surface
  const leftPad = queueCollapsed ? "12%" : "0px";
  const rightPad = !sidePanelOpen ? "12%" : "0px";
  const sidePadding = useMemo(() => {
    // Use the larger of the two as uniform padding, or combine
    if (queueCollapsed && !sidePanelOpen) return "8%"; // both collapsed
    if (queueCollapsed) return leftPad;
    if (!sidePanelOpen) return rightPad;
    return "0px";
  }, [queueCollapsed, sidePanelOpen, leftPad, rightPad]);

  // Called by DraftEditor after first autosave succeeds
  const handleFirstSave = useCallback(() => {
    if (selectedPieceId) {
      setFreshPieceId(selectedPieceId);
      refetchDrafts();
      setTimeout(() => setFreshPieceId(null), 1000);
    }
  }, [selectedPieceId, refetchDrafts]);

  const toggleSidePanel = useCallback(() => {
    setSidePanelOpen((prev) => !prev);
  }, []);

  const { summaryForceUpdate } = copyDeskState;
  const handleGenerateNewSummary = useCallback(() => {
    summaryForceUpdate?.();
  }, [summaryForceUpdate]);

  const handleCopyDeskStateChange = useCallback((state: CopyDeskState) => {
    setCopyDeskState(state);
  }, []);

  return (
    <Flex
      h="calc(100vh - 120px)"
      bg={bg}
      borderRadius="lg"
      overflow="hidden"
      borderWidth="1px"
      borderColor={borderColor}
    >
      {/* Left: Draft Queue (collapsible) */}
      <Box
        w={queueCollapsed ? "48px" : "250px"}
        flexShrink={0}
        transition="width 0.25s ease"
      >
        <DraftQueue
          drafts={drafts}
          isLoading={draftsLoading}
          selectedPieceId={selectedPieceId}
          onSelect={selectPiece}
          onNewDraft={createDraft}
          freshPieceId={freshPieceId}
          sessionDraftIds={sessionDraftIds}
          isCollapsed={queueCollapsed}
          onToggleCollapse={() => setQueueCollapsed((p) => !p)}
        />
      </Box>

      {/* Center: Editor (full height) */}
      <Box flex="1" minW={0}>
        {pieceLoading ? (
          <VStack h="100%" justify="center">
            <Spinner size="lg" />
            <Text fontSize="sm" color="gray.500">Loading draft...</Text>
          </VStack>
        ) : piece && selectedPieceId ? (
          <DraftEditor
            key={selectedPieceId}
            pieceId={selectedPieceId}
            sponsor={sponsor}
            title={title}
            docJSON={docJSON}
            excerpt={excerpt}
            onTitleChange={setTitle}
            onDocChange={setDocJSON}
            onExcerptChange={setExcerpt}
            onFirstSave={handleFirstSave}
            onCopyDeskStateChange={handleCopyDeskStateChange}
            sidePadding={sidePadding}
            focusMode={focusMode}
            onToggleFocusMode={toggleFocusMode}
          />
        ) : (
          <DraftEditorEmpty />
        )}
      </Box>

      {/* Right: Side panel toggle strip + expandable panel */}
      {piece && selectedPieceId ? (
        sidePanelOpen ? (
          /* Expanded side panel with tabs */
          <Box
            w="360px"
            flexShrink={0}
            borderLeft="1px solid"
            borderColor={borderColor}
            bg={sidePanelBg}
            display="flex"
            flexDirection="column"
            transition="width 0.3s ease"
            overflow="hidden"
          >
            <Tabs.Root
              value={sidePanelTab}
              onValueChange={(details) => setSidePanelTab(details.value)}
              size="sm"
              variant="line"
            >
              <Box
                display="flex"
                alignItems="center"
                borderBottom="1px solid"
                borderColor={borderColor}
                px={1}
              >
                <Tabs.List flex="1">
                  <Tabs.Trigger value="copydesk">Copy Desk</Tabs.Trigger>
                  <Tabs.Trigger value="inspector">Inspector</Tabs.Trigger>
                </Tabs.List>
                <IconButton
                  size="xs"
                  variant="ghost"
                  onClick={toggleSidePanel}
                  title="Close panel"
                >
                  <IconSparkles size={14} color="green" />
                </IconButton>
              </Box>

              <Box flex="1" overflow="hidden">
                <Tabs.Content value="copydesk" p={0} h="100%">
                  <CopyDesk
                    isOpen={true}
                    onToggle={toggleSidePanel}
                    width="100%"
                    draftId={selectedPieceId}
                    selection={copyDeskState.selection}
                    hasSelection={copyDeskState.hasSelection}
                    backgroundSummary={copyDeskState.backgroundSummary}
                    summaryIsGenerating={copyDeskState.summaryIsGenerating}
                    summaryIsPending={copyDeskState.summaryIsPending}
                    summaryError={copyDeskState.summaryError}
                    onGenerateNewSummary={handleGenerateNewSummary}
                    summary={excerpt}
                    setSummary={setExcerpt}
                    titleWordCount={title.length}
                    documentWordCount={copyDeskState.documentWordCount}
                    summaryWordCount={excerpt.length}
                  />
                </Tabs.Content>

                <Tabs.Content value="inspector" p={0} h="100%">
                  <DraftInspector
                    key={selectedPieceId}
                    piece={piece}
                    title={title}
                    excerpt={excerpt}
                    docJSON={docJSON as Record<string, unknown> | null}
                    hasBody={hasBody}
                    sponsor={sponsor}
                    onPublished={refetchDrafts}
                    sessionItems={currentSession?.items}
                    embedded
                  />
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          </Box>
        ) : (
          /* Collapsed: sparkles strip */
          <Box
            w="48px"
            flexShrink={0}
            borderLeft="1px solid"
            borderColor={borderColor}
            display="flex"
            flexDirection="column"
            alignItems="center"
            pt={3}
          >
            <IconButton
              size="sm"
              variant="ghost"
              bg={sparklesBg}
              border="1px solid"
              borderColor={sparklesBorder}
              borderRadius="full"
              shadow="sm"
              onClick={toggleSidePanel}
              title="Open Copy Desk"
              _hover={{ shadow: "md" }}
            >
              <IconSparkles size={16} color="green" />
            </IconButton>
          </Box>
        )
      ) : null}
    </Flex>
  );
}

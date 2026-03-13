// apps/mixtape/components/writing/draft-room-v2/DraftEditor.tsx
//
// Center pane: lightweight embedded editor for Draft Room V2.
// Contains TitleInput + MainEditor + StatusBar.
// Solo mode only — no collab, no outline, no CopyDesk.
// Exposes selection + summary state for the CopyDesk side panel.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, HStack, IconButton, Text, VStack } from "@chakra-ui/react";
import { IconMaximize, IconMinimize } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";

import { MainEditor } from "@components/writing/composer/MainEditor";
import { TitleInput } from "@components/writing/composer/TitleInput";
import { StatusMessage } from "@components/writing/composer/StatusMessage";
import { useWorkingCopyAutosave } from "@/lib/writing/useWorkingCopyAutosave";
import { useStreamAuthoring } from "@/hooks/useStreamAuthoring";
import { useCursorMemory } from "./useCursorMemory";
import { useCreateArtifact } from "./useCreateArtifact";
import type { TextSelection } from "@components/writing/hooks/useTextSelection";

export interface CopyDeskState {
  selection: TextSelection | null;
  hasSelection: boolean;
  backgroundSummary: string;
  summaryIsGenerating: boolean;
  summaryIsPending: boolean;
  summaryError: unknown;
  summaryForceUpdate: (() => void) | null;
  documentWordCount: number;
}

interface SponsorConfig {
  type: "member";
  id: string;
  slug: string;
  displayName: string;
}

interface DraftEditorProps {
  pieceId: string;
  sponsor: SponsorConfig;
  title: string;
  docJSON: Record<string, unknown> | null;
  excerpt: string;
  onTitleChange: (t: string) => void;
  onDocChange: (d: Record<string, unknown> | null) => void;
  onExcerptChange?: (e: string) => void;
  onFirstSave?: () => void;
  /** Called whenever selection/summary state updates, for CopyDesk */
  onCopyDeskStateChange?: (state: CopyDeskState) => void;
  /** Extra padding on each side when panels are collapsed */
  sidePadding?: string;
  /** Whether distraction-free focus mode is active */
  focusMode?: boolean;
  /** Toggle distraction-free focus mode */
  onToggleFocusMode?: () => void;
}

const EMPTY_DOC: Record<string, unknown> = { type: "doc", content: [] };

export function DraftEditor({
  pieceId,
  sponsor,
  title,
  docJSON,
  excerpt,
  onTitleChange,
  onDocChange,
  onFirstSave,
  onCopyDeskStateChange,
  sidePadding = "0px",
  focusMode = false,
  onToggleFocusMode,
}: DraftEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hasSavedOnceRef = useRef(false);

  // Selection + AI summary state for CopyDesk
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [backgroundSummary, setBackgroundSummary] = useState("");
  const [summaryIsGenerating, setSummaryIsGenerating] = useState(false);
  const [summaryIsPending, setSummaryIsPending] = useState(false);
  const [summaryError, setSummaryError] = useState<unknown>(null);
  const [summaryForceUpdate, setSummaryForceUpdate] = useState<(() => void) | null>(null);
  const [documentWordCount, setDocumentWordCount] = useState(0);

  // Cursor memory — saves/restores cursor position per draft
  const { saveCursor } = useCursorMemory(pieceId, editorRef);

  // Stream authoring — activates lazily on first /new command
  const createArtifact = useCreateArtifact(sponsor);
  const {
    streamMode,
    deactivateStream,
  } = useStreamAuthoring({
    anchor: {
      contentTypeModel: "writingpiece",
      objectId: pieceId,
    },
    createArtifact,
    editorRef,
  });

  // Cleanup stream session on unmount (draft switch or component teardown)
  useEffect(() => {
    return () => {
      void deactivateStream();
    };
  }, [deactivateStream]);

  // Reset first-save tracking on piece switch
  useEffect(() => {
    hasSavedOnceRef.current = false;
  }, [pieceId]);

  // Autosave
  const { schedule, saveStatus } = useWorkingCopyAutosave(pieceId, 2500);

  // Track local state for autosave scheduling
  const titleRef = useRef(title);
  const docRef = useRef(docJSON);
  const excerptRef = useRef(excerpt);

  titleRef.current = title;
  docRef.current = docJSON;
  excerptRef.current = excerpt;

  const triggerSave = useMemo(
    () => () => {
      schedule({
        title: titleRef.current,
        body_json: docRef.current || EMPTY_DOC,
        excerpt: excerptRef.current,
      });
      saveCursor();
    },
    [schedule, saveCursor]
  );

  // Fire onFirstSave callback when status transitions to "saved" for the first time
  useEffect(() => {
    if (saveStatus === "saved" && !hasSavedOnceRef.current) {
      hasSavedOnceRef.current = true;
      onFirstSave?.();
    }
  }, [saveStatus, onFirstSave]);

  // MainEditor callbacks
  const handleSelectionChange = useCallback((newSelection: TextSelection | null) => {
    setSelection(newSelection);
    setHasSelection(!!newSelection && !newSelection.isEmpty);
  }, []);

  const handleBackgroundSummaryChange = useCallback((data: {
    summary: string;
    isGenerating: boolean;
    isPending: boolean;
    error: unknown;
    wordCount: number;
    forceUpdate: () => void;
  }) => {
    setBackgroundSummary(data.summary);
    setSummaryIsGenerating(data.isGenerating);
    setSummaryIsPending(data.isPending);
    setSummaryError(data.error);
    setDocumentWordCount(data.wordCount);
    setSummaryForceUpdate(() => data.forceUpdate);
  }, []);

  // Push CopyDesk state to parent
  useEffect(() => {
    onCopyDeskStateChange?.({
      selection,
      hasSelection,
      backgroundSummary,
      summaryIsGenerating,
      summaryIsPending,
      summaryError,
      summaryForceUpdate,
      documentWordCount,
    });
  }, [
    onCopyDeskStateChange,
    selection, hasSelection,
    backgroundSummary, summaryIsGenerating, summaryIsPending, summaryError,
    summaryForceUpdate, documentWordCount,
  ]);

  // Schedule save on content changes
  const handleTitleChange = useCallback((t: string) => {
    onTitleChange(t);
    triggerSave();
  }, [onTitleChange, triggerSave]);

  const handleDocChange = useCallback((d: Record<string, unknown>) => {
    onDocChange(d);
    triggerSave();
  }, [onDocChange, triggerSave]);

  // Focus editor on piece switch (cursor memory handles position restoration)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        editorRef.current?.commands?.focus?.();
      } catch {
        // ignore
      }
    }, 250);
    return () => clearTimeout(t);
  }, [pieceId]);

  const autoSave = useMemo(
    () => ({
      triggerSave,
      status: saveStatus,
    }),
    [triggerSave, saveStatus]
  );

  return (
    <Box
      h="100%"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      // Override MainEditor's hardcoded 56vh to fill available space
      css={{
        "& .main-editor-prose": { flex: 1, display: "flex", flexDirection: "column" },
        "& .reggie": { height: "100% !important", flex: 1 },
        "& .reggie .ProseMirror": { height: "100% !important" },
      }}
    >
      {/* Title */}
      <Box px={4} pt={3} pb={1} flexShrink={0} pl={`calc(16px + ${sidePadding})`} pr={`calc(16px + ${sidePadding})`}>
        <TitleInput title={title} setTitle={handleTitleChange} />
      </Box>

      {/* Editor — fills remaining space */}
      <Box flex="1" px={4} pb={1} overflow="hidden" display="flex" flexDirection="column"
        pl={`calc(16px + ${sidePadding})`} pr={`calc(16px + ${sidePadding})`}
        transition="padding 0.25s ease"
      >
        <MainEditor
          key={pieceId}
          ref={editorRef}
          docJSON={docJSON}
          onContentChange={handleDocChange}
          placeholder="Start writing..."
          autoSave={autoSave}
          editorMode="solo"
          streamMode={streamMode ?? undefined}
          onSelectionChange={handleSelectionChange}
          onBackgroundSummaryChange={handleBackgroundSummaryChange}
        />
      </Box>

      {/* Status bar */}
      <HStack
        px={4}
        py={1}
        borderTop="1px solid"
        borderColor={borderColor}
        flexShrink={0}
        justify="space-between"
      >
        <StatusMessage status={saveStatus} />
        {onToggleFocusMode && (
          <IconButton
            size="xs"
            variant="ghost"
            onClick={onToggleFocusMode}
            title={focusMode ? "Exit focus mode (Esc)" : "Focus mode"}
          >
            {focusMode ? <IconMinimize size={14} /> : <IconMaximize size={14} />}
          </IconButton>
        )}
      </HStack>
    </Box>
  );
}

/**
 * Empty state shown when no draft is selected
 */
export function DraftEditorEmpty() {
  const textColor = useColorModeValue("gray.400", "gray.500");

  return (
    <VStack h="100%" justify="center" gap={2}>
      <Text fontSize="lg" color={textColor}>
        Select a draft or create one
      </Text>
      <Text fontSize="sm" color={textColor} opacity={0.7}>
        Your writing workspace is ready
      </Text>
    </VStack>
  );
}

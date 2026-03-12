// apps/mixtape/components/writing/draft-room-v2/DraftEditor.tsx
//
// Center pane: lightweight embedded editor for Draft Room V2.
// Contains TitleInput + MainEditor + StatusBar.
// Solo mode only — no collab, no outline, no CopyDesk.

"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { Box, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

import { MainEditor } from "@components/writing/composer/MainEditor";
import { TitleInput } from "@components/writing/composer/TitleInput";
import { StatusMessage } from "@components/writing/composer/StatusMessage";
import { useWorkingCopyAutosave } from "@/lib/writing/useWorkingCopyAutosave";

interface DraftEditorProps {
  pieceId: string;
  title: string;
  docJSON: Record<string, unknown> | null;
  excerpt: string;
  onTitleChange: (t: string) => void;
  onDocChange: (d: Record<string, unknown> | null) => void;
  onExcerptChange?: (e: string) => void;
  onFirstSave?: () => void;
}

const EMPTY_DOC: Record<string, unknown> = { type: "doc", content: [] };

export function DraftEditor({
  pieceId,
  title,
  docJSON,
  excerpt,
  onTitleChange,
  onDocChange,
  onFirstSave,
}: DraftEditorProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hasSavedOnceRef = useRef(false);

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
    },
    [schedule]
  );

  // Fire onFirstSave callback when status transitions to "saved" for the first time
  useEffect(() => {
    if (saveStatus === "saved" && !hasSavedOnceRef.current) {
      hasSavedOnceRef.current = true;
      onFirstSave?.();
    }
  }, [saveStatus, onFirstSave]);

  // Schedule save on content changes
  const handleTitleChange = useCallback((t: string) => {
    onTitleChange(t);
    triggerSave();
  }, [onTitleChange, triggerSave]);

  const handleDocChange = useCallback((d: Record<string, unknown>) => {
    onDocChange(d);
    triggerSave();
  }, [onDocChange, triggerSave]);

  // Focus editor on piece switch
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        editorRef.current?.commands?.focus?.("end");
      } catch {
        // ignore
      }
    }, 100);
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
      <Box px={4} pt={3} pb={1} flexShrink={0}>
        <TitleInput title={title} setTitle={handleTitleChange} />
      </Box>

      {/* Editor — fills remaining space */}
      <Box flex="1" px={4} pb={1} overflow="hidden" display="flex" flexDirection="column">
        <MainEditor
          key={pieceId}
          ref={editorRef}
          docJSON={docJSON}
          onContentChange={handleDocChange}
          placeholder="Start writing..."
          autoSave={autoSave}
          editorMode="solo"
        />
      </Box>

      {/* Status bar */}
      <Box
        px={4}
        py={1}
        borderTop="1px solid"
        borderColor={borderColor}
        flexShrink={0}
      >
        <StatusMessage status={saveStatus} />
      </Box>
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

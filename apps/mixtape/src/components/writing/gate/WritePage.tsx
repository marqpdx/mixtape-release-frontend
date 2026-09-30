// components/writing/gate/WritePage.tsx
//
// The Page (/write/doc/:id) — Focus-Centered Writing ADR, Phase 1 (FCW-1).
// Reuses the same editor, autosave, and cursor-memory mechanism the
// classic Draft Room v2 uses (see draft-room-v2/DraftEditor.tsx) — not a
// fork. Adds: a back link to the Gate, and a collapsed "Pick up tools"
// tray that deep-links to the classic surfaces for this doc.

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  HStack,
  IconButton,
  Text,
  VStack,
  Spinner,
} from "@chakra-ui/react";
import { IconArrowLeft, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { MainEditor } from "@components/writing/composer/MainEditor";
import { TitleInput } from "@components/writing/composer/TitleInput";
import { StatusMessage } from "@components/writing/composer/StatusMessage";
import { useWorkingCopyAutosave } from "@/lib/writing/useWorkingCopyAutosave";
import { useCursorMemory } from "@components/writing/draft-room-v2/useCursorMemory";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

const EMPTY_DOC: Record<string, unknown> = { type: "doc", content: [] };

interface WritePageProps {
  pieceId: string;
}

export function WritePage({ pieceId }: WritePageProps) {
  const router = useRouter();
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [docJSON, setDocJSON] = useState<Record<string, unknown> | null>(EMPTY_DOC);
  const [excerpt, setExcerpt] = useState("");
  const [initialPosition, setInitialPosition] = useState<{ cursor: number; scroll: number } | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);

  const titleRef = useRef(title);
  const docRef = useRef(docJSON);
  const excerptRef = useRef(excerpt);
  titleRef.current = title;
  docRef.current = docJSON;
  excerptRef.current = excerpt;

  // Load the working copy once on mount.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    axiosInstance
      .get(`/api/writing/pieces/${pieceId}/working-copy`)
      .then((res) => {
        if (cancelled) return;
        const wc = res.data;
        setTitle(wc.title || "");
        setDocJSON(wc.body_json || EMPTY_DOC);
        setExcerpt(wc.excerpt || "");
        setInitialPosition({
          cursor: wc.cursor_position ?? 0,
          scroll: wc.scroll_position ?? 0,
        });
      })
      .catch((err) => {
        console.error("[WritePage] Failed to load doc:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pieceId]);

  const { schedule, saveStatus } = useWorkingCopyAutosave(pieceId, 2500);
  const { saveCursor, getCursorState } = useCursorMemory(pieceId, editorRef, initialPosition);

  const triggerSave = useMemo(
    () => () => {
      const position = getCursorState();
      schedule({
        title: titleRef.current,
        body_json: docRef.current || EMPTY_DOC,
        excerpt: excerptRef.current,
        ...(position && { cursor_position: position.cursor, scroll_position: position.scroll }),
      });
      saveCursor();
    },
    [schedule, saveCursor, getCursorState]
  );

  const handleTitleChange = useCallback(
    (t: string) => {
      setTitle(t);
      triggerSave();
    },
    [triggerSave]
  );

  const handleDocChange = useCallback(
    (d: Record<string, unknown>) => {
      setDocJSON(d);
      triggerSave();
    },
    [triggerSave]
  );

  // Focus the editor once loaded — capture is meant to start typing
  // immediately, not require a click first.
  useEffect(() => {
    if (isLoading) return;
    const t = setTimeout(() => {
      try {
        editorRef.current?.commands?.focus?.();
      } catch {
        // ignore
      }
    }, 250);
    return () => clearTimeout(t);
  }, [isLoading]);

  const autoSave = useMemo(() => ({ triggerSave, status: saveStatus }), [triggerSave, saveStatus]);

  if (isLoading) {
    return (
      <Box
        minH="calc(100vh - var(--app-topbar, 80px))"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="lg" />
      </Box>
    );
  }

  return (
    <Box
      minH="calc(100vh - var(--app-topbar, 80px))"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      className="wp-root"
    >
      {/* Back to Gate */}
      <HStack px={4} pt={3} flexShrink={0} className="wp-back-row">
        <IconButton
          size="xs"
          variant="ghost"
          aria-label="Back to Writing"
          onClick={() => router.push("/write")}
        >
          <IconArrowLeft size={16} />
        </IconButton>
        <Text fontSize="xs" color={mutedColor}>
          Writing
        </Text>
      </HStack>

      {/* Title */}
      <Box px={4} pt={2} pb={1} flexShrink={0}>
        <TitleInput title={title} setTitle={handleTitleChange} />
      </Box>

      {/* Editor — fills remaining space (same 56vh override as classic Draft Room) */}
      <Box
        flex="1"
        px={4}
        pb={1}
        overflow="hidden"
        display="flex"
        flexDirection="column"
        css={{
          "& .main-editor-prose": { flex: 1, display: "flex", flexDirection: "column" },
          "& .reggie": { height: "100% !important", flex: 1 },
          "& .reggie .ProseMirror": { height: "100% !important" },
        }}
      >
        <MainEditor
          key={pieceId}
          ref={editorRef}
          docJSON={docJSON}
          onContentChange={handleDocChange}
          placeholder="Start writing…"
          autoSave={autoSave}
          editorMode="solo"
        />
      </Box>

      {/* Status bar + collapsed Pick up tools tray */}
      <VStack align="stretch" gap={0} flexShrink={0} borderTop="1px solid" borderColor={borderColor}>
        <HStack px={4} py={1} justify="space-between">
          <StatusMessage status={saveStatus} />
          <IconButton
            size="xs"
            variant="ghost"
            aria-label={toolsOpen ? "Hide tools" : "Pick up tools"}
            onClick={() => setToolsOpen((v) => !v)}
          >
            {toolsOpen ? <IconChevronDown size={14} /> : <IconChevronUp size={14} />}
          </IconButton>
        </HStack>
        {toolsOpen && (
          <HStack px={4} pb={2} gap={3}>
            <Text
              as="button"
              fontSize="xs"
              color={mutedColor}
              textDecoration="underline"
              onClick={() => router.push("/dashboard?section=writing")}
            >
              Open in Draft Room
            </Text>
          </HStack>
        )}
      </VStack>
    </Box>
  );
}

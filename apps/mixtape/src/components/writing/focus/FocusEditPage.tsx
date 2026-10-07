// components/writing/focus/FocusEditPage.tsx
//
// Focus-Centered Writing ADR, Phase 2, FCW-8: the Edit instrument --
// full-screen Page + Focus trail + mini sequence rail; Done returns to
// the Focus with the same piece selected. Reuses the exact same editor,
// autosave, and cursor-memory primitives as the capture Page
// (WritePage.tsx) per the ADR's "reuse, don't fork" constraint (§5) --
// this component differs from WritePage only in its surrounding chrome
// (trail + rail instead of a bare back-to-Gate link), not in how the
// doc is loaded, edited, or saved.

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
import { IconArrowLeft } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { MainEditor } from "@components/writing/composer/MainEditor";
import { TitleInput } from "@components/writing/composer/TitleInput";
import { StatusMessage } from "@components/writing/composer/StatusMessage";
import { useWorkingCopyAutosave } from "@/lib/writing/useWorkingCopyAutosave";
import { useCursorMemory } from "@components/writing/draft-room-v2/useCursorMemory";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useFocus } from "@mixtape/api/hooks/useFocus";
import { useIssue } from "@mixtape/api/hooks/useIssueBoard";

const EMPTY_DOC: Record<string, unknown> = { type: "doc", content: [] };

interface FocusEditPageProps {
  focusId: string;
  pieceId: string;
}

export function FocusEditPage({ focusId, pieceId }: FocusEditPageProps) {
  const router = useRouter();
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const railActiveBg = useColorModeValue("blue.50", "blue.900");

  const { focus, updateState } = useFocus(focusId);
  const issueId = focus?.object_type === "issue" ? focus.object_id : null;
  const { issue } = useIssue(issueId);
  const ordered = useMemo(
    () => [...(issue?.placements ?? [])].sort((a, b) => a.order_index - b.order_index),
    [issue?.placements],
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [docJSON, setDocJSON] = useState<Record<string, unknown> | null>(EMPTY_DOC);
  const [excerpt, setExcerpt] = useState("");
  const [initialPosition, setInitialPosition] = useState<{ cursor: number; scroll: number } | null>(null);
  const [hasEdited, setHasEdited] = useState(false);

  const titleRef = useRef(title);
  const docRef = useRef(docJSON);
  const excerptRef = useRef(excerpt);
  titleRef.current = title;
  docRef.current = docJSON;
  excerptRef.current = excerpt;

  const { schedule, saveStatus, setRevision } = useWorkingCopyAutosave(pieceId, 2500);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setHasEdited(false);
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
        // Pieces reached from a Focus can be group-sponsored (unlike the
        // Gate/Page's solo capture flow this component otherwise mirrors),
        // which makes them a "shared group draft" server-side -- the PUT
        // endpoint then requires expected_auto_save_count to detect
        // concurrent edits (writing/api/views.py WorkingDocumentUpsertView),
        // returning 409 without it. Seed it from the GET, exactly as
        // DraftRoomBodyEditor does for the same reason.
        if (typeof wc.auto_save_count === "number") {
          setRevision(wc.auto_save_count);
        }
      })
      .catch((err) => {
        console.error("[FocusEditPage] Failed to load doc:", err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pieceId, setRevision]);
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
      setHasEdited(true);
      triggerSave();
    },
    [triggerSave]
  );

  const handleDocChange = useCallback(
    (d: Record<string, unknown>) => {
      setDocJSON(d);
      setHasEdited(true);
      triggerSave();
    },
    [triggerSave]
  );

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

  const goToFocus = useCallback(
    (openTool?: "shape") => {
      updateState.mutate({ selected_piece_id: pieceId, open_tool: openTool });
      router.push(`/focus/${focusId}`);
    },
    [focusId, pieceId, router, updateState],
  );

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
      className="fep-root"
    >
      {/* Focus trail */}
      <HStack px={4} pt={3} flexShrink={0} className="fep-trail" justify="space-between">
        <HStack gap={2}>
          <IconButton
            size="xs"
            variant="ghost"
            aria-label="Done"
            onClick={() => goToFocus()}
          >
            <IconArrowLeft size={16} />
          </IconButton>
          <Text fontSize="xs" color={mutedColor}>
            {issue?.designation || issue?.title || "Focus"} / Editing
          </Text>
        </HStack>
        <HStack
          as="button"
          gap={1}
          onClick={() => goToFocus()}
          className="fep-done"
        >
          <Text fontSize="xs" fontWeight="600">
            Done
          </Text>
        </HStack>
      </HStack>

      {/* Mini sequence rail */}
      {ordered.length > 1 && (
        <HStack
          px={4}
          py={2}
          gap={2}
          flexShrink={0}
          overflowX="auto"
          borderBottom="1px solid"
          borderColor={borderColor}
          className="fep-rail"
        >
          {ordered.map((p) => (
            <Text
              key={p.id}
              as="button"
              fontSize="xs"
              whiteSpace="nowrap"
              px={2}
              py={1}
              borderRadius="md"
              bg={p.piece_id === pieceId ? railActiveBg : undefined}
              fontWeight={p.piece_id === pieceId ? "600" : "400"}
              color={p.piece_id === pieceId ? undefined : mutedColor}
              onClick={() => {
                if (p.piece_id === pieceId) return;
                router.push(`/focus/${focusId}/piece/${p.piece_id}/edit`);
              }}
            >
              {p.piece_title || "Untitled"}
            </Text>
          ))}
        </HStack>
      )}

      {/* Title */}
      <Box px={4} pt={2} pb={1} flexShrink={0}>
        <TitleInput title={title} setTitle={handleTitleChange} />
      </Box>

      {/* Editor */}
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

      {/* Status bar + soft out-of-date notice */}
      <VStack align="stretch" gap={0} flexShrink={0} borderTop="1px solid" borderColor={borderColor}>
        <HStack px={4} py={1} justify="space-between">
          <StatusMessage status={saveStatus} />
          {hasEdited && (
            <Text
              as="button"
              fontSize="xs"
              color={mutedColor}
              textDecoration="underline"
              onClick={() => goToFocus("shape")}
            >
              Summaries may be out of date — review Shape
            </Text>
          )}
        </HStack>
      </VStack>
    </Box>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Input, Spinner, Text } from "@chakra-ui/react";
import type { JSONContent } from "@tiptap/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { SummarySection } from "@/components/writing/composer/SummarySection";
import { useWorkingCopyAutosave } from "@/lib/writing/useWorkingCopyAutosave";

const EMPTY_DOC: JSONContent = { type: "doc", content: [] };

interface DraftRoomBodyEditorProps {
  pieceId: string;
  pieceSlug: string;
  title: string;
  published: boolean;
  excerpt: string;
  onExcerptChange: (excerpt: string) => void;
  onBodyLoaded: (body: JSONContent, excerpt: string) => void;
  onBodyChange: (body: JSONContent) => void;
  onRevisionChange?: (revision: number) => void;
  onTitleLoaded?: (title: string) => void;
  /** When set, renders an editable title field above the editor and routes
   * edits back through this callback + autosave. Classic Draft Room already
   * has its own Title field in the Meta tab, so it leaves this unset; Editor's
   * Desk's multi-piece preview has no other place to edit title, so it uses
   * this inline field instead. */
  onTitleChange?: (title: string) => void;
  /** Suppress the Summary field -- used by Editor's Desk's Focus mode, which
   * wants body content only, no title/summary chrome. */
  hideSummary?: boolean;
}

export default function DraftRoomBodyEditor({ pieceId, pieceSlug, title, published, excerpt, onExcerptChange, onBodyLoaded, onBodyChange, onRevisionChange, onTitleLoaded, onTitleChange, hideSummary }: DraftRoomBodyEditorProps) {
  const [body, setBody] = useState<JSONContent | null>(null);
  const [loadError, setLoadError] = useState(false);
  const titleRef = useRef(title);
  const excerptRef = useRef(excerpt);
  const latestBodyRef = useRef<JSONContent | null>(null);
  const editedRef = useRef(false);
  const onRevisionChangeRef = useRef(onRevisionChange);
  onRevisionChangeRef.current = onRevisionChange;
  const handleRevisionSaved = useCallback((revision: number) => onRevisionChangeRef.current?.(revision), []);
  // Only adopt a backend-suggested excerpt if the author hasn't written one --
  // same guard useWorkingCopyAutosave documents for onExcerptSuggested, so a
  // suggestion arriving mid-typing never clobbers what the author just typed.
  const handleExcerptSuggested = useCallback((suggested: string) => {
    if (!excerptRef.current) onExcerptChange(suggested);
  }, [onExcerptChange]);
  const { schedule, saveNow, saveStatus, setRevision } = useWorkingCopyAutosave(pieceId, 1800, {
    onRevisionSaved: handleRevisionSaved,
    onExcerptSuggested: handleExcerptSuggested,
  });

  // Guard against a transient empty/undefined title prop (e.g. a parent list
  // still hydrating when this mounts) ever overwriting a previously-known-good
  // title in an autosave payload -- a real bug found in Editor's Desk preview
  // mode, where some pieces' titles were silently nulled by autosave.
  if (title) titleRef.current = title;
  excerptRef.current = excerpt;

  useEffect(() => {
    let active = true;
    const request = published
      ? axiosInstance.get(`/api/writing/pieces/${pieceId}`).catch(() =>
          axiosInstance.get(`/api/writing/pieces/view/${encodeURIComponent(pieceSlug)}`))
      : axiosInstance.get(`/api/writing/pieces/${pieceId}/working-copy`);

    request.then((response) => {
      if (!active) return;
      const data = response.data || {};
      const nextBody = data.body_json && typeof data.body_json === "object"
        ? data.body_json as JSONContent
        : EMPTY_DOC;
      if (typeof data.title === "string") {
        titleRef.current = data.title;
        onTitleLoaded?.(data.title);
      }
      const loadedExcerpt = data.excerpt || "";
      onExcerptChange(loadedExcerpt);
      if (typeof data.auto_save_count === "number") {
        setRevision(data.auto_save_count);
        onRevisionChangeRef.current?.(data.auto_save_count);
      }
      latestBodyRef.current = nextBody;
      onBodyLoaded(nextBody, loadedExcerpt);
      setBody(nextBody);
      setLoadError(false);
       
    }).catch(() => {
      if (!active) return;
      setLoadError(true);
    });

    return () => { active = false; };
    // Parent callbacks intentionally excluded: this load effect
    // should only re-run when the piece identity or mode changes, not when
    // the parent's excerpt-setter identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieceId, pieceSlug, published, setRevision]);

  useEffect(() => () => {
    if (editedRef.current && latestBodyRef.current) {
      void saveNow({
        title: titleRef.current,
        body_json: latestBodyRef.current,
        excerpt: excerptRef.current,
      });
    }
  }, [saveNow]);

  const handleContentChange = useCallback((content: JSONContent) => {
    editedRef.current = true;
    latestBodyRef.current = content;
    onBodyChange(content);
    schedule({ title: titleRef.current, body_json: content, excerpt: excerptRef.current });
  }, [onBodyChange, schedule]);

  const handleExcerptEdit = useCallback((value: string) => {
    onExcerptChange(value);
    editedRef.current = true;
    if (latestBodyRef.current) {
      schedule({ title: titleRef.current, body_json: latestBodyRef.current, excerpt: value });
    }
  }, [onExcerptChange, schedule]);

  const handleTitleEdit = useCallback((value: string) => {
    titleRef.current = value;
    onTitleChange?.(value);
    editedRef.current = true;
    if (latestBodyRef.current) {
      schedule({ title: value, body_json: latestBodyRef.current, excerpt: excerptRef.current });
    }
  }, [onTitleChange, schedule]);

  if (loadError) return <Text color="red.600">Could not load this piece. Try selecting it again.</Text>;
  if (!body) return <Spinner size="sm" />;

  return (
    <Box className="drbe-root" minW={0}>
      <Text fontSize="xs" color="theme.textSecondary" mb={2}>
        {published ? "Published content" : saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save failed" : "Draft content"}
      </Text>
      {!published && onTitleChange && (
        <Input
          value={title}
          onChange={(e) => handleTitleEdit(e.target.value)}
          placeholder="Title"
          fontSize="lg"
          fontWeight="semibold"
          variant="flushed"
          mb={3}
        />
      )}
      <TipTapEditor
        key={pieceId}
        initialContent={body}
        onContentChange={published ? undefined : handleContentChange}
        editable={!published}
        className="drbe-editor"
      />
      {!published && !hideSummary && (
        <Box mt={4}>
          <SummarySection summary={excerpt} setSummary={handleExcerptEdit} />
        </Box>
      )}
    </Box>
  );
}

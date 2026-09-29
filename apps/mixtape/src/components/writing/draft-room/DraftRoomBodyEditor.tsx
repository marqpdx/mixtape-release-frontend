"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Spinner, Text } from "@chakra-ui/react";
import type { JSONContent } from "@tiptap/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import TipTapEditor from "@/components/editor/TipTapEditor";
import { useWorkingCopyAutosave } from "@/lib/writing/useWorkingCopyAutosave";

const EMPTY_DOC: JSONContent = { type: "doc", content: [] };

interface DraftRoomBodyEditorProps {
  pieceId: string;
  pieceSlug: string;
  title: string;
  published: boolean;
  onBodyLoaded: (body: JSONContent, excerpt: string) => void;
  onBodyChange: (body: JSONContent) => void;
  onRevisionChange?: (revision: number) => void;
}

export default function DraftRoomBodyEditor({ pieceId, pieceSlug, title, published, onBodyLoaded, onBodyChange, onRevisionChange }: DraftRoomBodyEditorProps) {
  const [body, setBody] = useState<JSONContent | null>(null);
  const [loadError, setLoadError] = useState(false);
  const titleRef = useRef(title);
  const excerptRef = useRef("");
  const latestBodyRef = useRef<JSONContent | null>(null);
  const editedRef = useRef(false);
  const onRevisionChangeRef = useRef(onRevisionChange);
  onRevisionChangeRef.current = onRevisionChange;
  const handleRevisionSaved = useCallback((revision: number) => onRevisionChangeRef.current?.(revision), []);
  const { schedule, saveNow, saveStatus, setRevision } = useWorkingCopyAutosave(pieceId, 1800, {
    onRevisionSaved: handleRevisionSaved,
  });

  titleRef.current = title;

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
      excerptRef.current = data.excerpt || "";
      if (typeof data.auto_save_count === "number") {
        setRevision(data.auto_save_count);
        onRevisionChangeRef.current?.(data.auto_save_count);
      }
      latestBodyRef.current = nextBody;
      onBodyLoaded(nextBody, excerptRef.current);
      setBody(nextBody);
      setLoadError(false);
    }).catch(() => {
      if (!active) return;
      setLoadError(true);
    });

    return () => { active = false; };
  }, [pieceId, pieceSlug, published, onBodyLoaded, setRevision]);

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

  if (loadError) return <Text color="red.600">Could not load this piece. Try selecting it again.</Text>;
  if (!body) return <Spinner size="sm" />;

  return (
    <Box className="drbe-root" minW={0}>
      <Text fontSize="xs" color="theme.textSecondary" mb={2}>
        {published ? "Published content" : saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Save failed" : "Draft content"}
      </Text>
      <TipTapEditor
        key={pieceId}
        initialContent={body}
        onContentChange={published ? undefined : handleContentChange}
        editable={!published}
        className="drbe-editor"
      />
    </Box>
  );
}

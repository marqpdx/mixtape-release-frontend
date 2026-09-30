// components/writing/draft-room-v2/useCursorMemory.ts
//
// Persists cursor position and scroll offset per draft in localStorage,
// AND (as of the Focus-Centered Writing ADR's verify item, 2026-09-29)
// exposes the same values so the caller can send them to the server on
// autosave. localStorage remains the fast optimistic path (restores before
// any network round-trip); the server copy is what makes Resume work
// across devices/sessions, not just the browser that last edited.

"use client";

import { useCallback, useEffect, useRef } from "react";

interface EditorState {
  cursor: number;
  scroll: number;
  timestamp: number;
}

const STORAGE_PREFIX = "editor_state:";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getStoredState(pieceId: string): EditorState | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${pieceId}`);
    if (!raw) return null;
    const state: EditorState = JSON.parse(raw);
    if (Date.now() - state.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(`${STORAGE_PREFIX}${pieceId}`);
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

function saveState(pieceId: string, cursor: number, scroll: number) {
  try {
    const state: EditorState = { cursor, scroll, timestamp: Date.now() };
    localStorage.setItem(`${STORAGE_PREFIX}${pieceId}`, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EditorRef = React.RefObject<any>;

interface ServerPosition {
  cursor: number;
  scroll: number;
}

function readCurrentPosition(editorRef: EditorRef): { cursor: number; scroll: number } | null {
  const editor = editorRef.current;
  if (!editor) return null;
  try {
    const cursor = editor.state?.selection?.anchor ?? 0;
    const scrollEl = editor.view?.dom?.closest?.(".ProseMirror")?.parentElement;
    const scroll = scrollEl?.scrollTop ?? 0;
    return { cursor, scroll };
  } catch {
    return null;
  }
}

/**
 * Save and restore cursor position + scroll for a draft.
 *
 * Call `saveCursor()` on autosave, blur, or before switching drafts —
 * writes to localStorage only (fast, synchronous, no network).
 * Call `getCursorState()` to read the current position for sending to the
 * server as part of the normal autosave payload.
 *
 * `serverPosition`, when provided (e.g. from the doc's last-fetched working
 * copy), is preferred over localStorage on restore — it's the source of
 * truth for cross-device resume; localStorage only wins when no server
 * value exists yet (a doc never autosaved from any device).
 */
export function useCursorMemory(
  pieceId: string,
  editorRef: EditorRef,
  serverPosition?: ServerPosition | null
) {
  const pieceIdRef = useRef(pieceId);
  pieceIdRef.current = pieceId;

  const saveCursor = useCallback(() => {
    if (!pieceIdRef.current) return;
    const pos = readCurrentPosition(editorRef);
    if (!pos) return;
    saveState(pieceIdRef.current, pos.cursor, pos.scroll);
  }, [editorRef]);

  const getCursorState = useCallback((): ServerPosition | null => {
    return readCurrentPosition(editorRef);
  }, [editorRef]);

  // Restore on mount — server value wins when present and non-zero.
  useEffect(() => {
    const local = getStoredState(pieceId);
    const stored =
      serverPosition && (serverPosition.cursor > 0 || serverPosition.scroll > 0)
        ? { cursor: serverPosition.cursor, scroll: serverPosition.scroll, timestamp: Date.now() }
        : local;
    if (!stored) return;

    const timer = setTimeout(() => {
      const editor = editorRef.current;
      if (!editor) return;

      try {
        // Restore cursor position
        const docSize = editor.state?.doc?.content?.size ?? 0;
        const pos = Math.min(stored.cursor, docSize > 0 ? docSize - 1 : 0);
        if (pos > 0) {
          editor.commands?.setTextSelection?.(pos);
        }

        // Restore scroll position
        const scrollEl = editor.view?.dom?.closest?.(".ProseMirror")?.parentElement;
        if (scrollEl && stored.scroll > 0) {
          scrollEl.scrollTop = stored.scroll;
        }
      } catch {
        // ignore restore failures
      }
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pieceId, editorRef]);

  // Save on unmount
  useEffect(() => {
    return () => {
      saveCursor();
    };
  }, [saveCursor]);

  return { saveCursor, getCursorState };
}

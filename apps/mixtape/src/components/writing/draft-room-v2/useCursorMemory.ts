// components/writing/draft-room-v2/useCursorMemory.ts
//
// Persists cursor position and scroll offset per draft in localStorage.
// Restores when the draft is reopened, creating the feeling that the
// system remembers where the writer left off.

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

/**
 * Save and restore cursor position + scroll for a draft.
 *
 * Call `saveCursor()` on autosave, blur, or before switching drafts.
 * Cursor is auto-restored on mount after a short delay.
 */
export function useCursorMemory(pieceId: string, editorRef: EditorRef) {
  const pieceIdRef = useRef(pieceId);
  pieceIdRef.current = pieceId;

  const saveCursor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !pieceIdRef.current) return;

    try {
      const cursor = editor.state?.selection?.anchor ?? 0;
      const scrollEl = editor.view?.dom?.closest?.(".ProseMirror")?.parentElement;
      const scroll = scrollEl?.scrollTop ?? 0;
      saveState(pieceIdRef.current, cursor, scroll);
    } catch {
      // editor may be destroyed
    }
  }, [editorRef]);

  // Restore on mount
  useEffect(() => {
    const stored = getStoredState(pieceId);
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
  }, [pieceId, editorRef]);

  // Save on unmount
  useEffect(() => {
    return () => {
      saveCursor();
    };
  }, [saveCursor]);

  return { saveCursor };
}

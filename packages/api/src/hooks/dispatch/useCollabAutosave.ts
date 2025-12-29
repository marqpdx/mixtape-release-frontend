// src/hooks/dispatch/useCollabAutosave.ts

// Best-practice autosave for collaborative editing
// Browser saves lightweight snapshot; Node dispatch server saves yjs_state.

import { useEffect, useRef, useCallback, useState } from "react";
import * as Y from "yjs";
import { Editor } from "@tiptap/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

interface UseCollabAutosaveOptions {
  documentSlug: string;
  ydoc: Y.Doc | null;
  editor: Editor | null;
  enabled?: boolean;

  debounceMs?: number; // default: 2500ms
  maxWaitMs?: number;  // default: 30000ms

  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: any) => void;
}

export function useCollabAutosave({
  documentSlug,
  ydoc,
  editor,
  enabled = true,
  debounceMs = 2500,
  maxWaitMs = 30000,
  onSaveStart,
  onSaveSuccess,
  onSaveError,
}: UseCollabAutosaveOptions) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const dirtyRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxWaitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // single-flight + coalesce
  const savingRef = useRef(false);
  const saveAgainRef = useRef(false);

  // diff gating (snapshot)
  const lastSavedHashRef = useRef<string>("");

  // 429 backoff
  const backoffUntilRef = useRef<number>(0);
  const backoffMsRef = useRef<number>(0);

  function hashString(s: string) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return String(h);
  }

  const save = useCallback(async () => {
    if (!ydoc || !editor || !enabled) return;

    // if we’re in backoff, don’t spam; queue one retry
    const now = Date.now();
    if (now < backoffUntilRef.current) {
      saveAgainRef.current = true;
      return;
    }

    // nothing changed
    if (!dirtyRef.current) return;

    // single-flight
    if (savingRef.current) {
      saveAgainRef.current = true;
      return;
    }

    savingRef.current = true;
    dirtyRef.current = false;

    setStatus("saving");
    onSaveStart?.();

    try {
      // snapshot is the browser’s job; yjs_state is the server’s job
      const bodyJson = editor.getJSON();
      const snapshotString = JSON.stringify(bodyJson);
      const snapshotHash = hashString(snapshotString);

      // diff gate: don’t PATCH identical snapshot
      if (snapshotHash === lastSavedHashRef.current) {
        setStatus("idle");
        return;
      }

      await axiosInstance.patch(`/api/dispatch/content/${documentSlug}`, {
        body_json: bodyJson,
        updated_at: new Date().toISOString(),
      });

      // success: clear backoff
      backoffMsRef.current = 0;
      backoffUntilRef.current = 0;

      lastSavedHashRef.current = snapshotHash;

      setStatus("saved");
      setLastSaved(new Date());
      onSaveSuccess?.();

      setTimeout(() => setStatus("idle"), 2000);
    } catch (error: any) {
      const statusCode = error?.response?.status;

      if (statusCode === 429) {
        const prev = backoffMsRef.current || 750;
        const next = Math.min(prev * 2, 15000);
        backoffMsRef.current = next;
        backoffUntilRef.current = Date.now() + next;

        console.warn("⚠️ [CollabAutosave] 429; backing off", { ms: next });
        saveAgainRef.current = true; // ensure we retry once after backoff
      } else {
        console.error("❌ [CollabAutosave] Save failed:", error);
        onSaveError?.(error);
      }

      setStatus("error");
      dirtyRef.current = true; // mark dirty to retry

      setTimeout(() => setStatus("idle"), 3000);
    } finally {
      savingRef.current = false;

      // if something changed while saving/backing off, do exactly one more save
      if (saveAgainRef.current) {
        saveAgainRef.current = false;

        const wait = Math.max(0, backoffUntilRef.current - Date.now());
        if (wait > 0) {
          setTimeout(() => void save(), wait);
        } else {
          setTimeout(() => void save(), 250);
        }
      }
    }
  }, [documentSlug, ydoc, editor, enabled, onSaveStart, onSaveSuccess, onSaveError]);

  // Listen to Y.Doc updates to mark dirty
  useEffect(() => {
    if (!ydoc || !enabled) return;

    const handleUpdate = (_update: Uint8Array, origin: any) => {
      // Ignore remote updates applied by the adapter (those were caused by other clients)
      if (origin?.constructor?.name === "YjsSocketAdapter") return;

      dirtyRef.current = true;

      // debounce save
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => void save(), debounceMs);

      // max wait save
      if (!maxWaitTimerRef.current) {
        maxWaitTimerRef.current = setTimeout(() => {
          maxWaitTimerRef.current = null;
          void save();
        }, maxWaitMs);
      }
    };

    ydoc.on("update", handleUpdate);

    return () => {
      ydoc.off("update", handleUpdate);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (maxWaitTimerRef.current) clearTimeout(maxWaitTimerRef.current);
    };
  }, [ydoc, enabled, save, debounceMs, maxWaitMs]);

  // Manual save trigger
  const triggerSave = useCallback(() => {
    dirtyRef.current = true;
    void save();
  }, [save]);

  return { status, lastSaved, triggerSave };
}

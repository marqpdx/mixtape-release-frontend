// src/lib/writing/useWorkingCopyAutosave.ts

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import { toaster } from "@mixtape/core/lib/toaster";

interface WorkingCopyData {
  title: string;
  body_json: unknown;
  excerpt: string;
  /** Cursor (PM doc position) + scroll offset — optional, piggybacks on the
   * normal autosave request so Resume works cross-device. See
   * useCursorMemory's getCursorState(). */
  cursor_position?: number;
  scroll_position?: number;
}

type ApiError = { response?: { data?: { message?: string } } };
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
export type SplitSuggestionStatus = 'pending' | 'ready' | 'shown' | 'accepted' | 'dismissed' | 'declined' | 'superseded' | 'executed' | null;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error && typeof error === 'object') {
    const apiError = error as ApiError;
    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};

interface UseWorkingCopyAutosaveOptions {
  /**
   * Called after a successful autosave when the backend filled in a
   * suggested excerpt (because the field was blank). The caller decides
   * whether to adopt it — typically only if the field is still blank
   * locally, so a suggestion arriving after the round-trip never clobbers
   * something the user just typed.
   */
  onExcerptSuggested?: (excerpt: string) => void;
  onRevisionSaved?: (revision: number) => void;
}

export function useWorkingCopyAutosave(
  pieceId: string,
  debounceMs: number = 2500,
  options: UseWorkingCopyAutosaveOptions = {}
) {
  const { onExcerptSuggested, onRevisionSaved } = options;
  console.log(`🪝  useWorkingCopyAutosave called with pieceId: ${pieceId}`);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const queuedDataRef = useRef<WorkingCopyData | null>(null);
  // Mirrors whatever schedule() last queued, so the unmount cleanup can
  // flush it if the debounce timer never got a chance to fire. Cleared once
  // that data is actually handed to saveNow (whether via the timer or an
  // unmount flush), so a later unmount never re-sends stale data.
  const pendingDataRef = useRef<WorkingCopyData | null>(null);
  const pendingAfterCurrentRef = useRef(false);
  const latestAttemptRef = useRef(0);
  const revisionRef = useRef<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [splitSuggestionStatus, setSplitSuggestionStatus] = useState<SplitSuggestionStatus>(null);

  const setRevision = useCallback((revision: number) => {
    revisionRef.current = revision;
  }, []);

  useEffect(() => {
    revisionRef.current = null;
  }, [pieceId]);

  const clearResetStatusTimer = useCallback(() => {
    if (resetStatusTimer.current) {
      clearTimeout(resetStatusTimer.current);
      resetStatusTimer.current = null;
    }
  }, []);

  const scheduleStatusReset = useCallback((status: SaveStatus, ms: number) => {
    clearResetStatusTimer();
    resetStatusTimer.current = setTimeout(() => {
      setSaveStatus((current) => (current === status ? 'idle' : current));
      resetStatusTimer.current = null;
    }, ms);
  }, [clearResetStatusTimer]);

  const saveNow = useCallback(async (data: WorkingCopyData) => {
    console.log(`💾  saveNow called with:`, data);
    if (!pieceId) {
      console.warn('⚠️ No pieceId provided to saveNow');
      return;
    }

    queuedDataRef.current = data;

    if (savingRef.current) {
      pendingAfterCurrentRef.current = true;
      console.log('💾 Save already in flight, queueing latest payload');
      return;
    }

    savingRef.current = true;

    while (queuedDataRef.current) {
      const payload = queuedDataRef.current;
      queuedDataRef.current = null;
      pendingAfterCurrentRef.current = false;
      const attemptId = latestAttemptRef.current + 1;
      latestAttemptRef.current = attemptId;

      try {
        clearResetStatusTimer();
        setSaveStatus('saving');
        console.log('💾 Saving working copy now for piece:', pieceId);

        const response = await axiosInstance.put(`/api/writing/pieces/${pieceId}/working-copy`, {
          title: payload.title,
          body_json: payload.body_json,
          excerpt: payload.excerpt,
          expected_auto_save_count: revisionRef.current,
          ...(payload.cursor_position !== undefined && { cursor_position: payload.cursor_position }),
          ...(payload.scroll_position !== undefined && { scroll_position: payload.scroll_position }),
        });

        if (typeof response.data?.auto_save_count === 'number') {
          revisionRef.current = response.data.auto_save_count;
          onRevisionSaved?.(response.data.auto_save_count);
        }

        const suggestionStatus = response.data?.split_suggestion_status as SplitSuggestionStatus;
        if (suggestionStatus !== undefined) {
          setSplitSuggestionStatus(suggestionStatus);
        }

        // Field was blank when sent, backend filled in a suggestion — offer it back.
        const returnedExcerpt = response.data?.excerpt as string | undefined;
        if (!payload.excerpt && returnedExcerpt) {
          onExcerptSuggested?.(returnedExcerpt);
        }

        setSaveStatus('saved');
        console.log('✅ Working copy saved successfully');
        scheduleStatusReset('saved', 2000);
      } catch (e: unknown) {
        const isSuperseded = attemptId < latestAttemptRef.current || pendingAfterCurrentRef.current;

        if (isSuperseded) {
          console.warn('⚠️ Ignoring stale autosave failure:', e);
          continue;
        }

        setSaveStatus('error');
        console.error('❌ Failed to save working copy:', e);

        toaster.create({
          title: 'Autosave failed',
          description: getErrorMessage(e, 'Please try again'),
          type: 'error'
        });

        scheduleStatusReset('error', 5000);
      }
    }

    savingRef.current = false;
  }, [pieceId, clearResetStatusTimer, scheduleStatusReset, onExcerptSuggested, onRevisionSaved]);

  const schedule = useCallback((data: WorkingCopyData) => {
    console.log(`⏰  schedule called with:`, data);
    if (!pieceId) {
      console.warn('⚠️ No pieceId provided to schedule');
      return;
    }

    // Clear any existing timer
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    console.log(`⏰ Scheduling autosave in ${debounceMs}ms for piece:`, pieceId);

    pendingDataRef.current = data;

    // Schedule new save
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      pendingDataRef.current = null;
      saveNow(data);
    }, debounceMs);

  }, [pieceId, debounceMs, saveNow]); // Include saveNow in dependencies

  // Flush-on-unmount: if a debounced save was still pending (the timer
  // hadn't fired yet) when this unmounts -- e.g. the writer's last
  // keystroke happened just before navigating away -- cancel the timer and
  // fire that save immediately instead of silently discarding it. The
  // request itself is a plain fetch/XHR, so it keeps running in the
  // browser after an SPA navigation unmounts this component; we just can't
  // await it here. Found as a real, pre-existing gap via Focus-Centered
  // Writing FCW-4 testing (decisions/focus-centered-writing-adr/) -- fixed
  // here, in the shared hook, since classic Draft Room uses this same code
  // path and had the identical gap.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
        if (pendingDataRef.current) {
          const data = pendingDataRef.current;
          pendingDataRef.current = null;
          saveNow(data);
        }
      }
      clearResetStatusTimer();
    };
  }, [clearResetStatusTimer, saveNow]);

  // Return memoized object to prevent reference changes on every render
  return useMemo(() => ({
    schedule,
    saveNow,
    setRevision,
    saveStatus,
    splitSuggestionStatus,
    setSplitSuggestionStatus,
  }), [schedule, saveNow, saveStatus, splitSuggestionStatus]);
}

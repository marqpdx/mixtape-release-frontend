// src/lib/writing/useWorkingCopyAutosave.ts

import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import { toaster } from "@mixtape/core/lib/toaster";

interface WorkingCopyData {
  title: string;
  body_json: unknown;
  excerpt: string;
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

export function useWorkingCopyAutosave(
  pieceId: string,
  debounceMs: number = 2500
) {
  console.log(`🪝  useWorkingCopyAutosave called with pieceId: ${pieceId}`);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetStatusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const queuedDataRef = useRef<WorkingCopyData | null>(null);
  const pendingAfterCurrentRef = useRef(false);
  const latestAttemptRef = useRef(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [splitSuggestionStatus, setSplitSuggestionStatus] = useState<SplitSuggestionStatus>(null);

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
        });

        const suggestionStatus = response.data?.split_suggestion_status as SplitSuggestionStatus;
        if (suggestionStatus !== undefined) {
          setSplitSuggestionStatus(suggestionStatus);
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
  }, [pieceId, clearResetStatusTimer, scheduleStatusReset]); // Only depend on pieceId + local helpers

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

    // Schedule new save
    saveTimer.current = setTimeout(() => {
      saveNow(data);
    }, debounceMs);

  }, [pieceId, debounceMs, saveNow]); // Include saveNow in dependencies

  // Cleanup effect to clear timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      clearResetStatusTimer();
    };
  }, [clearResetStatusTimer]);

  // Return memoized object to prevent reference changes on every render
  return useMemo(() => ({
    schedule,
    saveNow,
    saveStatus,
    splitSuggestionStatus,
    setSplitSuggestionStatus,
  }), [schedule, saveNow, saveStatus, splitSuggestionStatus]);
}

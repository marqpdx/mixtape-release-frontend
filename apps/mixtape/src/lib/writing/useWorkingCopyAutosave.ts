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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const saveNow = useCallback(async (data: WorkingCopyData) => {
    console.log(`💾  saveNow called with:`, data);
    if (!pieceId) {
      console.warn('⚠️ No pieceId provided to saveNow');
      return;
    }

    try {
      setSaveStatus('saving');
      console.log('💾 Saving working copy now for piece:', pieceId);

      await axiosInstance.put(`/api/writing/pieces/${pieceId}/working-copy`, {
        title: data.title,
        body_json: data.body_json,
        excerpt: data.excerpt,
      });

      setSaveStatus('saved');
      console.log('✅ Working copy saved successfully');

      // Reset to idle after showing saved state briefly
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);

    } catch (e: unknown) {
      setSaveStatus('error');
      console.error('❌ Failed to save working copy:', e);

      toaster.create({
        title: 'Autosave failed',
        description: getErrorMessage(e, 'Please try again'),
        type: 'error'
      });

      // Reset to idle after showing error briefly
      setTimeout(() => {
        setSaveStatus('idle');
      }, 5000);
    }
  }, [pieceId]); // Only depend on pieceId - this is stable

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
    };
  }, []);

  // Return memoized object to prevent reference changes on every render
  return useMemo(() => ({
    schedule,
    saveNow,
    saveStatus,
  }), [schedule, saveNow, saveStatus]);
}

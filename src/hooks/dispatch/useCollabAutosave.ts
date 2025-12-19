// src/hooks/dispatch/useCollabAutosave.ts
// Unified autosave for collaborative editing
// Saves both Yjs state (for sync) and JSON snapshot (for publishing/search)

import { useEffect, useRef, useCallback, useState } from 'react';
import * as Y from 'yjs';
import { Editor } from '@tiptap/react';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';

interface UseCollabAutosaveOptions {
  documentSlug: string;
  ydoc: Y.Doc | null;
  editor: Editor | null;
  enabled?: boolean;

  // Timing controls
  debounceMs?: number;      // Time to wait after last change before saving (default: 2500ms)
  maxWaitMs?: number;        // Max time between saves while actively typing (default: 30000ms)

  // Callbacks
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
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const dirtyRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const maxWaitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  // The actual save function
  const save = useCallback(async () => {
    if (!ydoc || !editor || !enabled || isSavingRef.current) {
      return;
    }

    // Nothing changed since last save
    if (!dirtyRef.current) {
      console.log('💾 [CollabAutosave] No changes since last save, skipping');
      return;
    }

    isSavingRef.current = true;
    dirtyRef.current = false;
    setStatus('saving');
    onSaveStart?.();

    try {
      // Get current TipTap JSON snapshot
      const bodyJson = editor.getJSON();

      // Get current Yjs state as base64
      const state = Y.encodeStateAsUpdate(ydoc);
      const base64State = btoa(String.fromCharCode(...state));

      // Save both in a single request
      await axiosInstance.patch(`/api/dispatch/content/${documentSlug}`, {
        body_json: bodyJson,
        yjs_state: base64State,
        updated_at: new Date().toISOString(),
      });

      console.log('✅ [CollabAutosave] Saved successfully');
      setStatus('saved');
      setLastSaved(new Date());
      onSaveSuccess?.();

      // Clear "saved" status after 2 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('❌ [CollabAutosave] Save failed:', error);
      setStatus('error');
      dirtyRef.current = true; // Mark dirty again to retry
      onSaveError?.(error);

      // Clear error status after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    } finally {
      isSavingRef.current = false;
    }
  }, [documentSlug, ydoc, editor, enabled, onSaveStart, onSaveSuccess, onSaveError]);

  // Listen to Y.Doc updates to mark dirty
  useEffect(() => {
    if (!ydoc || !enabled) return;

    const handleUpdate = (update: Uint8Array, origin: any) => {
      // Ignore updates from socket (those are already saved by other clients)
      if (origin === 'socket' || origin?.constructor?.name === 'YjsSocketAdapter') {
        return;
      }

      console.log('📝 [CollabAutosave] Y.Doc changed, marking dirty');
      dirtyRef.current = true;

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(() => {
        console.log('⏰ [CollabAutosave] Debounce timer fired, saving...');
        save();
      }, debounceMs);

      // Set max wait timer if not already set
      if (!maxWaitTimerRef.current) {
        maxWaitTimerRef.current = setTimeout(() => {
          console.log('⏰ [CollabAutosave] Max wait timer fired, forcing save...');
          maxWaitTimerRef.current = null;
          save();
        }, maxWaitMs);
      }
    };

    ydoc.on('update', handleUpdate);

    return () => {
      ydoc.off('update', handleUpdate);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (maxWaitTimerRef.current) {
        clearTimeout(maxWaitTimerRef.current);
      }
    };
  }, [ydoc, enabled, save, debounceMs, maxWaitMs]);

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (dirtyRef.current && ydoc && editor && enabled) {
        console.log('🧹 [CollabAutosave] Unmounting with unsaved changes, saving now...');
        // Synchronous save attempt (best effort)
        const bodyJson = editor.getJSON();
        const state = Y.encodeStateAsUpdate(ydoc);
        const base64State = btoa(String.fromCharCode(...state));

        // Use sendBeacon for reliability on page unload
        const blob = new Blob([JSON.stringify({
          body_json: bodyJson,
          yjs_state: base64State,
          updated_at: new Date().toISOString(),
        })], { type: 'application/json' });

        navigator.sendBeacon(
          `/api/dispatch/content/${documentSlug}`,
          blob
        );
      }
    };
  }, []); // Only on unmount

  // Manual save trigger
  const triggerSave = useCallback(() => {
    console.log('💾 [CollabAutosave] Manual save triggered');
    dirtyRef.current = true; // Force dirty
    save();
  }, [save]);

  return {
    status,
    lastSaved,
    triggerSave,
  };
}

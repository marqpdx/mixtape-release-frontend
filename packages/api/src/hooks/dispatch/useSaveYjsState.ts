// packages/api/src/hooks/dispatch/useSaveYjsState.ts

// Hook to persist yjs binary state to Django backend

import { useState, useCallback } from "react";
import * as Y from "yjs";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// Helper: Convert Uint8Array to base64 in chunks to avoid stack overflow
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 8192; // Process 8KB at a time
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk) as any);
  }
  return btoa(binary);
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseSaveYjsStateReturn {
  saveYjsState: () => Promise<void>;
  status: SaveStatus;
  error: string | null;
}

interface DispatchContentMinimal {
  id: string;  // UUID for REST API calls
  yjs_document_id: string;  // UUID for Socket.IO room name
}

export function useSaveYjsState(
  ydoc: Y.Doc | null,
  dispatchContent: DispatchContentMinimal | null
): UseSaveYjsStateReturn {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const saveYjsState = useCallback(async () => {
    if (!ydoc || !dispatchContent?.id) {
      console.warn("⚠️ Cannot save: missing ydoc or dispatchContent.id");
      return;
    }

    setStatus("saving");
    setError(null);

    try {
      // Extract yjs binary state
      const state = Y.encodeStateAsUpdate(ydoc);

      // Convert to base64 for transmission
      const base64State = uint8ArrayToBase64(state);

      console.log("💾 Saving yjs state for document:", dispatchContent.id);

      // Send to backend using DispatchContent.id
      await axiosInstance.patch(
        `/api/dispatch/content/${dispatchContent.id}/yjs-state`,
        { yjs_state: base64State }
      );

      console.log("✅ Yjs state saved successfully");
      setStatus("saved");

      // Reset to idle after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err: any) {
      console.error("❌ Failed to save yjs state:", err);

      // Handle authentication errors gracefully
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        console.warn("⚠️ Not authenticated - skipping save");
        setStatus("idle"); // Don't show error for auth issues
        return;
      }

      const errorMessage = err?.response?.data?.error || "Failed to save document";
      setError(errorMessage);
      setStatus("error");
    }
  }, [ydoc, dispatchContent?.id]);

  return {
    saveYjsState,
    status,
    error,
  };
}

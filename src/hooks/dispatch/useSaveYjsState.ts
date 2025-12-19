// src/hooks/dispatch/useSaveYjsState.ts
// Hook to persist yjs binary state to Django backend

import { useState, useCallback } from "react";
import * as Y from "yjs";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";

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
      const base64State = btoa(
        String.fromCharCode(...new Uint8Array(state))
      );

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

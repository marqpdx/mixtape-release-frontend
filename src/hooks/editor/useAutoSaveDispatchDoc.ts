// src/hooks/useAutoSaveDispatchDoc.ts

import { useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { TipTapDoc } from "@/types/dispatchTypes";
// import { TipTapDoc } from "content/dispatchTypes";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type UseAutoSaveInput = {
  documentSlug: string;
  getContent: () => TipTapDoc;
  debounceMs?: number;
  isCollaborative?: boolean; // NEW: Flag to disable content autosave
};

export type UseAutoSaveOutput = {
  status: SaveStatus;
  triggerSave: () => void;
};

export function useAutoSaveDispatchDoc(
  config: UseAutoSaveInput | null
): UseAutoSaveOutput {
  if (!config) {
    return {
      status: "idle",
      triggerSave: () => {}, // no-op
    };
  }

  const { documentSlug, getContent, debounceMs, isCollaborative = false } = config;
  const effectiveDebounceMs = debounceMs ?? 5000;

  const [status, setStatus] = useState<SaveStatus>("idle");
  const isMounted = useRef(true);
  const lastSaved = useRef<string>("");
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  const save = async () => {
    // CRITICAL: Disable content autosave in collaborative mode
    // yjs handles real-time sync, saving content here would cause conflicts
    if (isCollaborative) {
      console.log("📝 Autosave skipped (collaborative mode - using yjs sync)");
      return;
    }

    if (!documentSlug || !getContent) return;

    function isValidTipTapDoc(obj: any): obj is TipTapDoc {
      return typeof obj?.type === "string" && Array.isArray(obj?.content);
    }

    const currentContent = getContent();
    if (!isValidTipTapDoc(currentContent)) return;

    const currentString = JSON.stringify(currentContent);

    // Skip saving if doc is still empty or unchanged
    const isEmpty = !currentContent?.type || !currentContent?.content;
    if (isEmpty || currentString === lastSaved.current) return;

    setStatus("saving");

    try {
      await axiosInstance.patch(`/api/dispatch/documents/${documentSlug}`, {
        content: currentContent,
      });
      lastSaved.current = currentString;
      retryCount.current = 0;
      if (isMounted.current) {
        setStatus("saved");
        setTimeout(() => {
          if (isMounted.current) setStatus("idle");
        }, 3000);
      }
    } catch (err: unknown) {
      console.error("Auto-save failed", err);

      if (isMounted.current) setStatus("error");
      retryCount.current += 1;
      if (retryCount.current <= MAX_RETRIES) {
        setTimeout(() => debouncedSave(), 5000);
      }
    }
  };

  const debouncedSave = useRef(debounce(save, effectiveDebounceMs)).current;

  useEffect(() => {
    return () => {
      isMounted.current = false;
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return {
    triggerSave: debouncedSave,
    status,
  };
}

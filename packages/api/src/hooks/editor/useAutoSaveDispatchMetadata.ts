// src/hooks/editor/useAutoSaveDispatchMetadata.ts
// Metadata-only autosave for collaborative documents
// Saves title, description, etc. WITHOUT touching content (yjs handles that)

import { useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type DispatchMetadata = {
  title?: string;
  description?: string;
  // Add other metadata fields as needed
  // NOT content - that's handled by yjs
};

type UseAutoSaveMetadataInput = {
  documentSlug: string;
  getMetadata: () => DispatchMetadata;
  debounceMs?: number;
};

type UseAutoSaveMetadataOutput = {
  status: SaveStatus;
  triggerSave: () => void;
};

export function useAutoSaveDispatchMetadata(
  config: UseAutoSaveMetadataInput | null
): UseAutoSaveMetadataOutput {
  if (!config) {
    return {
      status: "idle",
      triggerSave: () => {}, // no-op
    };
  }

  const { documentSlug, getMetadata, debounceMs } = config;
  const effectiveDebounceMs = debounceMs ?? 5000;

  const [status, setStatus] = useState<SaveStatus>("idle");
  const isMounted = useRef(true);
  const lastSaved = useRef<string>("");
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  const save = async () => {
    if (!documentSlug || !getMetadata) return;

    const metadata = getMetadata();
    if (!metadata) return;

    const metadataString = JSON.stringify(metadata);
    if (metadataString === lastSaved.current) return;

    setStatus("saving");

    try {
      // Only save metadata fields, NOT content
      await axiosInstance.patch(`/api/dispatch/content/${documentSlug}`, metadata);

      lastSaved.current = metadataString;
      retryCount.current = 0;
      if (isMounted.current) {
        setStatus("saved");
        setTimeout(() => {
          if (isMounted.current) setStatus("idle");
        }, 3000);
      }
    } catch (err: unknown) {
      console.error("Metadata auto-save failed", err);

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

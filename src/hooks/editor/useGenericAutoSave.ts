// src/hooks/editor/useGenericAutoSave.ts

import { useEffect, useRef, useState } from "react";
import debounce from "lodash.debounce";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type UseGenericAutoSaveInput<T> = {
  getContent: () => T;
  onSave: (content: T) => Promise<void>;
  debounceMs?: number;
  isValid?: (content: T) => boolean;
};

type UseGenericAutoSaveOutput = {
  status: SaveStatus;
  triggerSave: () => void;
};

export function useGenericAutoSave<T>(
  config: UseGenericAutoSaveInput<T> | null
): UseGenericAutoSaveOutput {
  if (!config) {
    return {
      status: "idle",
      triggerSave: () => {}, // no-op
    };
  }

  const { getContent, onSave, debounceMs, isValid } = config;
  const effectiveDebounceMs = debounceMs ?? 5000;

  const [status, setStatus] = useState<SaveStatus>("idle");
  const isMounted = useRef(true);
  const lastSaved = useRef<string>("");
  const retryCount = useRef(0);
  const MAX_RETRIES = 3;

  const save = async () => {
    const content = getContent();
    if (!content) return;

    if (isValid && !isValid(content)) return;

    const contentString = JSON.stringify(content);
    if (contentString === lastSaved.current) return;

    setStatus("saving");

    try {
      await onSave(content);
      lastSaved.current = contentString;
      retryCount.current = 0;
      if (isMounted.current) {
        setStatus("saved");
        setTimeout(() => {
          if (isMounted.current) setStatus("idle");
        }, 3000);
      }
    } catch (err: unknown) {
      console.error("Generic auto-save failed", err);
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

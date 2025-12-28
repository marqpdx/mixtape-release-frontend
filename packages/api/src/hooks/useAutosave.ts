// src/lib/hooks/useAutosave.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useAutosave<T>({
  debounceMs = 1500,
  onSave,
}: {
  debounceMs?: number;
  onSave: (data: T) => Promise<void>;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");

  const saveNow = useCallback(async (data: T) => {
    try {
      setStatus("saving");
      await onSave(data);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1200);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }, [onSave]);

  const schedule = useCallback((data: T) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => saveNow(data), debounceMs);
  }, [debounceMs, saveNow]);

  useEffect(() => () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  return useMemo(() => ({ status, saveNow, schedule }), [status, saveNow, schedule]);
}

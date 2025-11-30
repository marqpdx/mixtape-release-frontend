// src/lib/writing/useSeedAutosave.ts
import { useCallback, useRef, useState } from "react";
import { toaster } from "@/components/ui/toaster";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import { useAutosave } from "@/hooks/useAutosave";
// import { useAutosave } from "lib/hooks/useAutosave";

type SeedPayload = { body_text: string };

export function useSeedAutosave(initialText = "", debounceMs = 1500) {
  const [seedId, setSeedId] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(0); // to trigger re-renders on save
  const currentTextRef = useRef(initialText);

  const onSave = useCallback(
    async (data: SeedPayload) => {
      const trimmed = (data.body_text ?? "").trim();
      if (!seedId && trimmed.length === 0) {
        return; // gate creation
      }
      currentTextRef.current = data.body_text;
      if (!seedId) {
        const res = await axiosInstance.post("/api/writing/seeds", { body_text: data.body_text });
        setSeedId(res.data.id);
        return;
      }
      await axiosInstance.patch(`/api/writing/seeds/${seedId}`, { body_text: data.body_text });
      setSavedTick((t) => t + 1);
    },
    [seedId]
  );

  const { status, saveNow, schedule } = useAutosave<SeedPayload>({ debounceMs, onSave });

  const saveAndClose = useCallback(async () => {
    try {
      await saveNow({ body_text: currentTextRef.current });
      return seedId;
    } catch (e: any) {
      toaster.create({
        title: "Save failed",
        description: e?.response?.data?.message || e?.message || "Please try again.",
        type: "error",
      });
      throw e;
    }
  }, [saveNow, seedId]);

  const promoteToDraft = useCallback(async () => {
    if (!seedId) return null;
    const res = await axiosInstance.post(`/api/writing/seeds/${seedId}/promote`, {});
    return res.data; // { id, title }
  }, [seedId]);

  /** Attach to an existing Seed (for “edit previous” flow). */
  const attachExistingSeed = useCallback((id: string, bodyText: string) => {
    setSeedId(id);
    currentTextRef.current = bodyText;
  }, []);

  /** For safety when switching seeds before a debounce fires. */
  const cancelPending = useCallback(() => {
    // useAutosave doesn't expose timer; do an instant no-op save to cancel status transitions
    // or simply set status back via a tiny delay by saving the same text.
    // In practice switching text in Compose before schedule() re-queues is sufficient.
  }, []);

  return {
    seedId,
    status,
    schedule,
    saveNow: (body_text: string) => saveNow({ body_text }),
    saveAndClose,
    promoteToDraft,
    attachExistingSeed,
    cancelPending,
    savedTick, // can be used to trigger re-renders
  };
}

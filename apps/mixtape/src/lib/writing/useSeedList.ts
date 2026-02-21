// apps/mixtape/src/lib/writing/useSeedList.ts

"use client";

import { useCallback, useEffect, useState } from "react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export type SeedItem = {
  id: string;
  body_text: string;
  kind?: "text" | "voice";
  status?: "ready" | "processing" | "failed";
  audio_url?: string | null;
  transcript_text?: string | null;
  transcript_error?: string | null;
  created_at: string;
  updated_at: string;
  promoted_to?: string | null;
  context_url?: string | null;
  source?: string | null;
};

export function useSeedList(limit = 20, refreshToken?: number) {
  const [seeds, setSeeds] = useState<SeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeeds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosInstance.get<SeedItem[]>("/api/writing/seeds");
      const items = Array.isArray(res.data) ? res.data : [];
      setSeeds(items.slice(0, limit));
    } catch (err) {
      console.error(err);
      setError("Failed to load seeds.");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchSeeds();
  }, [fetchSeeds, refreshToken]);

  return { seeds, loading, error, refetch: fetchSeeds };
}

// hooks/atrium/useAtrium.ts

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as atriumApi from "@mixtape/api/clients/atrium/atriumApi";
import type { AtriumSession } from "@mixtape/core/types/atriumTypes";

export const atriumQueryKeys = {
  all: ["atrium"] as const,
  sessions: () => [...atriumQueryKeys.all, "sessions"] as const,
  context: (sessionId: string) => [...atriumQueryKeys.all, "context", sessionId] as const,
  entries: (sessionId: string) => [...atriumQueryKeys.all, "entries", sessionId] as const,
};

export function useAtriumSessions() {
  const { data: sessions = [], isLoading, error, refetch } = useQuery({
    queryKey: atriumQueryKeys.sessions(),
    queryFn: atriumApi.fetchAtriumSessions,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { sessions, isLoading, error: error as Error | null, refetch };
}

export function useCreateAtriumSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: atriumApi.createAtriumSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: atriumQueryKeys.sessions() });
    },
  });
}

export function useAtriumSessionContext(sessionId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: atriumQueryKeys.context(sessionId ?? ""),
    queryFn: () => atriumApi.fetchAtriumSessionContext(sessionId!),
    enabled: !!sessionId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    context: data?.context ?? null,
    sources: data?.sources ?? [],
    isLoading,
    error: error as Error | null,
  };
}

export function useUpdateAtriumSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, data }: { sessionId: string; data: { title?: string; session_context?: string } }) =>
      atriumApi.updateAtriumSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: atriumQueryKeys.sessions() });
    },
  });
}

// ---------------------------------------------------------------------------
// Session history (persisted entries)
// ---------------------------------------------------------------------------

export function useAtriumSessionEntries(sessionId: string | null) {
  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: atriumQueryKeys.entries(sessionId ?? ""),
    queryFn: () => atriumApi.fetchAtriumSessionEntries(sessionId!),
    enabled: !!sessionId,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  return { entries, isLoading, error: error as Error | null };
}

// ---------------------------------------------------------------------------
// SSE exchange hook
// ---------------------------------------------------------------------------

export interface ExchangeEntry {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

export function useAtriumExchange(session: AtriumSession | null) {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<ExchangeEntry[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load persisted history whenever the active session changes
  const { entries: history } = useAtriumSessionEntries(session?.id ?? null);

  useEffect(() => {
    setEntries(history);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, history]);

  const send = useCallback(
    async (message: string) => {
      if (!session || streaming) return;

      setError(null);
      setStreaming(true);

      // Optimistically add user turn
      setEntries((prev) => [...prev, { role: "user", content: message }]);

      abortRef.current = new AbortController();

      try {
        const resp = await fetch(`/api/atrium/sessions/${session.id}/exchange`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ message }),
          signal: abortRef.current.signal,
        });

        if (!resp.ok || !resp.body) {
          throw new Error(`Exchange failed (${resp.status})`);
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";

        // Add empty assistant entry for streaming-in
        setEntries((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const raw = decoder.decode(value, { stream: true });
          for (const line of raw.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.type === "delta") {
                assistantText += payload.text;
                setEntries((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: assistantText };
                  return next;
                });
              } else if (payload.type === "error") {
                setError(payload.detail ?? "An error occurred.");
              }
            } catch {
              // malformed SSE line — skip
            }
          }
        }

        // Invalidate session list (entry_count) and persisted entries (ids for promotion)
        queryClient.invalidateQueries({ queryKey: atriumQueryKeys.sessions() });
        queryClient.invalidateQueries({ queryKey: atriumQueryKeys.entries(session.id) });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [session, streaming, queryClient]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setEntries([]);
    setError(null);
  }, []);

  return { entries, streaming, error, send, cancel, reset };
}

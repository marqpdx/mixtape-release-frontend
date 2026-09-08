// hooks/atrium/useAtrium.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAccessToken } from "@mixtape/auth/tokenStorage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AtriumSponsorContext, WarmResult } from "@mixtape/api/clients/atrium/atriumApi";
import * as atriumApi from "@mixtape/api/clients/atrium/atriumApi";
import { buildApiUrl } from "@mixtape/api/lib/axiosInstance";
import type { AtriumContextStatus, AtriumDialMode, AtriumEntryType, AtriumSession, Distillate, DistillateDocumentType } from "@mixtape/core/types/atriumTypes";

export const atriumQueryKeys = {
  all: ["atrium"] as const,
  sessions: (groupSlug?: string) => [...atriumQueryKeys.all, "sessions", groupSlug ?? "personal"] as const,
  sponsorContext: (groupSlug?: string) => [...atriumQueryKeys.all, "sponsor-context", groupSlug ?? "personal"] as const,
  context: (sessionId: string) => [...atriumQueryKeys.all, "context", sessionId] as const,
  entries: (sessionId: string) => [...atriumQueryKeys.all, "entries", sessionId] as const,
};

export function useAtriumSessions(groupSlug?: string) {
  const { data: sessions = [], isLoading, error, refetch } = useQuery({
    queryKey: atriumQueryKeys.sessions(groupSlug),
    queryFn: () => atriumApi.fetchAtriumSessions(groupSlug),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { sessions, isLoading, error: error as Error | null, refetch };
}

export function useAtriumSponsorContext(groupSlug?: string) {
  const { data, isLoading, error } = useQuery<AtriumSponsorContext, Error>({
    queryKey: atriumQueryKeys.sponsorContext(groupSlug),
    queryFn: () => atriumApi.fetchAtriumSponsorContext(groupSlug),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { sponsorContext: data ?? null, isLoading, error };
}

export function useCreateAtriumSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; session_context?: string; group_slug?: string; initiative_id?: string }) =>
      atriumApi.createAtriumSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...atriumQueryKeys.all, "sessions"] });
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
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: { title?: string; session_context?: string; dial_mode?: AtriumDialMode };
    }) => atriumApi.updateAtriumSession(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...atriumQueryKeys.all, "sessions"] });
    },
  });
}

export function useWarmAtriumSession() {
  return useMutation<WarmResult, Error, string>({
    mutationFn: (sessionId: string) => {
      const token = getAccessToken();
      return atriumApi.warmAtriumSession(sessionId, token);
    },
  });
}

export function useCompactAtriumSession() {
  return useMutation({
    mutationFn: (sessionId: string) => atriumApi.compactAtriumSession(sessionId),
  });
}

export function useDistillAtriumSession() {
  return useMutation<Distillate, Error, { sessionId: string; title: string; document_type: DistillateDocumentType }>({
    mutationFn: ({ sessionId, title, document_type }) =>
      atriumApi.distillAtriumSession(sessionId, { title, document_type }),
  });
}

export function useResetAtriumSession() {
  return useMutation<{ status: string }, Error, string>({
    mutationFn: (sessionId: string) => atriumApi.resetAtriumSession(sessionId),
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

export function useAtriumInitiativeLog(sessionId: string | null) {
  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: [...atriumQueryKeys.all, "initiative-log", sessionId ?? ""],
    queryFn: () => atriumApi.fetchAtriumInitiativeLog(sessionId!),
    enabled: !!sessionId,
    staleTime: 5 * 60 * 1000,
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
  entry_type?: AtriumEntryType;
  document_title?: string;
}

const EMPTY_EXCHANGE_ENTRIES: ExchangeEntry[] = [];

function getEntriesSignature(entries: ExchangeEntry[]) {
  return entries.map((entry) => `${entry.id ?? ""}:${entry.role}:${entry.content}`).join("\n");
}

export function useAtriumExchange(session: AtriumSession | null) {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<ExchangeEntry[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityText, setActivityText] = useState<string | null>(null);
  const [contextStatus, setContextStatus] = useState<AtriumContextStatus | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load persisted history whenever the active session changes
  const { entries: history } = useAtriumSessionEntries(session?.id ?? null);
  const historySignature = useMemo(() => getEntriesSignature(history), [history]);

  useEffect(() => {
    setEntries(history.length > 0 ? history : EMPTY_EXCHANGE_ENTRIES);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, historySignature]);

  const send = useCallback(
    async (message: string) => {
      if (!session || streaming) return;

      setError(null);
      setActivityText(null);
      setStreaming(true);

      // Optimistically add user turn
      setEntries((prev) => [...prev, { role: "user", content: message }]);

      abortRef.current = new AbortController();

      try {
        const token = getAccessToken();
        const resp = await fetch(buildApiUrl(`/api/atrium/sessions/${session.id}/exchange`), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
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

        // Document envelope detection state
        let docTitle: string | null = null;
        let docBodyOffset = -1; // char index in assistantText where body starts

        // Add empty assistant entry for streaming-in
        setEntries((prev) => [...prev, { role: "assistant", content: "", entry_type: "message" }]);

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
                setActivityText(null);

                // Detect <document> envelope once opening tag is fully buffered
                if (docBodyOffset === -1 && assistantText.includes("<document")) {
                  const tagMatch = assistantText.match(/<document(?:\s+title="([^"]*)")?[^>]*>/);
                  if (tagMatch && tagMatch.index !== undefined) {
                    docTitle = tagMatch[1] ?? "";
                    docBodyOffset = tagMatch.index + tagMatch[0].length;
                  }
                }

                // Progressive body: strip envelope tags from displayed content
                const displayContent =
                  docBodyOffset >= 0
                    ? assistantText.slice(docBodyOffset).replace(/<\/document>\s*$/, "")
                    : assistantText;
                const displayEntryType: AtriumEntryType = docBodyOffset >= 0 ? "document" : "message";

                setEntries((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = {
                    role: "assistant",
                    content: displayContent,
                    entry_type: displayEntryType,
                    ...(docTitle !== null ? { document_title: docTitle } : {}),
                  };
                  return next;
                });
              } else if (payload.type === "activity") {
                setActivityText(payload.text as string);
              } else if (payload.type === "context_status") {
                setContextStatus({
                  used: payload.used as number,
                  total: payload.total as number,
                  pct: payload.pct as number,
                });
              } else if (payload.type === "fallback") {
                setUsedFallback(true);
              } else if (payload.type === "error") {
                setError(payload.detail ?? "An error occurred.");
              }
            } catch {
              // malformed SSE line — skip
            }
          }
        }

        // Fallback: if envelope opened but never closed, render as plain message
        if (docBodyOffset >= 0 && !assistantText.trimEnd().endsWith("</document>")) {
          setEntries((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: "assistant", content: assistantText, entry_type: "message" };
            return next;
          });
        }

        // Invalidate all session list variants (entry_count) + persisted entries (ids for promotion)
        queryClient.invalidateQueries({ queryKey: [...atriumQueryKeys.all, "sessions"] });
        queryClient.invalidateQueries({ queryKey: atriumQueryKeys.entries(session.id) });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setStreaming(false);
        setActivityText(null);
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
    setActivityText(null);
    setUsedFallback(false);
  }, []);

  // Appends a synthetic, non-persisted entry (e.g. a Grist verb result).
  // Lives only until the next persisted-history refetch.
  const appendLocalEntry = useCallback((entry: ExchangeEntry) => {
    setEntries((prev) => [...prev, entry]);
  }, []);

  return { entries, streaming, error, activityText, contextStatus, usedFallback, send, cancel, reset, appendLocalEntry };
}

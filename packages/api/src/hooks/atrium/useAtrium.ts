// hooks/atrium/useAtrium.ts

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAccessToken } from "@mixtape/auth/tokenStorage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AtriumSponsorContext, WarmResult } from "@mixtape/api/clients/atrium/atriumApi";
import * as atriumApi from "@mixtape/api/clients/atrium/atriumApi";
import { buildApiUrl } from "@mixtape/api/lib/axiosInstance";
import type {
  AtriumContextStatus,
  AtriumDialMode,
  AtriumEntryType,
  Dialogue,
  DialogueEntryStatus,
  DialogueProvider,
  Distillate,
  DistillateDocumentType,
} from "@mixtape/core/types/atriumTypes";

export const atriumQueryKeys = {
  all: ["atrium"] as const,
  sessions: (groupSlug?: string) => [...atriumQueryKeys.all, "sessions", groupSlug ?? "personal"] as const,
  sponsorContext: (groupSlug?: string) => [...atriumQueryKeys.all, "sponsor-context", groupSlug ?? "personal"] as const,
  context: (sessionId: string) => [...atriumQueryKeys.all, "context", sessionId] as const,
  entries: (sessionId: string) => [...atriumQueryKeys.all, "entries", sessionId] as const,
};

export function useDialogues(groupSlug?: string) {
  const { data: sessions = [], isLoading, error, refetch } = useQuery({
    queryKey: atriumQueryKeys.sessions(groupSlug),
    queryFn: () => atriumApi.fetchDialogues(groupSlug),
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

export function useCreateDialogue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; session_context?: string; group_slug?: string; initiative_id?: string }) =>
      atriumApi.createDialogue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...atriumQueryKeys.all, "sessions"] });
    },
  });
}

export function useDialogueContext(sessionId: string | null) {
  const { data, isLoading, error } = useQuery({
    queryKey: atriumQueryKeys.context(sessionId ?? ""),
    queryFn: () => atriumApi.fetchDialogueContext(sessionId!),
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

export function useUpdateDialogue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      data: { title?: string; session_context?: string; dial_mode?: AtriumDialMode };
    }) => atriumApi.updateDialogue(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...atriumQueryKeys.all, "sessions"] });
    },
  });
}

export function useWarmDialogue() {
  return useMutation<WarmResult, Error, string>({
    mutationFn: (sessionId: string) => {
      const token = getAccessToken();
      return atriumApi.warmDialogue(sessionId, token);
    },
  });
}

export function useCompactDialogue() {
  return useMutation({
    mutationFn: (sessionId: string) => atriumApi.compactDialogue(sessionId),
  });
}

export function useDistillDialogue() {
  return useMutation<Distillate, Error, { sessionId: string; title: string; document_type: DistillateDocumentType }>({
    mutationFn: ({ sessionId, title, document_type }) =>
      atriumApi.distillDialogue(sessionId, { title, document_type }),
  });
}

export function useResetDialogue() {
  return useMutation<{ status: string }, Error, string>({
    mutationFn: (sessionId: string) => atriumApi.resetDialogue(sessionId),
  });
}

// ---------------------------------------------------------------------------
// Session history (persisted entries)
// ---------------------------------------------------------------------------

export function useDialogueEntries(sessionId: string | null) {
  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: atriumQueryKeys.entries(sessionId ?? ""),
    queryFn: () => atriumApi.fetchDialogueEntries(sessionId!),
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
//
// ST-3 Part B: the reply is written on the runtime worker, as the Dialogue owner's own
// account, and saved as it arrives. The stream sends `turn` (the reply's entry id and
// agent), `delta`s, then `final` (the saved reply) and `done`, or `error` with a code.
// Because the reply is saved, a reload follows it again (entries/<id>/stream), and the
// person's message is kept even when the reply can't run.

export interface ExchangeEntry {
  id?: string;
  role: "user" | "assistant";
  content: string;
  entry_type?: AtriumEntryType;
  document_title?: string;
  speaker?: DialogueProvider | "";
  status?: DialogueEntryStatus;
  error_code?: string;
}

/** Codes whose fix is in Settings → AI accounts. */
export const ACCOUNT_STOP_CODES = new Set(["runtime_missing", "runtime_not_ready", "mode_not_allowed"]);

const EMPTY_EXCHANGE_ENTRIES: ExchangeEntry[] = [];

function getEntriesSignature(entries: ExchangeEntry[]) {
  return entries.map((entry) => `${entry.id ?? ""}:${entry.role}:${entry.status ?? ""}:${entry.content}`).join("\n");
}

type ReplyEvent = { type: string; [key: string]: unknown };

async function readReplyStream(resp: Response, onEvent: (payload: ReplyEvent) => void) {
  if (!resp.body) return;
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        onEvent(JSON.parse(line.slice(6)) as ReplyEvent);
      } catch {
        // malformed SSE line — skip
      }
    }
  }
}

function displayOf(text: string): Pick<ExchangeEntry, "content" | "entry_type" | "document_title"> {
  // While streaming, show a <document> envelope's body as it arrives.
  const tagMatch = text.match(/<document(?:\s+title="([^"]*)")?[^>]*>/);
  if (tagMatch && tagMatch.index !== undefined) {
    return {
      content: text.slice(tagMatch.index + tagMatch[0].length).replace(/<\/document>\s*$/, ""),
      entry_type: "document",
      document_title: tagMatch[1] ?? "",
    };
  }
  return { content: text, entry_type: "message" };
}

export function useAtriumExchange(session: Dialogue | null) {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<ExchangeEntry[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [activityText, setActivityText] = useState<string | null>(null);
  const [contextStatus, setContextStatus] = useState<AtriumContextStatus | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const followingRef = useRef<string | null>(null);

  // Load persisted history whenever the active Dialogue changes
  const { entries: history } = useDialogueEntries(session?.id ?? null);
  const historySignature = useMemo(() => getEntriesSignature(history), [history]);

  useEffect(() => {
    setEntries(history.length > 0 ? history : EMPTY_EXCHANGE_ENTRIES);
    setError(null);
    setErrorCode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, historySignature]);

  const streamReply = useCallback(
    async (resp: Response, sessionId: string) => {
      let text = "";
      let entryId: string | undefined;
      let speaker: DialogueProvider | "" = "";
      await readReplyStream(resp, (payload) => {
        if (payload.type === "turn") {
          entryId = payload.entry_id as string;
          speaker = (payload.speaker as DialogueProvider) ?? "";
          setEntries((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            const placeholder: ExchangeEntry = { id: entryId, role: "assistant", content: "", entry_type: "message", speaker, status: "streaming" };
            if (last && last.role === "assistant" && (last.id === entryId || last.id === undefined)) {
              next[next.length - 1] = { ...last, ...placeholder, content: last.content };
            } else {
              next.push(placeholder);
            }
            text = next[next.length - 1].content;
            return next;
          });
        } else if (payload.type === "delta") {
          text += payload.text as string;
          setActivityText(null);
          const shown = displayOf(text);
          setEntries((prev) => {
            const next = [...prev];
            next[next.length - 1] = { ...next[next.length - 1], ...shown, status: "streaming" };
            return next;
          });
        } else if (payload.type === "final") {
          setEntries((prev) => {
            const next = [...prev];
            next[next.length - 1] = {
              ...next[next.length - 1],
              id: (payload.entry_id as string) ?? entryId,
              content: payload.content as string,
              entry_type: payload.entry_type as AtriumEntryType,
              document_title: payload.document_title as string,
              status: "done",
            };
            return next;
          });
        } else if (payload.type === "activity") {
          setActivityText(payload.text as string);
        } else if (payload.type === "context_status") {
          setContextStatus({ used: payload.used as number, total: payload.total as number, pct: payload.pct as number });
        } else if (payload.type === "fallback") {
          setUsedFallback(true);
        } else if (payload.type === "error") {
          const code = (payload.code as string) ?? "failed";
          setError((payload.detail as string) ?? "An error occurred.");
          setErrorCode(code);
          setEntries((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === "assistant") {
              next[next.length - 1] = { ...last, content: (payload.partial as string) ?? last.content, status: "failed", error_code: code };
            }
            return next;
          });
        }
      });
      // The reply is already saved when the stream ends: refresh without a delay.
      queryClient.invalidateQueries({ queryKey: [...atriumQueryKeys.all, "sessions"] });
      queryClient.invalidateQueries({ queryKey: atriumQueryKeys.entries(sessionId) });
    },
    [queryClient]
  );

  const openStream = useCallback(async (url: string, init: RequestInit) => {
    const token = getAccessToken();
    abortRef.current = new AbortController();
    const resp = await fetch(buildApiUrl(url), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      signal: abortRef.current.signal,
    });
    if (!resp.ok || !resp.body) {
      throw new Error(`Exchange failed (${resp.status})`);
    }
    return resp;
  }, []);

  /** Send a message; `provider` picks the agent for this turn (default: the Dialogue's last). */
  const send = useCallback(
    async (message: string, provider?: DialogueProvider) => {
      if (!session || streaming) return;

      setError(null);
      setErrorCode(null);
      setActivityText(null);
      setStreaming(true);

      setEntries((prev) => [
        ...prev,
        { role: "user", content: message, status: "done" },
        { role: "assistant", content: "", entry_type: "message", speaker: provider ?? session.ai_provider, status: "pending" },
      ]);

      try {
        const resp = await openStream(`/api/atrium/dialogues/${session.id}/exchange`, {
          method: "POST",
          body: JSON.stringify(provider ? { message, provider } : { message }),
        });
        await streamReply(resp, session.id);
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
    [session, streaming, openStream, streamReply]
  );

  // After a reload, or from another device: follow a reply that is still being written.
  useEffect(() => {
    if (!session || streaming) return;
    const last = history[history.length - 1];
    if (!last || last.role !== "assistant" || !last.id) return;
    if (last.status !== "pending" && last.status !== "streaming") return;
    if (followingRef.current === last.id) return;
    followingRef.current = last.id;
    setStreaming(true);
    (async () => {
      try {
        const resp = await openStream(`/api/atrium/dialogues/${session.id}/entries/${last.id}/stream`, { method: "GET" });
        await streamReply(resp, session.id);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") setError(err.message);
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    })();
  }, [session, streaming, history, openStream, streamReply]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setEntries([]);
    setError(null);
    setErrorCode(null);
    setActivityText(null);
    setUsedFallback(false);
  }, []);

  // Appends a synthetic, non-persisted entry (e.g. a Grist verb result).
  // Lives only until the next persisted-history refetch.
  const appendLocalEntry = useCallback((entry: ExchangeEntry) => {
    setEntries((prev) => [...prev, entry]);
  }, []);

  return {
    entries, streaming, error, errorCode, activityText, contextStatus, usedFallback,
    send, cancel, reset, appendLocalEntry,
  };
}

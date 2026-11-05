// atrium/atriumApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { unwrapListResponse } from "@mixtape/api/lib/utils";
import type { AtriumDialMode, Dialogue, DialogueEntry, Distillate, DistillateDocumentType } from "@mixtape/core/types/atriumTypes";

export async function fetchDialogues(groupSlug?: string): Promise<Dialogue[]> {
  const params: Record<string, string> = {};
  if (groupSlug) {
    params.group_slug = groupSlug;
  } else {
    params.personal = "true";
  }
  const response = await axiosInstance.get("/api/atrium/dialogues/", { params });
  return unwrapListResponse<Dialogue>(response.data);
}

export async function fetchDialogueEntries(sessionId: string): Promise<DialogueEntry[]> {
  const response = await axiosInstance.get(`/api/atrium/dialogues/${sessionId}/entries/`);
  return unwrapListResponse<DialogueEntry>(response.data);
}

export async function createDialogue(data: {
  title?: string;
  session_context?: string;
  group_slug?: string;
  initiative_id?: string;
}): Promise<Dialogue> {
  const response = await axiosInstance.post<Dialogue>("/api/atrium/dialogues/new", data);
  return response.data;
}

/** Open an Initiative in Atrium: its most recent Dialogue, or a new one if it has none. */
export async function openInitiative(initiativeId: string): Promise<Dialogue> {
  const response = await axiosInstance.post<Dialogue>(`/api/atrium/initiatives/${initiativeId}/open`);
  return response.data;
}

/** Where personal Atrium opens: the most recently active Dialogue, else Initiative Zero's. */
export async function fetchAtriumStart(): Promise<Dialogue> {
  const response = await axiosInstance.get<Dialogue>("/api/atrium/me/start");
  return response.data;
}

export interface InitiativeLogEntryRecord {
  id: string;
  kind: string;
  body: string;
  authored_by: string;
  source_turn_index: number | null;
  source_timestamp: string | null;
  created_at: string;
  ledger_event_type: string | null;
  ledger_data: Record<string, unknown> | null;
}

export async function fetchAtriumInitiativeLog(
  sessionId: string
): Promise<InitiativeLogEntryRecord[]> {
  const response = await axiosInstance.get<{ results: InitiativeLogEntryRecord[] }>(
    `/api/atrium/dialogues/${sessionId}/initiative-log/`
  );
  return response.data.results;
}

export async function fetchDialogueContext(
  sessionId: string
): Promise<{ context: string; sources: string[] }> {
  const response = await axiosInstance.get<{ context: string; sources: string[] }>(
    `/api/atrium/dialogues/${sessionId}/context/`
  );
  return response.data;
}

export async function updateDialogue(
  sessionId: string,
  data: { title?: string; session_context?: string; dial_mode?: AtriumDialMode }
): Promise<Dialogue> {
  const response = await axiosInstance.patch<Dialogue>(`/api/atrium/dialogues/${sessionId}/`, data);
  return response.data;
}

export interface WarmResult {
  type: "ready" | "reconstructed";
  provenance?: string;
}

export async function warmDialogue(
  sessionId: string,
  token: string | null
): Promise<WarmResult> {
  const { buildApiUrl } = await import("@mixtape/api/lib/axiosInstance");
  const resp = await fetch(buildApiUrl(`/api/atrium/dialogues/${sessionId}/warm`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  });
  if (!resp.ok || !resp.body) return { type: "ready" };

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const raw = decoder.decode(value, { stream: true });
    for (const line of raw.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      try {
        const payload = JSON.parse(line.slice(6));
        if (payload.type === "reconstructed") {
          return { type: "reconstructed", provenance: payload.provenance as string | undefined };
        }
        if (payload.type === "ready") {
          return { type: "ready" };
        }
      } catch {
        // skip malformed line
      }
    }
  }
  return { type: "ready" };
}

/**
 * Compact: the server adds a checkpoint entry (the Dialogue so far, summarized on the
 * owner's own account); later replies start from it. Follow it like a reply.
 */
export async function compactDialogue(sessionId: string): Promise<{ status: string; entry_id: string }> {
  const response = await axiosInstance.post<{ status: string; entry_id: string }>(
    `/api/atrium/dialogues/${sessionId}/compact`
  );
  return response.data;
}

/** Edit a finished checkpoint; the next reply starts from the edited text. */
export async function updateCheckpoint(sessionId: string, entryId: string, content: string): Promise<void> {
  await axiosInstance.patch(`/api/atrium/dialogues/${sessionId}/compact`, { entry_id: entryId, content });
}

const DISTILL_POLL_MS = 2000;
const DISTILL_LIMIT_MS = 5 * 60 * 1000;

/**
 * Distill a Dialogue. The server writes the Distillate on the runtime worker, on the
 * owner's own account (ST-3 Part B), so this starts it and waits for it to finish.
 * Throws with the server's reason when it can't run (e.g. the account needs signing in).
 */
export async function distillDialogue(
  sessionId: string,
  data: { title: string; document_type: DistillateDocumentType }
): Promise<Distillate> {
  const started = await axiosInstance
    .post<Distillate>(`/api/atrium/dialogues/${sessionId}/distill`, data)
    .catch((err: { response?: { data?: Distillate } }) => {
      const detail = err.response?.data?.detail;
      throw new Error(detail || "Distillate generation failed.");
    });
  let distillate = started.data;
  const deadline = Date.now() + DISTILL_LIMIT_MS;
  while (distillate.status === "pending" && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, DISTILL_POLL_MS));
    const response = await axiosInstance.get<Distillate>(
      `/api/atrium/dialogues/${sessionId}/distillates/${distillate.id}`
    );
    distillate = response.data;
  }
  if (distillate.status === "failed") throw new Error(distillate.detail || "Distillate generation failed.");
  if (distillate.status === "pending") throw new Error("Still writing — check back in a moment.");
  return distillate;
}

export async function resetDialogue(sessionId: string): Promise<{ status: string }> {
  const response = await axiosInstance.post<{ status: string }>(
    `/api/atrium/dialogues/${sessionId}/reset`
  );
  return response.data;
}

export interface AtriumSponsorInitiative {
  id: string;
  title: string;
  status: string;
}

export interface AtriumSponsorDraft {
  id: string;
  title: string;
  created_at: string;
}

export interface AtriumSponsorContext {
  sponsor_type: "user" | "group";
  sponsor_slug: string;
  sponsor_name: string;
  sponsor_id: string;
  initiatives: AtriumSponsorInitiative[];
  recent_drafts: AtriumSponsorDraft[];
}

export async function fetchAtriumSponsorContext(groupSlug?: string): Promise<AtriumSponsorContext> {
  const params: Record<string, string> = {};
  if (groupSlug) params.group_slug = groupSlug;
  const response = await axiosInstance.get<AtriumSponsorContext>("/api/atrium/sponsor-context/", {
    params,
  });
  return response.data;
}

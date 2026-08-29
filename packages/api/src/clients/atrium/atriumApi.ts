// atrium/atriumApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { unwrapListResponse } from "@mixtape/api/lib/utils";
import type { AtriumDialMode, AtriumSession, AtriumSessionEntry, Distillate, DistillateDocumentType } from "@mixtape/core/types/atriumTypes";

export async function fetchAtriumSessions(groupSlug?: string): Promise<AtriumSession[]> {
  const params: Record<string, string> = {};
  if (groupSlug) {
    params.group_slug = groupSlug;
  } else {
    params.personal = "true";
  }
  const response = await axiosInstance.get("/api/atrium/sessions/", { params });
  return unwrapListResponse<AtriumSession>(response.data);
}

export async function fetchAtriumSessionEntries(sessionId: string): Promise<AtriumSessionEntry[]> {
  const response = await axiosInstance.get(`/api/atrium/sessions/${sessionId}/entries/`);
  return unwrapListResponse<AtriumSessionEntry>(response.data);
}

export async function createAtriumSession(data: {
  title?: string;
  session_context?: string;
  group_slug?: string;
  initiative_id?: string;
}): Promise<AtriumSession> {
  const response = await axiosInstance.post<AtriumSession>("/api/atrium/sessions/new", data);
  return response.data;
}

export interface ApertureLogEntryRecord {
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
): Promise<ApertureLogEntryRecord[]> {
  const response = await axiosInstance.get<{ results: ApertureLogEntryRecord[] }>(
    `/api/atrium/sessions/${sessionId}/initiative-log/`
  );
  return response.data.results;
}

export async function fetchAtriumSessionContext(
  sessionId: string
): Promise<{ context: string; sources: string[] }> {
  const response = await axiosInstance.get<{ context: string; sources: string[] }>(
    `/api/atrium/sessions/${sessionId}/context/`
  );
  return response.data;
}

export async function updateAtriumSession(
  sessionId: string,
  data: { title?: string; session_context?: string; dial_mode?: AtriumDialMode }
): Promise<AtriumSession> {
  const response = await axiosInstance.patch<AtriumSession>(`/api/atrium/sessions/${sessionId}/`, data);
  return response.data;
}

export interface WarmResult {
  type: "ready" | "reconstructed";
  provenance?: string;
}

export async function warmAtriumSession(
  sessionId: string,
  token: string | null
): Promise<WarmResult> {
  const { buildApiUrl } = await import("@mixtape/api/lib/axiosInstance");
  const resp = await fetch(buildApiUrl(`/api/atrium/sessions/${sessionId}/warm`), {
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

export async function compactAtriumSession(sessionId: string): Promise<{ summary: string | null }> {
  const response = await axiosInstance.post<{ summary: string | null }>(
    `/api/atrium/sessions/${sessionId}/compact`
  );
  return response.data;
}

export async function distillAtriumSession(
  sessionId: string,
  data: { title: string; document_type: DistillateDocumentType }
): Promise<Distillate> {
  const response = await axiosInstance.post<Distillate>(
    `/api/atrium/sessions/${sessionId}/distill`,
    data
  );
  return response.data;
}

export async function resetAtriumSession(sessionId: string): Promise<{ status: string }> {
  const response = await axiosInstance.post<{ status: string }>(
    `/api/atrium/sessions/${sessionId}/reset`
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

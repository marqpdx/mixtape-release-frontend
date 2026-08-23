// atrium/atriumApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { unwrapListResponse } from "@mixtape/api/lib/utils";
import type { AtriumDialMode, AtriumSession, AtriumSessionEntry, Distillate, DistillateDocumentType } from "@mixtape/core/types/atriumTypes";

export async function fetchAtriumSessions(): Promise<AtriumSession[]> {
  const response = await axiosInstance.get("/api/atrium/sessions/");
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
}): Promise<AtriumSession> {
  const response = await axiosInstance.post<AtriumSession>("/api/atrium/sessions/new", data);
  return response.data;
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

// atrium/atriumApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { unwrapListResponse } from "@mixtape/api/lib/utils";
import type { AtriumDialMode, AtriumSession, AtriumSessionEntry } from "@mixtape/core/types/atriumTypes";

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

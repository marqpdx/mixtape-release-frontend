// atrium/atriumApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import type { AtriumSession } from "@mixtape/core/types/atriumTypes";

export async function fetchAtriumSessions(): Promise<AtriumSession[]> {
  const response = await axiosInstance.get<AtriumSession[]>("/api/atrium/sessions/");
  return response.data;
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
  data: { title?: string; session_context?: string }
): Promise<AtriumSession> {
  const response = await axiosInstance.patch<AtriumSession>(`/api/atrium/sessions/${sessionId}/`, data);
  return response.data;
}

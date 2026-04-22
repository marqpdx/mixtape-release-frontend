import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export interface Dart {
  id: string;
  artifact_id: string;
  anchor_type: "selection" | "document";
  selected_text: string | null;
  start: number;
  end: number;
  anchor_resolved: "text_match" | "offset_fallback" | "document_fallback" | "document";
  note_text: string;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDartPayload {
  artifact_id: string;
  anchor_type: "selection" | "document";
  selected_text?: string;
  anchor_start_offset?: number;
  anchor_end_offset?: number;
  note_text?: string;
}

export interface UpdateDartPayload {
  note_text?: string;
  is_flagged?: boolean;
}

export async function fetchDarts(artifactId: string): Promise<Dart[]> {
  const res = await axiosInstance.get<Dart[]>("/api/reading/darts/", {
    params: { artifact_id: artifactId },
  });
  return res.data;
}

export async function createDart(payload: CreateDartPayload): Promise<Dart> {
  const res = await axiosInstance.post<Dart>("/api/reading/darts/", payload);
  return res.data;
}

export async function updateDart(id: string, payload: UpdateDartPayload): Promise<Dart> {
  const res = await axiosInstance.patch<Dart>(`/api/reading/darts/${id}/`, payload);
  return res.data;
}

export async function deleteDart(id: string): Promise<void> {
  await axiosInstance.delete(`/api/reading/darts/${id}/`);
}

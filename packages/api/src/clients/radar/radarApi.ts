// packages/api/src/clients/radar/radarApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// ============================================================================
// Types
// ============================================================================

export type RadarInitiativeStatus = "active" | "paused" | "archived";
export type ArtifactType = "doc_link" | "conversation_import";
export type ConversationSource = "claude" | "chatgpt" | "other";

export interface RadarInitiative {
  id: string;
  title: string;
  direction: string;
  status: RadarInitiativeStatus;
  is_personal: boolean;
  narrative: string;
  position: number;
  last_session_note: string;
  member_last_active_at: string | null;
  created_at: string;
  updated_at: string;
  last_session_at: string | null;
}

export interface RadarInitiativeArtifact {
  id: string;
  initiative: string;
  artifact_type: ArtifactType;
  label: string;
  doc_path: string;
  conversation_source: string;
  conversation_text: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface RadarCreatePayload {
  title: string;
  direction?: string;
}

export interface RadarUpdatePayload {
  title?: string;
  direction?: string;
  narrative?: string;
  last_session_note?: string;
  status?: RadarInitiativeStatus;
}

export interface RadarDocLinkPayload {
  label: string;
  doc_path: string;
}

export interface RadarArtifactUpdatePayload {
  label: string;
}

// ============================================================================
// Initiatives
// ============================================================================

export async function fetchRadarInitiatives(statusFilter?: "archived"): Promise<RadarInitiative[]> {
  const params = statusFilter ? `?status=${statusFilter}` : "";
  const res = await axiosInstance.get(`/api/initiatives/radar${params}`);
  return res.data;
}

export async function createRadarInitiative(payload: RadarCreatePayload): Promise<RadarInitiative> {
  const res = await axiosInstance.post("/api/initiatives/radar", payload);
  return res.data;
}

export async function fetchRadarInitiative(initiativeId: string): Promise<RadarInitiative> {
  const res = await axiosInstance.get(`/api/initiatives/radar/${initiativeId}`);
  return res.data;
}

export async function updateRadarInitiative(
  initiativeId: string,
  payload: RadarUpdatePayload,
): Promise<RadarInitiative> {
  const res = await axiosInstance.patch(`/api/initiatives/radar/${initiativeId}`, payload);
  return res.data;
}

export async function archiveRadarInitiative(initiativeId: string): Promise<RadarInitiative> {
  const res = await axiosInstance.post(`/api/initiatives/radar/${initiativeId}/archive`);
  return res.data;
}

export async function restoreRadarInitiative(initiativeId: string): Promise<RadarInitiative> {
  const res = await axiosInstance.post(`/api/initiatives/radar/${initiativeId}/restore`);
  return res.data;
}

export async function reorderRadarInitiatives(orderedIds: string[]): Promise<void> {
  await axiosInstance.post("/api/initiatives/radar/reorder", { ordered_ids: orderedIds });
}

// ============================================================================
// Artifacts
// ============================================================================

export async function fetchRadarArtifacts(initiativeId: string): Promise<RadarInitiativeArtifact[]> {
  const res = await axiosInstance.get(`/api/initiatives/radar/${initiativeId}/artifacts`);
  return res.data;
}

export async function createRadarDocLink(
  initiativeId: string,
  payload: RadarDocLinkPayload,
): Promise<RadarInitiativeArtifact> {
  const res = await axiosInstance.post(`/api/initiatives/radar/${initiativeId}/artifacts`, {
    artifact_type: "doc_link",
    ...payload,
  });
  return res.data;
}

export async function importRadarConversation(
  initiativeId: string,
  file: File,
): Promise<RadarInitiativeArtifact> {
  const form = new FormData();
  form.append("file", file);
  const res = await axiosInstance.post(
    `/api/initiatives/radar/${initiativeId}/artifacts/import`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function reorderRadarArtifacts(
  initiativeId: string,
  orderedIds: string[],
): Promise<void> {
  await axiosInstance.post(
    `/api/initiatives/radar/${initiativeId}/artifacts/reorder`,
    { ordered_ids: orderedIds },
  );
}

export async function updateRadarArtifact(
  initiativeId: string,
  artifactId: string,
  payload: RadarArtifactUpdatePayload,
): Promise<RadarInitiativeArtifact> {
  const res = await axiosInstance.patch(
    `/api/initiatives/radar/${initiativeId}/artifacts/${artifactId}`,
    payload,
  );
  return res.data;
}

export async function deleteRadarArtifact(
  initiativeId: string,
  artifactId: string,
): Promise<void> {
  await axiosInstance.delete(
    `/api/initiatives/radar/${initiativeId}/artifacts/${artifactId}`,
  );
}

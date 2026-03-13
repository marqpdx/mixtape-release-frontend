// clients/worksessions/workSessionApi.ts
//
// API client for Work Session endpoints.
// All functions are pure async — no React dependency.

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// ── Types ──

export interface WorkSession {
  id: string;
  owner: number;
  anchor_content_type: number;
  anchor_object_id: string;
  surface_document: WritingSurfaceDocument | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  items: WorkSessionItem[];
}

export interface WorkSessionItem {
  id: string;
  content_type: number;
  object_id: string;
  sequence: number;
  artifact_type?: string;
  artifact_title?: string;
  created_at: string;
}

export interface WritingSurfaceDocument {
  id: string;
  body_json: Record<string, unknown>;
  last_saved_at: string;
  auto_save_count: number;
  client_session_id: string;
}

export interface WorkSessionCreatePayload {
  anchor_content_type_model: string;
  anchor_object_id: string;
}

export interface WorkSessionItemCreatePayload {
  content_type_model: string;
  object_id: string;
}

export interface SurfaceDocumentSavePayload {
  body_json: Record<string, unknown>;
  client_session_id?: string;
}

export interface CheckpointResult {
  extracted_count: number;
  extracted: Array<{
    artifact_type: string;
    artifact_id: string;
  }>;
}

// ── Work Session CRUD ──

export async function createWorkSession(
  payload: WorkSessionCreatePayload
): Promise<WorkSession> {
  const res = await axiosInstance.post("/api/work-sessions/", payload);
  return res.data;
}

export async function fetchWorkSessions(): Promise<WorkSession[]> {
  const res = await axiosInstance.get("/api/work-sessions/");
  return res.data;
}

export async function fetchWorkSession(id: string): Promise<WorkSession> {
  const res = await axiosInstance.get(`/api/work-sessions/${id}/`);
  return res.data;
}

export async function endWorkSession(id: string): Promise<WorkSession> {
  const res = await axiosInstance.patch(`/api/work-sessions/${id}/`, {
    end: true,
  });
  return res.data;
}

export async function deleteWorkSession(id: string): Promise<void> {
  await axiosInstance.delete(`/api/work-sessions/${id}/`);
}

// ── Session Items ──

export async function fetchSessionItems(
  sessionId: string
): Promise<WorkSessionItem[]> {
  const res = await axiosInstance.get(
    `/api/work-sessions/${sessionId}/items/`
  );
  return res.data;
}

export async function addSessionItem(
  sessionId: string,
  payload: WorkSessionItemCreatePayload
): Promise<WorkSessionItem> {
  const res = await axiosInstance.post(
    `/api/work-sessions/${sessionId}/items/`,
    payload
  );
  return res.data;
}

export async function removeSessionItem(
  sessionId: string,
  itemId: string
): Promise<void> {
  await axiosInstance.delete(
    `/api/work-sessions/${sessionId}/items/${itemId}/`
  );
}

// ── Surface Document ──

export async function fetchSurfaceDocument(
  sessionId: string
): Promise<WritingSurfaceDocument> {
  const res = await axiosInstance.get(
    `/api/work-sessions/${sessionId}/surface/`
  );
  return res.data;
}

export async function saveSurfaceDocument(
  sessionId: string,
  payload: SurfaceDocumentSavePayload
): Promise<WritingSurfaceDocument> {
  const res = await axiosInstance.put(
    `/api/work-sessions/${sessionId}/surface/`,
    payload
  );
  return res.data;
}

// ── Checkpoint ──

export async function triggerCheckpoint(
  sessionId: string
): Promise<CheckpointResult> {
  const res = await axiosInstance.post(
    `/api/work-sessions/${sessionId}/checkpoint/`
  );
  return res.data;
}

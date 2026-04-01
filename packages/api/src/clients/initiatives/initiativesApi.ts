// packages/api/src/clients/initiatives/initiativesApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// ============================================================================
// Types
// ============================================================================

export interface RollingSummary {
  current_direction: string;
  key_decisions: string[];
  open_questions: string[];
  where_we_are_now: string;
}

export interface SessionDistillation {
  decisions?: string;
  open_questions?: string;
  actions?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface ThreadSummary {
  label: string;
  current_direction: string;
  key_findings: string[];
  open_questions: string[];
  last_updated: string;
}

export interface InitiativeResponse {
  id: string;
  title: string;
  direction: string;
  status: 'active' | 'simmering' | 'paused' | 'resolved' | 'archived';
  status_note: string;
  rolling_summary: RollingSummary | null;
  rolling_summary_updated_at: string | null;
  rolling_summary_updated_by: string | null;
  thread_summaries: Record<string, ThreadSummary>;
  seeded_from: string | null;
  parent: string | null;
  thread_label: string;
  created_by: string | null;
  created_by_username: string | null;
  thread_count: number;
  momentum_score: number;
  last_session_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface InitiativeCreatePayload {
  title: string;
  direction?: string;
  status?: InitiativeResponse['status'];
  status_note?: string;
}

export interface RawTranscriptTurn {
  speaker: 'human' | 'assistant';
  username: string | null;
  text: string;
  timestamp: string;
}

export interface SessionResponse {
  id: string;
  initiative: string;
  intent: 'open_inquiry' | 'focused_review' | 'decision_session' | 'retrospective' | 'other';
  capture_mode: 'typed' | 'voice' | 'imported' | 'pasted';
  distillation: SessionDistillation | null;
  distillation_state: 'none' | 'proposed' | 'curated';
  raw_transcript: RawTranscriptTurn[];
  started_at: string | null;
  ended_at: string | null;
  created_by: string | null;
  created_by_username: string | null;
  artifact_count: number;
  created_at: string;
}

export interface SessionCreatePayload {
  intent?: SessionResponse['intent'];
  capture_mode?: SessionResponse['capture_mode'];
}

export interface ArtifactResponse {
  id: string;
  initiative: string;
  session: string | null;
  kind: 'document' | 'decision' | 'action' | 'question' | 'annotation';
  title: string;
  body: string;
  note: string;
  is_direct_annotation: boolean;
  quality_scan_state: 'pending' | 'running' | 'complete' | 'failed';
  quality_scan_result: Record<string, any> | null;
  puddlejump_routed: boolean;
  puddlejump_routed_at: string | null;
  created_at: string;
}

export interface ArtifactCreatePayload {
  kind: ArtifactResponse['kind'];
  title: string;
  body: string;
  note?: string;
  session?: string | null;
}

export interface LinkedOutputResponse {
  id: string;
  initiative: string;
  output_type: string;
  output_id: string;
  note: string;
  created_at: string;
}

// Import types
export type ArtifactKind = ArtifactResponse['kind'];
export type SourceFormat = 'claude' | 'chatgpt' | 'freeform';

export interface ImportArtifactSpec {
  kind: ArtifactKind;
  title: string;
  body: string;
  source_turn_idx?: number | null;
}

export interface ImportPreviewResponse {
  source_format: SourceFormat;
  conversation_title: string;
  turns: RawTranscriptTurn[];
  detected_artifacts: ImportArtifactSpec[];
  stats: {
    turn_count: number;
    human_turns?: number;
    assistant_turns?: number;
    word_count: number;
    conversation_count?: number;
  };
}

export interface ImportConfirmPayload {
  turns: RawTranscriptTurn[];
  artifacts: ImportArtifactSpec[];
  title?: string;
  session_intent?: SessionResponse['intent'];
}

export interface ImportConfirmResponse {
  session: SessionResponse;
  artifacts_created: number;
  rolling_summary_queued: boolean;
}

// ============================================================================
// Initiatives
// ============================================================================

export async function fetchGroupInitiatives(groupSlug: string): Promise<InitiativeResponse[]> {
  const res = await axiosInstance.get(`/api/groups/${groupSlug}/initiatives/`);
  return res.data;
}

export async function fetchInitiative(groupSlug: string, initiativeId: string): Promise<InitiativeResponse> {
  const res = await axiosInstance.get(`/api/groups/${groupSlug}/initiatives/${initiativeId}`);
  return res.data;
}

export async function createInitiative(groupSlug: string, payload: InitiativeCreatePayload): Promise<InitiativeResponse> {
  const res = await axiosInstance.post(`/api/groups/${groupSlug}/initiatives/`, payload);
  return res.data;
}

export async function updateInitiative(
  groupSlug: string,
  initiativeId: string,
  payload: Partial<InitiativeCreatePayload>
): Promise<InitiativeResponse> {
  const res = await axiosInstance.patch(`/api/groups/${groupSlug}/initiatives/${initiativeId}`, payload);
  return res.data;
}

export async function deleteInitiative(groupSlug: string, initiativeId: string): Promise<void> {
  await axiosInstance.delete(`/api/groups/${groupSlug}/initiatives/${initiativeId}`);
}

export async function updateRollingSummary(
  groupSlug: string,
  initiativeId: string,
  payload: Partial<RollingSummary>
): Promise<InitiativeResponse> {
  const res = await axiosInstance.patch(`/api/groups/${groupSlug}/initiatives/${initiativeId}/rolling-summary`, payload);
  return res.data;
}

// ============================================================================
// Sessions
// ============================================================================

export async function fetchSessions(groupSlug: string, initiativeId: string): Promise<SessionResponse[]> {
  const res = await axiosInstance.get(`/api/groups/${groupSlug}/initiatives/${initiativeId}/sessions`);
  return res.data;
}

export async function createSession(
  groupSlug: string,
  initiativeId: string,
  payload: SessionCreatePayload
): Promise<SessionResponse> {
  const res = await axiosInstance.post(`/api/groups/${groupSlug}/initiatives/${initiativeId}/sessions`, payload);
  return res.data;
}

export async function closeSession(groupSlug: string, initiativeId: string, sessionId: string): Promise<SessionResponse> {
  const res = await axiosInstance.patch(`/api/groups/${groupSlug}/initiatives/${initiativeId}/sessions/${sessionId}`, {
    end: true,
  });
  return res.data;
}

export async function proposeDistillation(
  groupSlug: string,
  initiativeId: string,
  sessionId: string
): Promise<SessionResponse> {
  const res = await axiosInstance.post(
    `/api/groups/${groupSlug}/initiatives/${initiativeId}/sessions/${sessionId}/propose-distillation`
  );
  return res.data;
}

export async function commitDistillation(
  groupSlug: string,
  initiativeId: string,
  sessionId: string,
  payload: { decisions?: string; open_questions?: string; actions?: string; notes?: string }
): Promise<SessionResponse> {
  const res = await axiosInstance.post(
    `/api/groups/${groupSlug}/initiatives/${initiativeId}/sessions/${sessionId}/commit-distillation`,
    payload
  );
  return res.data;
}

// ============================================================================
// Artifacts
// ============================================================================

export async function fetchArtifacts(groupSlug: string, initiativeId: string): Promise<ArtifactResponse[]> {
  const res = await axiosInstance.get(`/api/groups/${groupSlug}/initiatives/${initiativeId}/artifacts`);
  return res.data;
}

export async function createArtifact(
  groupSlug: string,
  initiativeId: string,
  payload: ArtifactCreatePayload
): Promise<ArtifactResponse> {
  const res = await axiosInstance.post(`/api/groups/${groupSlug}/initiatives/${initiativeId}/artifacts`, payload);
  return res.data;
}

export async function updateArtifact(
  groupSlug: string,
  initiativeId: string,
  artifactId: string,
  payload: Partial<ArtifactCreatePayload>
): Promise<ArtifactResponse> {
  const res = await axiosInstance.patch(
    `/api/groups/${groupSlug}/initiatives/${initiativeId}/artifacts/${artifactId}`,
    payload
  );
  return res.data;
}

export async function routeArtifactToPuddlejump(
  groupSlug: string,
  initiativeId: string,
  artifactId: string
): Promise<{ artifact: ArtifactResponse; document: string; message: string }> {
  const res = await axiosInstance.post(
    `/api/groups/${groupSlug}/initiatives/${initiativeId}/artifacts/${artifactId}/route-to-puddlejump`
  );
  return res.data;
}

// ============================================================================
// Session Import
// ============================================================================

export async function previewInitiativeImport(
  groupSlug: string,
  initiativeId: string,
  file: File,
  format?: SourceFormat,
): Promise<ImportPreviewResponse> {
  const form = new FormData();
  form.append("file", file);
  const params = format ? `?format=${format}` : "";
  const res = await axiosInstance.post(
    `/api/groups/${groupSlug}/initiatives/${initiativeId}/import-session/preview${params}`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function confirmInitiativeImport(
  groupSlug: string,
  initiativeId: string,
  payload: ImportConfirmPayload,
): Promise<ImportConfirmResponse> {
  const res = await axiosInstance.post(
    `/api/groups/${groupSlug}/initiatives/${initiativeId}/import-session/confirm`,
    payload,
  );
  return res.data;
}

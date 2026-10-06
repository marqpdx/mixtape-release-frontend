// packages/api/src/clients/folio/folioApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// ============================================================================
// Types
// ============================================================================

export type CandidateType = "subject" | "intention" | "material";
export type CandidateStatus = "proposed" | "confirmed" | "rejected" | "amended";

export interface Folio {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface FolioMaterialCandidate {
  id: string;
  candidate_type: CandidateType;
  ordinal: number | null;
  source_span_start: number;
  source_span_end: number;
  source_text: string;
  display_text: string;
  confidence: number | null;
  reason_code: string;
  status: CandidateStatus;
  parent_candidate: string | null;
  created_at: string;
}

export interface FolioInception {
  id: string;
  folio: Folio;
  raw_text: string;
  pipeline_version: string;
  model_id: string;
  material_candidates: FolioMaterialCandidate[];
  created_at: string;
}

export interface FolioInceptionCreatePayload {
  raw_text: string;
  title?: string;
}

// Gate 1 — deterministic surface parse (prototype spec §8). Candidate span
// map, not final structure.
export interface FolioGate1Output {
  enumerations: { label: string; start: number; end: number }[];
  count_cues: { value: number; text: string; start: number; end: number }[];
  quoted_spans: { text: string; start: number; end: number }[];
  about_subject: { source_text: string; start: number; end: number } | null;
}

// Gate 2 — subject/intention extraction (prototype spec §8-9). Local-model
// call via Inkwell; spans are grounded deterministically server-side.
export interface FolioGate2Span {
  source_text: string;
  start: number;
  end: number;
}

export interface FolioGate2Output {
  subject: FolioGate2Span | null;
  intention: FolioGate2Span | null;
  method: string | null;
}

// Gate 3 — materiality classification (prototype spec §8-9). Decides
// material/not-material per Gate 1 candidate span; spans are Gate 1's own,
// never re-derived from the model's output.
export interface FolioGate3Item {
  source_start: number;
  source_end: number;
  material: boolean;
  reason_code: string;
}

export interface FolioGate3Output {
  items: FolioGate3Item[];
  method: string | null;
}

export interface FolioAnalyzeDebug {
  gate_1: {
    output: FolioGate1Output;
    latency_ms: number;
  };
  gate_2: {
    output: FolioGate2Output | null;
    error: string | null;
    latency_ms: number;
  };
  gate_3: {
    output: FolioGate3Output | null;
    error: string | null;
    latency_ms: number;
  };
  gate_4_5: {
    candidates_persisted: number | null;
    skipped: boolean;
    errors: string[];
    warnings: string[];
    latency_ms: number;
  };
}

export interface FolioAnalyzeResult {
  inception_id: string;
  status: string;
  debug?: FolioAnalyzeDebug;
}

// ============================================================================
// Inceptions
// ============================================================================

export async function createFolioInception(payload: FolioInceptionCreatePayload): Promise<FolioInception> {
  const res = await axiosInstance.post("/api/folio/inceptions", payload);
  return res.data;
}

export async function fetchFolioInception(inceptionId: string): Promise<FolioInception> {
  const res = await axiosInstance.get(`/api/folio/inceptions/${inceptionId}`);
  return res.data;
}

export async function analyzeFolioInception(inceptionId: string, debug: boolean): Promise<FolioAnalyzeResult> {
  const params = debug ? "?debug=1" : "";
  const res = await axiosInstance.post(`/api/folio/inceptions/${inceptionId}/analyze${params}`);
  return res.data;
}

// ============================================================================
// Human curation (prototype spec §6) — edits never mutate the raw inception.
// ============================================================================

export async function updateFolioTitle(folioId: string, title: string): Promise<Folio> {
  const res = await axiosInstance.patch(`/api/folio/folios/${folioId}`, { title });
  return res.data;
}

export async function updateFolioCandidateDisplayText(
  candidateId: string,
  displayText: string,
): Promise<FolioMaterialCandidate> {
  const res = await axiosInstance.patch(`/api/folio/material-candidates/${candidateId}`, {
    display_text: displayText,
  });
  return res.data;
}

export async function confirmFolioCandidate(candidateId: string): Promise<FolioMaterialCandidate> {
  const res = await axiosInstance.post(`/api/folio/material-candidates/${candidateId}/confirm`);
  return res.data;
}

export async function rejectFolioCandidate(candidateId: string): Promise<FolioMaterialCandidate> {
  const res = await axiosInstance.post(`/api/folio/material-candidates/${candidateId}/reject`);
  return res.data;
}

// ============================================================================
// Folio Notes PoC (puddlejump/decisions/folio/folio-notes-poc-mobile-handoff.md)
// ============================================================================

// Plain strings server-side (folio/shapes.py) — kept as a string union here
// so a later Shapes-Library-backed vocabulary is additive, not a rename.
export type FolioNoteShape = "character" | "scene" | "plot" | "setting" | "world" | "meta" | "unplaced";

export interface FolioNote {
  id: string;
  folio: string;
  source_type: "voice" | "text";
  status: "processing" | "ready" | "failed";
  /** Resolved projection: raw_text for typed notes, transcript_text for voice. */
  text: string;
  raw_text: string;
  transcript_text: string;
  transcript_error: string;
  has_audio: boolean;
  /** Resolved projection: confirmed_shape, else suggested_shape, else "unplaced". */
  shape: FolioNoteShape;
  suggested_shape: FolioNoteShape | "";
  shape_confidence: number | null;
  confirmed_shape: FolioNoteShape | "";
  /** Tending output (Switchboard → Inkwell folio_note_tend) — augments, never replaces, the note. */
  summary: string;
  mentions: {
    surface: string;
    kind: "character" | "setting" | "place" | "thing" | "concept";
    confidence?: number;
    existing_entity_id?: string | null;
    confirmed_entity_id?: string;
    confirmed_kind?: string;
  }[];
  tended_at: string | null;
  tending_model: string;
  tending_prompt_version: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export async function fetchFolios(): Promise<Folio[]> {
  const res = await axiosInstance.get("/api/folio/folios");
  return res.data;
}

export async function createFolio(title: string): Promise<Folio> {
  const res = await axiosInstance.post("/api/folio/folios", { title });
  return res.data;
}

export async function fetchFolioNotes(folioId: string, limit = 50): Promise<FolioNote[]> {
  const res = await axiosInstance.get(`/api/folio/folios/${folioId}/notes`, { params: { limit } });
  return res.data;
}

export async function createFolioTextNote(
  folioId: string,
  data: { raw_text: string; source?: string },
): Promise<FolioNote> {
  const res = await axiosInstance.post(`/api/folio/folios/${folioId}/notes`, data);
  return res.data;
}

export async function createFolioVoiceNote(
  folioId: string,
  data: { uri: string; fileName?: string; mimeType?: string; source?: string },
): Promise<FolioNote> {
  const form = new FormData();
  form.append("audio_file", {
    uri: data.uri,
    name: data.fileName || "folio-note.m4a",
    type: data.mimeType || "audio/m4a",
  } as any);
  form.append("source", data.source || "mobile");

  const res = await axiosInstance.post(`/api/folio/folios/${folioId}/notes`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/** One-tap Shape correction — sets the writer's confirmed_shape ("" clears it). */
export async function updateFolioNoteShape(
  folioId: string,
  noteId: string,
  confirmedShape: FolioNoteShape | "",
): Promise<FolioNote> {
  const res = await axiosInstance.patch(`/api/folio/folios/${folioId}/notes/${noteId}`, {
    confirmed_shape: confirmedShape,
  });
  return res.data;
}

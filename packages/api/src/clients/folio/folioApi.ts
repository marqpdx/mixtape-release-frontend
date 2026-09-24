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

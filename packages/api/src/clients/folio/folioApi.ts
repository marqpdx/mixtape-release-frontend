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

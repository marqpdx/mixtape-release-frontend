// SH-11 Contour findings, approved 2026-10-19; separate from SH-7a's packet contract.
import { axiosInstance } from '../../lib/axiosInstance';

export interface ShuttleSource { source_ref: string; source_revision: number; text: string }
export interface ShuttleSourceSpan {
  source_ref: string; source_revision: number; start: number; end: number; quote: string;
}
interface SightingBase {
  sighting_id: string; shape_version: string; strategy_id: string; strategy_version: string;
  confidence: 'high' | 'medium' | 'low'; source_locator: ShuttleSourceSpan[];
  uncertain: Array<{ field: string; reason: string; source_locator?: ShuttleSourceSpan[] }>;
}
export type ShuttleSighting = SightingBase & (
  | { shape_id: 'shuttle.weave'; reading: string; thing_ids: string[]; place_ids: string[];
      idea_ids: string[]; adjacency_ids: string[]; story_ids: string[] }
  | { shape_id: 'shuttle.thing'; name_as_said: string; proposed_name: string | null; place_ids: string[] }
  | { shape_id: 'shuttle.place'; name_as_said: string; proposed_name: string | null;
      role: 'named_place' | 'locale' | 'unresolved'; address_as_said?: string }
  | { shape_id: 'shuttle.idea'; wording: string; basis: 'stated' | 'inferred'; supporting_sighting_ids: string[] }
  | { shape_id: 'shuttle.adjacency'; ends: string[]; reason: string;
      intent_basis: 'expressed' | 'inferred_from_intent'; intent_evidence: ShuttleSourceSpan[] }
  | { shape_id: 'shuttle.story'; subject_ids: string[]; text: string; passage: ShuttleSourceSpan;
      knowledge_basis: 'firsthand' | 'heard' | 'remembered' | 'unknown'; completion: 'complete' | 'unfinished' | 'unclear' }
);
export interface ShuttleFindings {
  revision: number; source_digest: string; execution_action_run_id: string;
  sightings: ShuttleSighting[];
  questions: Array<{ question_id: string; text: string; sighting_ids: string[]; reason: string }>;
  resolution: Record<string, { status: 'unresolved' | 'candidates'; candidates: Array<{
    kind: string; id: string; name: string; score?: number; method: string;
  }> }>;
  provenance: { provider: string; model: string | null; prompt_version: string;
    contract_version: string; units: Record<string, string>; elapsed_ms: number | null;
    usage: Record<string, unknown> | null };
}
export interface ShuttleInterpretation {
  contract_version: string; weave_action_run_id: string; execution_action_run_id: string | null;
  revision: number; source_digest: string; sources: ShuttleSource[];
  status: 'awaiting_cloud_approval' | 'pending' | 'running' | 'succeeded' | 'failed';
  error: string | null; findings: ShuttleFindings | null; cloud_requested: boolean;
}
export async function startShuttleInterpretation(data: { request_id: string; seed_id: string; client: 'phone' | 'desktop' }) {
  return (await axiosInstance.post<ShuttleInterpretation>('/api/shuttle/weaves/', data)).data;
}
export async function fetchShuttleInterpretation(id: string) {
  return (await axiosInstance.get<ShuttleInterpretation>(`/api/shuttle/weaves/${id}/`)).data;
}
export async function executeShuttleInterpretation(current: ShuttleInterpretation, requestId: string, cloudConsent: boolean) {
  return (await axiosInstance.post<ShuttleInterpretation>(`/api/shuttle/weaves/${current.weave_action_run_id}/interpret/`, {
    request_id: requestId, expected_revision: current.revision,
    source_digest: current.source_digest, cloud_consent: cloudConsent,
  })).data;
}
export async function correctShuttleInterpretation(current: ShuttleInterpretation, data: {
  request_id: string; correction_text?: string; correction_seed_id?: string;
}) {
  return (await axiosInstance.post<ShuttleInterpretation>(`/api/shuttle/weaves/${current.weave_action_run_id}/correct/`, {
    ...data, expected_revision: current.revision,
  })).data;
}

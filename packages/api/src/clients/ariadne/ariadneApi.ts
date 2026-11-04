import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// P6 curation workbench + P6a Concept lookup (decisions/ariadne/,
// superuser-only). §9 4E (model interpretation) and 4F (assertion
// curation) aren't built yet -- this client only covers 4A-4D plus the
// "accept promotes to a Concept" step.

export type RunDisposition = "pending" | "accept" | "decline" | "defer" | "drop";

export interface AriadneRun {
  id: string;
  status: string;
  lens_name: string;
  lens_version: number;
  corpus_snapshot_captured_at: string;
  target_concept_count: number | null;
  started_at: string | null;
  completed_at: string | null;
  candidate_count: number;
}

export interface AriadneRunCandidate {
  id: string;
  concept_or_phrase_key: string;
  rank: number;
  score: number;
  score_components: Record<string, number>;
  summary: string;
  disposition: RunDisposition;
  disposition_reason: string;
  disposition_at: string | null;
  concept_id: string | null;
  concept_label: string;
}

export interface AriadneEvidencePacket {
  id: string;
  run_id: string;
  candidate_key: string;
  subject_kind: "concept";
  packet_version: number;
  summary: string;
  status: string;
  created_at: string;
}

export interface AriadnePacketPassage {
  passage_id: string;
  document_title: string;
  document_uri: string;
  source_key: string;
  heading_path: string;
  revision_captured_at: string;
  quote_offsets: { start: number; end: number } | null;
  excerpt: string;
}

export interface AriadneEvidencePacketDetail extends AriadneEvidencePacket {
  passages: AriadnePacketPassage[];
}

export interface AriadneConceptAlias {
  alias: string;
  alias_type: string;
  language: string;
}

export interface AriadneConceptEvidence {
  assertion_id: string;
  predicate: string;
  object_concept_label: string | null;
  claim_text: string;
  status: string;
}

export interface AriadneConcept {
  id: string;
  preferred_label: string;
  description: string;
  status: string;
  aliases: AriadneConceptAlias[];
  evidence: AriadneConceptEvidence[];
}

export async function fetchLatestRun(): Promise<AriadneRun> {
  const response = await axiosInstance.get<AriadneRun>("/api/ariadne/runs/latest/");
  return response.data;
}

export async function fetchRun(runId: string): Promise<AriadneRun> {
  const response = await axiosInstance.get<AriadneRun>(`/api/ariadne/runs/${runId}/`);
  return response.data;
}

export async function fetchRunCandidates(runId: string): Promise<AriadneRunCandidate[]> {
  const response = await axiosInstance.get<AriadneRunCandidate[]>(`/api/ariadne/runs/${runId}/candidates/`);
  return response.data;
}

export async function recordDecision(
  runId: string,
  data: { candidate_key: string; action: RunDisposition; reason?: string }
): Promise<AriadneRunCandidate> {
  const response = await axiosInstance.post<AriadneRunCandidate>(`/api/ariadne/runs/${runId}/decisions/`, data);
  return response.data;
}

export async function fetchRunPackets(runId: string): Promise<AriadneEvidencePacket[]> {
  const response = await axiosInstance.get<AriadneEvidencePacket[]>(`/api/ariadne/runs/${runId}/packets/`);
  return response.data;
}

export async function assemblePacket(runId: string, candidateKey: string): Promise<AriadneEvidencePacket> {
  const response = await axiosInstance.post<AriadneEvidencePacket>(`/api/ariadne/runs/${runId}/packets/`, {
    candidate_key: candidateKey,
  });
  return response.data;
}

export async function fetchPacketDetail(packetId: string): Promise<AriadneEvidencePacketDetail> {
  const response = await axiosInstance.get<AriadneEvidencePacketDetail>(`/api/ariadne/packets/${packetId}/`);
  return response.data;
}

export async function fetchConceptById(conceptId: string): Promise<AriadneConcept> {
  const response = await axiosInstance.get<AriadneConcept>(`/api/ariadne/concepts/${conceptId}/`);
  return response.data;
}

export async function fetchConceptByName(name: string): Promise<AriadneConcept> {
  const response = await axiosInstance.get<AriadneConcept>("/api/ariadne/concepts/", { params: { name } });
  return response.data;
}

// P8 (build spec §19.1): hybrid search -- lexical + vector + concept
// expansion -- and saved searches as Named Lenses.

export interface AriadneSearchResult {
  passage_id: string;
  document_title: string;
  document_uri: string;
  source_key: string;
  excerpt: string;
  found_by: ("lexical" | "vector")[];
  vector_score: number | null;
  concept_expansion_terms?: string[];
}

export interface AriadneSavedSearch {
  id: string;
  name: string;
  query: string;
  version: number;
}

export async function searchCorpus(query: string): Promise<AriadneSearchResult[]> {
  const response = await axiosInstance.get<{ query: string; results: AriadneSearchResult[] }>(
    "/api/ariadne/search/",
    { params: { q: query } }
  );
  return response.data.results;
}

export async function fetchSavedSearches(): Promise<AriadneSavedSearch[]> {
  const response = await axiosInstance.get<AriadneSavedSearch[]>("/api/ariadne/lenses/");
  return response.data;
}

export async function saveSearch(name: string, query: string): Promise<AriadneSavedSearch> {
  const response = await axiosInstance.post<AriadneSavedSearch>("/api/ariadne/lenses/", { name, query });
  return response.data;
}

export async function runSavedSearch(lensId: string): Promise<AriadneSearchResult[]> {
  const response = await axiosInstance.get<{ query: string; results: AriadneSearchResult[] }>(
    `/api/ariadne/lenses/${lensId}/run/`
  );
  return response.data.results;
}

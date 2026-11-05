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
  run_id: string | null;
  inquiry_run_id?: string | null;
  candidate_key: string;
  subject_kind: "concept" | "inquiry_theme";
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

// P9/P9a (build spec §19.2-19.3): Inquiry Runs and the Review artifact.
// Frame and Draft are the two steps that can call a model (Inkwell) --
// every call that does so takes use_model explicitly; there is no silent
// fallback to a model call. §19.3 (time-ordered development) and the
// real Accession mechanism are NOT built -- see inquiry.py's module note
// in mixtape-release-core. standing_review_id is a scoped substitute.

export type InquiryStatus = "framing" | "gathering" | "mapping" | "drafting" | "curating" | "done";

export interface AriadneSubQuestion {
  text: string;
  approved: boolean;
  search_terms: string[];
}

export interface AriadneInquiry {
  id: string;
  question: string;
  sub_questions: AriadneSubQuestion[];
  status: InquiryStatus;
  standing_review_id: string | null;
  created_at: string;
}

export interface AriadneInquiryRun {
  id: string;
  inquiry_id: string;
  status: "pending" | "running" | "completed" | "failed";
  gathered_passage_ids: string[];
  model_versions: Record<string, string>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AriadneInquiryTheme {
  id: string;
  run_id: string;
  label: string;
  label_source: "deterministic" | "model";
  passage_ids: string[];
  passage_count: number;
  rank: number;
}

export type InquiryCitationStatus = "proposed" | "accepted" | "struck" | "amended";

export interface AriadneCitation {
  id: string;
  text: string;
  passage_ids: string[];
  interpretation: boolean;
  status: InquiryCitationStatus;
  amended_text: string | null;
  rejected_passage_ids?: string[];
}

export interface AriadneDraftCall {
  theme_id: string;
  consent_id: string;
  account: string;
  prompt_digest: string;
  failure: string | null;
  elapsed_ms: number | null;
  usage: Record<string, unknown> | null;
  refinement_note: string | null;
}

export interface AriadneInquiryReview {
  id: string;
  inquiry_id: string;
  run_id: string;
  version: number;
  body_markdown: string;
  citations: AriadneCitation[];
  uncited_claim_count: number;
  status: "draft" | "curated";
  // Heddle CR-01: one entry per per-theme call that ran cloud_approved=true;
  // empty when Draft ran local (use_model only).
  draft_calls: AriadneDraftCall[];
  created_at: string;
}

export async function fetchInquiries(): Promise<AriadneInquiry[]> {
  const response = await axiosInstance.get<AriadneInquiry[]>("/api/ariadne/inquiries/");
  return response.data;
}

export async function createInquiry(question: string): Promise<AriadneInquiry> {
  const response = await axiosInstance.post<AriadneInquiry>("/api/ariadne/inquiries/", { question });
  return response.data;
}

export async function fetchInquiry(inquiryId: string): Promise<AriadneInquiry> {
  const response = await axiosInstance.get<AriadneInquiry>(`/api/ariadne/inquiries/${inquiryId}/`);
  return response.data;
}

export async function frameInquiry(
  inquiryId: string,
  data: { sub_questions?: AriadneSubQuestion[]; use_model?: boolean }
): Promise<AriadneInquiry> {
  const response = await axiosInstance.post<AriadneInquiry>(`/api/ariadne/inquiries/${inquiryId}/frame/`, data);
  return response.data;
}

export async function approveSubQuestions(inquiryId: string, approvedTexts: string[]): Promise<AriadneInquiry> {
  const response = await axiosInstance.post<AriadneInquiry>(
    `/api/ariadne/inquiries/${inquiryId}/approve-sub-questions/`,
    { approved_texts: approvedTexts }
  );
  return response.data;
}

export async function gatherInquiry(inquiryId: string): Promise<AriadneInquiryRun> {
  const response = await axiosInstance.post<AriadneInquiryRun>(`/api/ariadne/inquiries/${inquiryId}/gather/`, {});
  return response.data;
}

export async function mapInquiryRun(runId: string): Promise<AriadneInquiryTheme[]> {
  const response = await axiosInstance.post<AriadneInquiryTheme[]>(`/api/ariadne/inquiry-runs/${runId}/map/`, {});
  return response.data;
}

export async function fetchInquiryThemes(runId: string): Promise<AriadneInquiryTheme[]> {
  const response = await axiosInstance.get<AriadneInquiryTheme[]>(`/api/ariadne/inquiry-runs/${runId}/map/`);
  return response.data;
}

export async function labelTheme(themeId: string, useModel: boolean): Promise<AriadneInquiryTheme> {
  const response = await axiosInstance.post<AriadneInquiryTheme>(`/api/ariadne/inquiry-themes/${themeId}/label/`, {
    use_model: useModel,
  });
  return response.data;
}

export async function assembleThemePacket(themeId: string): Promise<AriadneEvidencePacket> {
  const response = await axiosInstance.post<AriadneEvidencePacket>(
    `/api/ariadne/inquiry-themes/${themeId}/packet/`,
    {}
  );
  return response.data;
}

export async function draftReview(
  runId: string,
  useModel: boolean,
  cloudApproved: boolean = false
): Promise<AriadneInquiryReview> {
  const response = await axiosInstance.post<AriadneInquiryReview>(`/api/ariadne/inquiry-runs/${runId}/draft/`, {
    use_model: useModel,
    cloud_approved: cloudApproved,
  });
  return response.data;
}

export async function fetchReview(reviewId: string): Promise<AriadneInquiryReview> {
  const response = await axiosInstance.get<AriadneInquiryReview>(`/api/ariadne/inquiry-reviews/${reviewId}/`);
  return response.data;
}

export async function curateCitation(
  reviewId: string,
  data: { citation_id: string; action: "accept" | "amend" | "strike"; amended_text?: string | null }
): Promise<AriadneInquiryReview> {
  const response = await axiosInstance.post<AriadneInquiryReview>(
    `/api/ariadne/inquiry-reviews/${reviewId}/curate/`,
    data
  );
  return response.data;
}

export async function accessionReview(reviewId: string): Promise<AriadneInquiry> {
  const response = await axiosInstance.post<AriadneInquiry>(`/api/ariadne/inquiry-reviews/${reviewId}/accession/`);
  return response.data;
}

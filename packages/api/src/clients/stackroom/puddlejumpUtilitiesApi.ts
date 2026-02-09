// packages/api/src/clients/stackroom/puddlejumpUtilitiesApi.ts

// Puddlejump Utilities API client
// Handles library health, duplicate detection, glossary extraction,
// and canonical candidate suggestion operations

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// --- Library Health ---

export interface CoverageMetric {
  total_items?: number;
  total_artifacts?: number;
  canonical_items?: number;
  with_summary?: number;
  with_keywords?: number;
  percentage: number;
}

export interface MissingSummary {
  filename: string;
  source_file_id: string;
  artifact_id: string;
}

export interface OverdueReview {
  filename: string;
  library_item_id: string;
  review_date: string;
  days_overdue: number;
}

export interface IngestionStatus {
  total_source_files: number;
  fully_embedded: number;
  pending_embedding: number;
  failed_embedding: number;
  percentage_complete: number;
}

export interface LibraryHealthResponse {
  library_id: string;
  file_count: number;
  total_size_bytes: number;
  folder_depth: number;
  canon_coverage: CoverageMetric;
  summary_coverage: CoverageMetric;
  keyword_coverage: CoverageMetric;
  missing_summaries: MissingSummary[];
  overdue_reviews: OverdueReview[];
  ingestion_status: IngestionStatus;
}

// --- Duplicate Detection ---

export interface DuplicatePair {
  source_file_a_id: string;
  filename_a: string;
  source_file_b_id: string;
  filename_b: string;
  similarity_score: number;
  excerpt_a: string;
  excerpt_b: string;
}

export interface DuplicateDetectionResponse {
  library_id: string;
  similarity_threshold: number;
  pair_count: number;
  pairs: DuplicatePair[];
}

// --- Glossary Extraction ---

export interface GlossaryTermSource {
  filename: string;
  source_file_id: string;
  artifact_id: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  source_files: GlossaryTermSource[];
  occurrences: number;
}

export interface GlossaryResponse {
  library_id: string;
  min_occurrences: number;
  term_count: number;
  terms: GlossaryTerm[];
}

// --- Canonical Candidates ---

export interface CanonicalCandidate {
  source_file_id: string;
  filename: string;
  score: number;
  reasons: string[];
  is_canonical: boolean;
  library_item_id: string;
}

export interface CanonicalCandidatesResponse {
  library_id: string;
  top_n: number;
  exclude_already_canonical: boolean;
  candidate_count: number;
  candidates: CanonicalCandidate[];
}

// --- Suggest Summaries (Phase 6) ---

export interface SuggestedSummary {
  artifact_id: string;
  source_file_id: string;
  filename: string;
  suggested_summary: string;
  method: string;
  error: string | null;
}

export interface SuggestSummariesResponse {
  library_id: string;
  total_missing: number;
  suggestions_generated: number;
  suggestions: SuggestedSummary[];
}

// --- Restructure / Consolidate (Phase 7) ---

export interface ClusterDocument {
  source_file_id: string;
  filename: string;
  excerpt: string;
}

export interface DocumentCluster {
  cluster_id: number;
  documents: ClusterDocument[];
  document_count: number;
  similarity_avg: number;
  outline: string;
  outline_method: string;
}

export interface RestructureResponse {
  library_id: string;
  similarity_threshold: number;
  cluster_count: number;
  clusters: DocumentCluster[];
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get health metrics for a Puddlejump library.
 * Returns dashboard-ready stats: file count, coverage, alerts, ingestion status.
 */
export async function getLibraryHealth(
  libraryId: string
): Promise<LibraryHealthResponse> {
  const response = await axiosInstance.get<LibraryHealthResponse>(
    `/api/stackroom/puddlejump/utilities/libraries/${libraryId}/health`
  );
  return response.data;
}

/**
 * Detect near-duplicate documents using embedding similarity.
 */
export async function checkDuplicates(
  libraryId: string,
  similarityThreshold: number = 0.85
): Promise<DuplicateDetectionResponse> {
  const response = await axiosInstance.post<DuplicateDetectionResponse>(
    '/api/stackroom/puddlejump/utilities/check-duplicates',
    {
      library_id: libraryId,
      similarity_threshold: similarityThreshold,
    }
  );
  return response.data;
}

/**
 * Extract defined terms from a library using pattern matching.
 */
export async function extractGlossary(
  libraryId: string,
  minOccurrences: number = 1
): Promise<GlossaryResponse> {
  const response = await axiosInstance.post<GlossaryResponse>(
    '/api/stackroom/puddlejump/utilities/extract-glossary',
    {
      library_id: libraryId,
      min_occurrences: minOccurrences,
    }
  );
  return response.data;
}

/**
 * Suggest files that should be marked canonical based on heuristic scoring.
 */
export async function suggestCanonical(
  libraryId: string,
  topN: number = 10,
  excludeAlreadyCanonical: boolean = false
): Promise<CanonicalCandidatesResponse> {
  const response = await axiosInstance.post<CanonicalCandidatesResponse>(
    '/api/stackroom/puddlejump/utilities/suggest-canonical',
    {
      library_id: libraryId,
      top_n: topN,
      exclude_already_canonical: excludeAlreadyCanonical,
    }
  );
  return response.data;
}

/**
 * Suggest summaries for artifacts missing them, using Inkwell LLM.
 * Returns proposals for user review — does NOT write back.
 */
export async function suggestSummaries(
  libraryId: string
): Promise<SuggestSummariesResponse> {
  const response = await axiosInstance.post<SuggestSummariesResponse>(
    '/api/stackroom/puddlejump/utilities/suggest-summaries',
    { library_id: libraryId }
  );
  return response.data;
}

/**
 * Cluster related documents and suggest consolidation outlines via Inkwell.
 * Returns clusters for user review — does NOT merge.
 */
export async function restructureDocuments(
  libraryId: string,
  similarityThreshold: number = 0.6
): Promise<RestructureResponse> {
  const response = await axiosInstance.post<RestructureResponse>(
    '/api/stackroom/puddlejump/utilities/restructure',
    {
      library_id: libraryId,
      similarity_threshold: similarityThreshold,
    }
  );
  return response.data;
}

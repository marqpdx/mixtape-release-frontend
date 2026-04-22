// packages/api/src/lib/writing/writingApi.ts
/**
 * Writing API functions
 * Pure API calls for writing operations (working copies, publishing, placement)
 */

import {
  PublishAndPlacePayload,
  FlattenedPlacement,
  WorkingDocument,
  DocxPreviewResult,
  DocxImportPayload,
  DocxImportResult,
  DocumentImportPreviewResult,
  DocumentImportConfirmPayload,
  DocumentImportConfirmResult,
} from "@mixtape/core/types/writingTypes";
import type { WritingPiece } from "@mixtape/core/types/writingTypes";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { unwrapListResponse } from "../../lib/utils";


export async function upsertWorkingCopy(pieceId: string, data: any) {
  const res = await axiosInstance.put(`/api/writing/pieces/${pieceId}/working-copy`, data);
  return res.data;
}
export async function applyWorkingCopy(pieceId: string) {
  const res = await axiosInstance.post(`/api/writing/pieces/${pieceId}/apply-working-copy`);
  return res.data;
}
export async function publishAndPlace(pieceId: string, payload: PublishAndPlacePayload) {
  const res = await axiosInstance.post(`/api/writing/pieces/${pieceId}/publish-and-place`, payload);
  return res.data;
}

/**
 * Publish a piece to specified destinations
 * Used by SimplePublishDialog for standard publish flow
 */
export async function publishPiece(pieceId: string, payload: {
  title?: string;
  body_json?: any;
  excerpt?: string;
  audience?: 'just_me' | 'readers';
  addressed_to?: 'public' | 'crossroads' | 'self';
  scheduled_for?: string | null;
  destinations: {
    groups?: string[];
    members?: string[];
    shelves?: string[];
  };
  group_overrides?: Record<string, {
    visibility?: string;
    is_excerpt?: boolean;
    follow_updates?: boolean;
    overrides?: Record<string, unknown>;
    order?: number;
    is_pinned?: boolean;
  }>;
  placement_options?: {
    visibility?: 'public' | 'members' | 'unlisted' | 'private';
    is_excerpt?: boolean;
    follow_updates?: boolean;
    overrides?: Record<string, unknown>;
  };
}) {
  const res = await axiosInstance.post(`/api/writing/pieces/${pieceId}/publish`, payload);
  return res.data;
}

/**
 * Fetch the AI-generated synopsis for a piece
 */
export async function fetchPieceSynopsis(pieceId: string): Promise<{ synopsis: string | null }> {
  const res = await axiosInstance.get(`/api/writing/pieces/${pieceId}/synopsis`);
  return res.data;
}

export interface LinkedInCopyExtended {
  hook: string;
  short_synopsis: string;
  one_line_takeaway: string;
  alt_hook: string;
}

export interface WritingSynopsisData {
  id: string;
  piece: string;
  teaser: string;
  description: string;
  linkedin_copy: string;
  linkedin_copy_generated_by: string;
  linkedin_copy_extended: LinkedInCopyExtended | null;
  [key: string]: unknown;
}

/**
 * Generate AI LinkedIn copy for a piece via Inkwell. Stores result on synopsis.
 */
export async function generateLinkedInCopy(pieceId: string): Promise<WritingSynopsisData> {
  const res = await axiosInstance.post(`/api/writing/pieces/${pieceId}/synopsis/linkedin-copy`);
  return res.data;
}

/**
 * Unpublish a piece (return to draft)
 */
export async function unpublishPiece(pieceId: string) {
  const res = await axiosInstance.post(`/api/writing/pieces/${pieceId}/unpublish`);
  return res.data;
}

/**
 * Fetch placements for a sponsor (group or member)
 */
export async function fetchPlacements(
  sponsorType: 'group' | 'member',
  sponsorSlug: string
): Promise<FlattenedPlacement[]> {
  const response = await axiosInstance.get('/api/writing/placements', {
    params: {
      sponsor_type: sponsorType,
      sponsor_slug: sponsorSlug,
    },
  });
  return unwrapListResponse<FlattenedPlacement>(response.data);
}

/**
 * Fetch drafts (working copies) for a sponsor
 */
export async function fetchDrafts(
  sponsorType: 'group' | 'member',
  sponsorSlug: string,
  filter?: 'all' | 'solo' | 'collab'
): Promise<WorkingDocument[]> {
  // Backend expects: my | shared | all
  const backendFilter =
    filter === 'solo' ? 'my' :
    filter === 'collab' ? 'shared' :
    'all';

  const response = await axiosInstance.get('/api/writing/drafts', {
    params: {
      sponsor_type: sponsorType,
      sponsor_slug: sponsorSlug,
      filter: backendFilter,
    },
  });
  return unwrapListResponse<WorkingDocument>(response.data);
}

/**
 * Fetch published pieces for the current author
 */
export async function fetchPublishedPieces(): Promise<WritingPiece[]> {
  const response = await axiosInstance.get('/api/writing/pieces', {
    params: {
      status: 'published',
    },
  });
  return unwrapListResponse<WritingPiece>(response.data);
}

/**
 * PATCH a piece — use for series_order / series reassignment
 */
export async function updatePiece(pieceId: string, data: {
  series_order?: number | null
  series?: string | null // series UUID or null to unset
}) {
  const res = await axiosInstance.patch(`/api/writing/pieces/${pieceId}`, data)
  return res.data
}

/**
 * Fetch a single published piece by slug (returns WritingPieceDetail with nested series)
 */
export async function fetchPiece(pieceSlug: string) {
  const response = await axiosInstance.get(`/api/writing/pieces/view/${pieceSlug}`);
  return response.data;
}

/**
 * Fetch all published pieces for a group, ordered by series + series_order.
 * Returns WritingPieceCatalogItem[] (no body_json).
 */
export async function fetchGroupWritingCatalog(groupSlug: string) {
  const response = await axiosInstance.get(`/api/writing/catalog`, {
    params: { group: groupSlug },
  });
  return response.data as import('@mixtape/core/types/writingTypes').WritingPieceCatalogItem[];
}

/**
 * Create a WritingSeries for a group
 */
export async function createWritingSeries(payload: {
  title: string
  slug: string
  phase_num: number | null
  subtitle?: string
  group: string // group UUID
}): Promise<import('@mixtape/core/types/writingTypes').WritingSeries> {
  const res = await axiosInstance.post('/api/writing/series', payload)
  return res.data
}

/**
 * Fetch all WritingSeries for a group (for catalog section headers).
 */
export async function fetchWritingSeries(groupSlug: string) {
  const response = await axiosInstance.get(`/api/writing/series`, {
    params: { group: groupSlug },
  });
  return response.data as import('@mixtape/core/types/writingTypes').WritingSeries[];
}

/**
 * Delete a draft by ID
 */
export async function deleteDraft(draftId: string): Promise<void> {
  await axiosInstance.delete(`/api/writing/drafts/${draftId}`);
}

/**
 * Preview a .docx file import (parse without creating records)
 */
export async function previewDocxImport(file: File): Promise<DocxPreviewResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axiosInstance.post("/api/writing/import/preview", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/**
 * Confirm a .docx import (create WritingPiece from previewed content)
 */
export async function confirmDocxImport(data: DocxImportPayload): Promise<DocxImportResult> {
  const res = await axiosInstance.post("/api/writing/import/confirm", data);
  return res.data;
}

export async function previewDocumentImportBatch(
  files: File[],
  data?: { sponsor_type?: string; sponsor_slug?: string; default_writing_kind?: string; default_addressed_to?: string }
): Promise<DocumentImportPreviewResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (data?.sponsor_type) formData.append("sponsor_type", data.sponsor_type);
  if (data?.sponsor_slug) formData.append("sponsor_slug", data.sponsor_slug);
  if (data?.default_writing_kind) formData.append("default_writing_kind", data.default_writing_kind);
  if (data?.default_addressed_to) formData.append("default_addressed_to", data.default_addressed_to);
  const res = await axiosInstance.post("/api/writing/import/preview-batch", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function confirmDocumentImportBatch(
  data: DocumentImportConfirmPayload
): Promise<DocumentImportConfirmResult> {
  const res = await axiosInstance.post("/api/writing/import/confirm-batch", data);
  return res.data;
}

export interface WritingAnalysisSessionData {
  id: string;
  source_piece_id: string;
  source_revision_hash: string;
  export_version: string;
  planner_type: string;
  planner_label: string;
  status: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  warnings: unknown[];
}

export interface WritingAnalysisExportBlock {
  block_id: string;
  kind: string;
  text: string;
  markdown: string;
  word_count: number;
  node_json: Record<string, unknown>;
  anchors: Record<string, unknown>;
  structure: Record<string, unknown>;
  metadata: Record<string, unknown>;
  provenance: Record<string, unknown>;
}

export interface WritingAnalysisExportData {
  version: string;
  piece: {
    id: string;
    title: string;
    excerpt: string;
    status: string;
    enable_outline: boolean;
  };
  source: {
    body_json_revision_hash: string;
    source_kind: string;
    working_document_id: string | null;
    exported_at: string | null;
    sponsor: {
      type: string | null;
      id: string | null;
      slug: string | null;
    };
  };
  outline: {
    mode: string;
    detected_headings: Array<{ block_id: string; text: string; level: number }>;
    persistent_nodes: Array<Record<string, unknown>>;
  };
  document: {
    block_order: string[];
    blocks: WritingAnalysisExportBlock[];
  };
  derived: {
    normalized_markdown: string;
    plain_text: string;
    stats: {
      block_count: number;
      word_count: number;
      heading_count: number;
    };
  };
}

export interface WritingAnalysisExportResponse {
  session: WritingAnalysisSessionData;
  export: WritingAnalysisExportData;
}

export interface WritingSuggestedRevisionData {
  id: string;
  source_piece_id: string;
  suggested_piece_id: string;
  analysis_session_id: string;
  source_revision_hash: string;
  derivation_type: string;
  created_at: string;
}

export interface WritingFidelityReportData {
  id: string;
  analysis_session_id: string;
  suggested_revision_id: string;
  source_piece_id: string;
  suggested_piece_id: string;
  source_revision_hash: string;
  report_version: string;
  report_payload: {
    summary?: {
      source_word_count?: number;
      suggested_word_count?: number;
      source_section_count?: number;
      suggested_section_count?: number;
      unchanged_block_count?: number;
      edited_block_count?: number;
      moved_block_count?: number;
      added_block_count?: number;
      removed_block_count?: number;
    };
    structural_changes?: unknown[];
    textual_changes?: unknown[];
    warnings?: Array<{ type?: string; message?: string }>;
  };
  created_at: string;
}

export interface WritingSuggestedRevisionCreateResponse {
  suggested_revision: WritingSuggestedRevisionData;
  fidelity_report: WritingFidelityReportData | null;
  piece: WritingPiece;
  detail?: string;
}

export interface PdfExportResult {
  blob: Blob;
  filename: string | null;
}

function parseContentDispositionFilename(contentDisposition?: string): string | null {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const basicMatch = contentDisposition.match(/filename=\"?([^\";]+)\"?/i);
  return basicMatch?.[1] ?? null;
}

export async function exportWritingAnalysis(
  pieceId: string,
  payload?: { planner_type?: string; planner_label?: string }
): Promise<WritingAnalysisExportResponse> {
  const res = await axiosInstance.post(`/api/writing/pieces/${pieceId}/analysis/export`, payload || {});
  return res.data;
}

export async function createSuggestedRevision(
  pieceId: string,
  sessionId: string,
  payload?: { title_suffix?: string }
): Promise<WritingSuggestedRevisionCreateResponse> {
  const res = await axiosInstance.post(
    `/api/writing/pieces/${pieceId}/analysis/sessions/${sessionId}/create-revision`,
    payload || {}
  );
  return res.data;
}

export async function exportPiecePdf(pieceId: string): Promise<PdfExportResult> {
  const res = await axiosInstance.get(`/api/writing/pieces/${pieceId}/export/pdf`, {
    responseType: "blob",
  });

  return {
    blob: res.data,
    filename: parseContentDispositionFilename(res.headers["content-disposition"]),
  };
}

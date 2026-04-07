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

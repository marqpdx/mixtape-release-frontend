// src/lib/writing/api.ts
/**
 * Writing API functions
 * Pure API calls for writing operations (working copies, publishing, placement)
 */

import { PublishAndPlacePayload, FlattenedPlacement, WritingWorkingCopy, DocxPreviewResult, DocxImportPayload, DocxImportResult } from "@mixtape/core/types/writingTypes";
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
  destinations: {
    groups?: string[];
    members?: string[];
    shelves?: string[];
  };
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
): Promise<WritingWorkingCopy[]> {
  const response = await axiosInstance.get('/api/writing/drafts', {
    params: {
      sponsor_type: sponsorType,
      sponsor_slug: sponsorSlug,
      filter,
    },
  });
  return unwrapListResponse<WritingWorkingCopy>(response.data);
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
 * Fetch a single published piece by slug
 */
export async function fetchPiece(pieceSlug: string) {
  const response = await axiosInstance.get(`/api/writing/pieces/view/${pieceSlug}`);
  return response.data;
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

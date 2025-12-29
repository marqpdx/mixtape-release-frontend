// src/lib/writing/api.ts
/**
 * Writing API functions
 * Pure API calls for writing operations (working copies, publishing, placement)
 */

import { PublishAndPlacePayload, FlattenedPlacement, WritingWorkingCopy } from "@mixtape/core/types/writingTypes";
import { axiosInstance } from "../../lib/axiosInstance";
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
  destinations: {
    groups?: string[];
    members?: string[];
  };
  placement_options?: {
    visibility?: 'public' | 'private';
    is_excerpt?: boolean;
    follow_updates?: boolean;
  };
}) {
  const res = await axiosInstance.post(`/api/writing/pieces/${pieceId}/publish`, payload);
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

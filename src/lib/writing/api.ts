// src/lib/writing/api.ts
/**
 * Writing API functions
 * Pure API calls for writing operations (working copies, publishing, placement)
 */

import { PublishAndPlacePayload } from "@/types/writingTypes";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";


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

// packages/api/src/clients/writing/focusApi.ts
// Focus-Centered Writing ADR (puddlejump decisions/focus-centered-writing-adr/),
// Phase 2 (FCW-6): Focus API client.

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export type FocusVerb = "publish";
export type FocusStatus = "active" | "resolved" | "abandoned";
export type FocusObjectType = "issue";

export interface FocusState {
  selected_piece_id?: string;
  open_tool?: string;
  [key: string]: unknown;
}

export interface Focus {
  id: string;
  verb: FocusVerb;
  object_type: FocusObjectType;
  object_id: string;
  status: FocusStatus;
  state: FocusState | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export async function listFocuses(): Promise<Focus[]> {
  const res = await axiosInstance.get("/api/writing/focuses");
  return res.data;
}

export async function createFocus(objectType: FocusObjectType, objectId: string, verb: FocusVerb = "publish"): Promise<Focus> {
  const res = await axiosInstance.post("/api/writing/focuses", {
    verb,
    object_type: objectType,
    object_id: objectId,
  });
  return res.data;
}

export async function getFocus(focusId: string): Promise<Focus> {
  const res = await axiosInstance.get(`/api/writing/focuses/${focusId}`);
  return res.data;
}

export async function updateFocusState(focusId: string, state: FocusState): Promise<Focus> {
  const res = await axiosInstance.patch(`/api/writing/focuses/${focusId}/state`, { state });
  return res.data;
}

export async function resolveFocus(focusId: string): Promise<Focus> {
  const res = await axiosInstance.post(`/api/writing/focuses/${focusId}/resolve`);
  return res.data;
}

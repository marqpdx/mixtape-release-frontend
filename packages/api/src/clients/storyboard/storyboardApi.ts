// packages/api/src/clients/storyboard/storyboardApi.ts
//
// Phase 5 of the Folio/Storyboard build plan (puddlejump
// decisions/folio/folio-storyboard-build-plan.md §54). Flat item list, same
// convention as Collection's CollectionItem — the client builds the tree
// from parent_id rather than the server nesting it.

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import type { FolioNote } from "../folio/folioApi";

// ============================================================================
// Types
// ============================================================================

export type StoryboardGrammarKey = "fiction_v1";

export interface Storyboard {
  id: string;
  kind: "writing";
  grammar: StoryboardGrammarKey;
  title: string;
  head: Record<string, unknown> | null;
  folio_ids: string[];
  locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoryboardItemReference {
  content_type: string;
  id: string;
  /** Present when content_type is "writingpiece" -- lets the client open the editor directly. */
  slug?: string;
}

export interface StoryboardItem {
  id: string;
  storyboard_id: string;
  parent_id: string | null;
  rank: number;
  level: string;
  title: string;
  head: Record<string, unknown> | null;
  reference: StoryboardItemReference | null;
  preview: string;
  created_at: string;
  updated_at: string;
}

export interface StoryboardDetail {
  storyboard: Storyboard;
  items: StoryboardItem[];
  surface_states: StoryboardSurfaceState[];
  participations: StoryboardParticipation[];
  links: StoryboardItemLink[];
}

export interface StoryboardEntity {
  id: string;
  kind: string;
  name: string;
  aliases: string[];
}

export interface StoryboardParticipation {
  id: number;
  item_id: string;
  entity_id: string;
  kind: string;
  name: string;
  entity_kind: string;
}

export interface StoryboardItemLink {
  id: number;
  item_id: string;
  kind: string;
  target_id: string;
}

export interface StoryboardSurfaceState {
  item_id: string;
  x: number | null;
  y: number | null;
  size: "small" | "normal" | "large";
  expanded: boolean;
}

export interface CreateStoryboardPayload {
  grammar: StoryboardGrammarKey;
  title?: string;
  folio_ids?: string[];
}

export interface CreateStoryboardItemPayload {
  level: string;
  parent_id?: string | null;
  title?: string;
}

export interface UpdateStoryboardItemPayload {
  title?: string;
  head?: Record<string, unknown> | null;
  /** Presence (even as null, meaning "move to root") triggers a reparent. */
  parent_id?: string | null;
  rank?: number;
}

// ============================================================================
// API functions
// ============================================================================

export async function fetchStoryboards(): Promise<Storyboard[]> {
  const res = await axiosInstance.get("/api/storyboard/storyboards");
  return res.data;
}

export async function createStoryboard(payload: CreateStoryboardPayload): Promise<Storyboard> {
  const res = await axiosInstance.post("/api/storyboard/storyboards", payload);
  return res.data;
}

export async function fetchStoryboardDetail(storyboardId: string): Promise<StoryboardDetail> {
  const res = await axiosInstance.get(`/api/storyboard/storyboards/${storyboardId}`);
  return res.data;
}

export async function updateStoryboardFolios(storyboardId: string, folioIds: string[]): Promise<Storyboard> {
  const res = await axiosInstance.patch(`/api/storyboard/storyboards/${storyboardId}`, { folio_ids: folioIds });
  return res.data;
}

export async function fetchStoryboardNotes(storyboardId: string): Promise<FolioNote[]> {
  const res = await axiosInstance.get(`/api/storyboard/storyboards/${storyboardId}/notes`);
  return res.data;
}

export async function fetchStoryboardEntities(storyboardId: string): Promise<StoryboardEntity[]> {
  const res = await axiosInstance.get(`/api/storyboard/storyboards/${storyboardId}/entities`);
  return res.data;
}

export async function addStoryboardParticipation(storyboardId: string, itemId: string, payload: {
  kind: string; entity_id?: string; name?: string; note_id?: string; mention_index?: number;
}): Promise<StoryboardParticipation> {
  const res = await axiosInstance.post(`/api/storyboard/storyboards/${storyboardId}/items/${itemId}/participations`, payload);
  return res.data;
}

export async function removeStoryboardParticipation(storyboardId: string, itemId: string, participationId: number): Promise<void> {
  await axiosInstance.delete(`/api/storyboard/storyboards/${storyboardId}/items/${itemId}/participations/${participationId}`);
}

export async function addStoryboardNoteLink(storyboardId: string, itemId: string, noteId: string): Promise<StoryboardItemLink> {
  const res = await axiosInstance.post(`/api/storyboard/storyboards/${storyboardId}/items/${itemId}/links`, { note_id: noteId });
  return res.data;
}

export async function removeStoryboardNoteLink(storyboardId: string, itemId: string, linkId: number): Promise<void> {
  await axiosInstance.delete(`/api/storyboard/storyboards/${storyboardId}/items/${itemId}/links/${linkId}`);
}

export async function createStoryboardItem(
  storyboardId: string,
  payload: CreateStoryboardItemPayload,
): Promise<StoryboardItem> {
  const res = await axiosInstance.post(`/api/storyboard/storyboards/${storyboardId}/items`, payload);
  return res.data;
}

export async function updateStoryboardItem(
  storyboardId: string,
  itemId: string,
  payload: UpdateStoryboardItemPayload,
): Promise<StoryboardItem> {
  const res = await axiosInstance.patch(
    `/api/storyboard/storyboards/${storyboardId}/items/${itemId}`,
    payload,
  );
  return res.data;
}

/** Deliberately reorder the story: set rank from a sibling-group's new order. */
export async function reorderStoryboardItems(
  storyboardId: string,
  payload: { parent_id?: string | null; ordered_item_ids: string[] },
): Promise<StoryboardItem[]> {
  const res = await axiosInstance.post(
    `/api/storyboard/storyboards/${storyboardId}/items/reorder`,
    payload,
  );
  return res.data;
}

export async function updateStoryboardSurfaceState(
  storyboardId: string,
  itemId: string,
  payload: Partial<Omit<StoryboardSurfaceState, "item_id">>,
): Promise<StoryboardSurfaceState> {
  const res = await axiosInstance.patch(`/api/storyboard/storyboards/${storyboardId}/items/${itemId}/surface`, payload);
  return res.data;
}

export async function resetStoryboardLayout(storyboardId: string): Promise<void> {
  await axiosInstance.post(`/api/storyboard/storyboards/${storyboardId}/surface/reset`);
}

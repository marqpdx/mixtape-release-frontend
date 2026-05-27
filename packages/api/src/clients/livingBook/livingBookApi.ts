// packages/api/src/clients/livingBook/livingBookApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export interface LivingBook {
  id: string;
  title: string;
  description: string;
  status: "draft" | "active" | "archived";
  trunk_id: string;
  trunk_slug: string;
  trunk_title: string;
  sponsor_type: "member" | "group" | null;
  group_slug: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LivingBookNode {
  id: string;
  slug: string;
  title: string;
  depth: number;
  position: number;
  relationship_id: string;
  is_published: boolean;
}

export interface ContextNeighbors {
  prev: { id: string; slug: string; title: string; excerpt: string } | null;
  next: { id: string; slug: string; title: string; excerpt: string } | null;
}

export interface AccumulatedNode {
  piece_id: string;
  piece_slug: string;
  title: string;
  body: any;
  word_count: number;
  is_published: boolean;
  depth: number;
  position: number;
}

export interface PromotePayload {
  piece_slug: string;
  title: string;
  description?: string;
  group_slug?: string;
}

export interface AddNodePayload {
  piece_slug: string;
  parent_id?: string;
  position?: number;
}

export interface CreateAddNodePayload {
  title?: string;
  parent_id?: string;
  position?: number;
}

export interface ReorderPayload {
  parent_id: string | null;
  ordered_piece_ids: string[];
}

export async function promoteLivingBook(payload: PromotePayload): Promise<LivingBook> {
  const res = await axiosInstance.post<LivingBook>("/api/living-books/", payload);
  return res.data;
}

export async function getLivingBook(id: string): Promise<LivingBook> {
  const res = await axiosInstance.get<LivingBook>(`/api/living-books/${id}/`);
  return res.data;
}

export async function updateLivingBook(
  id: string,
  payload: Partial<Pick<LivingBook, "title" | "description" | "status">>
): Promise<LivingBook> {
  const res = await axiosInstance.patch<LivingBook>(`/api/living-books/${id}/`, payload);
  return res.data;
}

export async function getLivingBookTree(id: string): Promise<LivingBookNode[]> {
  const res = await axiosInstance.get<LivingBookNode[]>(`/api/living-books/${id}/tree/`);
  return res.data;
}

export async function getAccumulatedView(id: string): Promise<AccumulatedNode[]> {
  const res = await axiosInstance.get<AccumulatedNode[]>(`/api/living-books/${id}/accumulated/`);
  return res.data;
}

export async function addNode(id: string, payload: AddNodePayload): Promise<LivingBookNode> {
  const res = await axiosInstance.post<LivingBookNode>(`/api/living-books/${id}/nodes/`, payload);
  return res.data;
}

export async function createAddNode(
  id: string,
  payload: CreateAddNodePayload
): Promise<{ piece: { id: string; slug: string; title: string }; relationship: any }> {
  const res = await axiosInstance.post(`/api/living-books/${id}/nodes/create/`, payload);
  return res.data;
}

export async function reorderNodes(
  id: string,
  parentId: string | null,
  orderedPieceIds: string[]
): Promise<void> {
  const url = parentId
    ? `/api/living-books/${id}/nodes/${parentId}/reorder/`
    : `/api/living-books/${id}/nodes/reorder/`;
  await axiosInstance.patch(url, { ordered_piece_ids: orderedPieceIds });
}

export async function removeNode(id: string, pieceId: string): Promise<void> {
  await axiosInstance.delete(`/api/living-books/${id}/nodes/${pieceId}/`);
}

export async function getContextNeighbors(
  id: string,
  pieceId: string
): Promise<ContextNeighbors> {
  const res = await axiosInstance.get<ContextNeighbors>(
    `/api/living-books/${id}/context/${pieceId}/`
  );
  return res.data;
}

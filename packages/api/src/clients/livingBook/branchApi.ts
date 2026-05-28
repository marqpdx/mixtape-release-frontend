// packages/api/src/clients/livingBook/branchApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance"

export interface Branch {
  id: string
  living_book_id: string
  anchor_node_id: string
  prompt_text: string | null
  due_date: string | null
  is_detached: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface LeafClusterPiece {
  id: string
  slug: string
  title: string
  is_published: boolean
  author_username: string | null
}

export interface LeafCluster {
  id: string
  branch_id: string
  piece: LeafClusterPiece
  media_type: "text" | "voice" | "video"
  created_by: string | null
  created_at: string
}

// ─── Branch ─────────────────────────────────────────────────────────────────

export async function listBranches(lbId: string): Promise<Branch[]> {
  const res = await axiosInstance.get<Branch[]>(`/api/living-books/${lbId}/branches/`)
  return res.data
}

export async function createBranch(
  lbId: string,
  payload: { anchor_node_id: string; prompt_text?: string; due_date?: string }
): Promise<Branch> {
  const res = await axiosInstance.post<Branch>(`/api/living-books/${lbId}/branches/`, payload)
  return res.data
}

export async function updateBranch(
  lbId: string,
  branchId: string,
  payload: Partial<Pick<Branch, "prompt_text" | "due_date" | "is_detached">>
): Promise<Branch> {
  const res = await axiosInstance.patch<Branch>(
    `/api/living-books/${lbId}/branches/${branchId}/`,
    payload
  )
  return res.data
}

export async function sendInvitation(lbId: string, branchId: string): Promise<void> {
  await axiosInstance.post(`/api/living-books/${lbId}/branches/${branchId}/send-invitation/`)
}

export async function deleteBranch(lbId: string, branchId: string): Promise<void> {
  await axiosInstance.delete(`/api/living-books/${lbId}/branches/${branchId}/`)
}

// ─── LeafCluster ─────────────────────────────────────────────────────────────

export async function listLeafClusters(
  lbId: string,
  branchId: string
): Promise<LeafCluster[]> {
  const res = await axiosInstance.get<LeafCluster[]>(
    `/api/living-books/${lbId}/branches/${branchId}/leaf-clusters/`
  )
  return res.data
}

export async function attachLeafCluster(
  lbId: string,
  branchId: string,
  payload: { piece_slug: string; media_type?: "text" | "voice" }
): Promise<LeafCluster> {
  const res = await axiosInstance.post<LeafCluster>(
    `/api/living-books/${lbId}/branches/${branchId}/leaf-clusters/`,
    payload
  )
  return res.data
}

export async function detachLeafCluster(
  lbId: string,
  branchId: string,
  lcId: string
): Promise<void> {
  await axiosInstance.delete(
    `/api/living-books/${lbId}/branches/${branchId}/leaf-clusters/${lcId}/`
  )
}

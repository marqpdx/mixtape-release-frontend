// packages/api/src/hooks/useBranches.ts

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as branchApi from "../clients/livingBook/branchApi"
import type { Branch, LeafCluster } from "../clients/livingBook/branchApi"

// ─── Query keys ──────────────────────────────────────────────────────────────

const branchKeys = {
  list: (lbId: string) => ["living-book", lbId, "branches"] as const,
  leafClusters: (lbId: string, branchId: string) =>
    ["living-book", lbId, "branches", branchId, "leaf-clusters"] as const,
}

// ─── Branch queries ───────────────────────────────────────────────────────────

export function useBranches(lbId: string) {
  return useQuery<Branch[]>({
    queryKey: branchKeys.list(lbId),
    queryFn: () => branchApi.listBranches(lbId),
    enabled: !!lbId,
  })
}

export function useCreateBranch(lbId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { anchor_node_id: string; prompt_text?: string; due_date?: string }) =>
      branchApi.createBranch(lbId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: branchKeys.list(lbId) })
    },
  })
}

export function useUpdateBranch(lbId: string, branchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Pick<Branch, "prompt_text" | "due_date" | "is_detached">>) =>
      branchApi.updateBranch(lbId, branchId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: branchKeys.list(lbId) })
    },
  })
}

export function useSendInvitation(lbId: string, branchId: string) {
  return useMutation({
    mutationFn: () => branchApi.sendInvitation(lbId, branchId),
  })
}

export function useDeleteBranch(lbId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (branchId: string) => branchApi.deleteBranch(lbId, branchId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: branchKeys.list(lbId) })
    },
  })
}

// ─── LeafCluster queries ──────────────────────────────────────────────────────

export function useLeafClusters(lbId: string, branchId: string) {
  return useQuery<LeafCluster[]>({
    queryKey: branchKeys.leafClusters(lbId, branchId),
    queryFn: () => branchApi.listLeafClusters(lbId, branchId),
    enabled: !!lbId && !!branchId,
  })
}

export function useAttachLeafCluster(lbId: string, branchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: { piece_slug: string; media_type?: "text" | "voice" }) =>
      branchApi.attachLeafCluster(lbId, branchId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: branchKeys.leafClusters(lbId, branchId) })
    },
  })
}

export function useDetachLeafCluster(lbId: string, branchId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (lcId: string) => branchApi.detachLeafCluster(lbId, branchId, lcId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: branchKeys.leafClusters(lbId, branchId) })
    },
  })
}

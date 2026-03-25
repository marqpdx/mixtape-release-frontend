// packages/api/src/clients/workbench/curationApi.ts
//
// Curation Workbench API — WorkingItems, Pieces (Lane 1 aggregation), and promotion.
// Distinct from workbenchApi.ts which handles the MillDraft/Review Queue system.

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// ============================================================================
// Types
// ============================================================================

export type WorkingItemStatus = "assembling" | "ready" | "promoted" | "parked" | "archived";

export interface WorkingItemMembership {
  id: string;
  piece_content_type: number;
  piece_object_id: string;
  type_label: string;
  content_snapshot: string;
  position: number;
  created_at: string;
}

export interface WorkingItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body_json: Record<string, unknown>;
  status: WorkingItemStatus;
  target_writing_kind: string;
  body_editing_started: boolean;
  spellcheck_passed: boolean;
  spellcheck_passed_at: string | null;
  promotion_gates: Record<string, boolean>;
  promoted_to: string | null;
  promoted_at: string | null;
  last_saved_at: string | null;
  auto_save_count: number;
  author_username: string;
  memberships: WorkingItemMembership[];
  created_at: string;
  updated_at: string;
}

export interface WorkingItemSummary {
  id: string;
  slug: string;
  title: string;
  status: WorkingItemStatus;
  target_writing_kind: string;
  spellcheck_passed: boolean;
  author_username: string;
  membership_count: number;
  last_saved_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PieceTypeLabel = "seed" | "leaf" | "milldraft" | "feedback" | "working_document";

export interface Piece {
  id: string;
  content_type_id: number;
  type_label: PieceTypeLabel;
  title: string;
  excerpt: string;
  author: string;
  sponsor_id: string | null;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  working_item_references: { id: string; title: string }[];
}

export interface PromoteResult {
  writing_piece_id: string;
  working_document_id: string;
  working_item_id: string;
  gate_warnings: { gate: string; message: string; hard: boolean }[];
}

export interface GateFailure {
  gate: string;
  message: string;
  hard: boolean;
}

// ============================================================================
// API calls
// ============================================================================

const base = (groupSlug: string) => `/api/groups/${groupSlug}/workbench`;

export const curationApi = {
  // -- Pieces (Lane 1 aggregation) --
  listPieces: (groupSlug: string, params?: {
    type?: PieceTypeLabel;
    q?: string;
    status?: string;
    ungrouped?: boolean;
    ordering?: string;
  }) =>
    axiosInstance.get<Piece[]>(`${base(groupSlug)}/pieces`, { params }),

  // -- Working Items --
  listWorkingItems: (groupSlug: string, params?: { status?: string }) =>
    axiosInstance.get<WorkingItemSummary[]>(`${base(groupSlug)}/working-items`, { params }),

  getWorkingItem: (groupSlug: string, itemId: string) =>
    axiosInstance.get<WorkingItem>(`${base(groupSlug)}/working-items/${itemId}`),

  createWorkingItem: (groupSlug: string, data: {
    title?: string;
    pieces?: { content_type_id: number; object_id: string; position: number }[];
  }) =>
    axiosInstance.post<WorkingItem>(`${base(groupSlug)}/working-items`, data),

  updateWorkingItem: (groupSlug: string, itemId: string, data: Partial<{
    title: string;
    summary: string;
    status: WorkingItemStatus;
    target_writing_kind: string;
  }>) =>
    axiosInstance.patch<WorkingItem>(`${base(groupSlug)}/working-items/${itemId}`, data),

  deleteWorkingItem: (groupSlug: string, itemId: string) =>
    axiosInstance.delete(`${base(groupSlug)}/working-items/${itemId}`),

  autosave: (groupSlug: string, itemId: string, data: {
    body_json?: Record<string, unknown>;
    title?: string;
  }) =>
    axiosInstance.patch(`${base(groupSlug)}/working-items/${itemId}/autosave`, data),

  // -- Membership --
  addPiece: (groupSlug: string, itemId: string, data: {
    content_type_id: number;
    object_id: string;
  }) =>
    axiosInstance.post<WorkingItemMembership>(
      `${base(groupSlug)}/working-items/${itemId}/pieces`, data
    ),

  removePiece: (groupSlug: string, itemId: string, membershipId: string) =>
    axiosInstance.delete(
      `${base(groupSlug)}/working-items/${itemId}/pieces/${membershipId}`
    ),

  // -- Promotion --
  promote: (groupSlug: string, itemId: string, overrideSoftGates = false) =>
    axiosInstance.post<PromoteResult>(
      `${base(groupSlug)}/working-items/${itemId}/promote`,
      { override_soft_gates: overrideSoftGates }
    ),
};

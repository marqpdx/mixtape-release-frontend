// packages/api/src/clients/writing/issueBoardApi.ts
// ADR-0054 + Phase 3 amendment: Issue Board API client (renamed from runBoardApi)

import { Issue, IssueGrouping, IssueListItem, IssuePlacement, IssueRead } from "@mixtape/core/types/writingTypes";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export interface IssueSponsor {
  type: "member" | "group";
  slug: string;
}

export async function listIssues(sponsor: IssueSponsor): Promise<IssueListItem[]> {
  const res = await axiosInstance.get("/api/writing/issues", {
    params: { sponsor_type: sponsor.type, sponsor_slug: sponsor.slug },
  });
  return res.data;
}

export async function listIssueGrouping(sponsor: IssueSponsor): Promise<IssueGrouping[]> {
  const res = await axiosInstance.get("/api/writing/issues/grouping", {
    params: { sponsor_type: sponsor.type, sponsor_slug: sponsor.slug },
  });
  return res.data;
}

export async function createIssue(title: string, sponsor: IssueSponsor): Promise<Issue> {
  const res = await axiosInstance.post("/api/writing/issues", {
    title,
    sponsor_type: sponsor.type,
    sponsor_slug: sponsor.slug,
  });
  return res.data;
}

export async function getIssue(issueId: string): Promise<Issue> {
  const res = await axiosInstance.get(`/api/writing/issues/${issueId}`);
  return res.data;
}

export async function updateIssue(
  issueId: string,
  updates: { title?: string; designation?: string; description?: Record<string, unknown> }
): Promise<Issue> {
  const res = await axiosInstance.patch(`/api/writing/issues/${issueId}`, updates);
  return res.data;
}

export async function deleteIssue(issueId: string): Promise<void> {
  await axiosInstance.delete(`/api/writing/issues/${issueId}`);
}

export async function publishIssue(issueId: string): Promise<Issue> {
  const res = await axiosInstance.post(`/api/writing/issues/${issueId}/publish`);
  return res.data;
}

export async function unpublishIssue(issueId: string, cascade: boolean): Promise<Issue> {
  const res = await axiosInstance.post(`/api/writing/issues/${issueId}/unpublish`, { cascade });
  return res.data;
}

export async function addIssuePlacement(issueId: string, pieceId: string, beforePieceId?: string): Promise<IssuePlacement> {
  const res = await axiosInstance.post(`/api/writing/issues/${issueId}/placements`, {
    piece_id: pieceId,
    ...(beforePieceId ? { before_piece_id: beforePieceId } : {}),
  });
  return res.data;
}

export async function removeIssuePlacement(issueId: string, pieceId: string): Promise<void> {
  await axiosInstance.delete(`/api/writing/issues/${issueId}/placements/${pieceId}`);
}

export async function setIssuePlacementLead(issueId: string, pieceId: string, isLead: boolean): Promise<IssuePlacement> {
  const res = await axiosInstance.patch(`/api/writing/issues/${issueId}/placements/${pieceId}`, { is_lead: isLead });
  return res.data;
}

export async function reorderIssuePlacements(issueId: string, pieceIds: string[]): Promise<Issue> {
  const res = await axiosInstance.patch(`/api/writing/issues/${issueId}/placements/reorder`, { piece_ids: pieceIds });
  return res.data;
}

export async function getIssueRead(issueId: string): Promise<IssueRead> {
  const res = await axiosInstance.get(`/api/writing/issues/${issueId}/read`);
  return res.data;
}

export async function signOffPiece(pieceId: string, expectedRevision: number): Promise<{ signed_off: boolean; piece_id: string }> {
  const res = await axiosInstance.post(`/api/writing/pieces/${pieceId}/sign-off`, {
    expected_auto_save_count: expectedRevision,
  });
  return res.data;
}

export async function reviewSpelling(pieceId: string, expectedRevision: number): Promise<{ spellcheck_clean: boolean; piece_id: string }> {
  const res = await axiosInstance.post(`/api/writing/pieces/${pieceId}/spelling-review`, {
    expected_auto_save_count: expectedRevision,
  });
  return res.data;
}

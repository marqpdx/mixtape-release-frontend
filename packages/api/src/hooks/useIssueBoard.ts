// packages/api/src/hooks/useIssueBoard.ts
// ADR-0054 + Phase 3 amendment: Issue Board data hook (renamed from useRunBoard)

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Issue, IssueListItem, IssueRead } from "@mixtape/core/types/writingTypes";
import * as issueBoardApi from "@mixtape/api/clients/writing/issueBoardApi";

const ISSUES_KEY = ["writing", "issues"];
const issueKey = (id: string) => ["writing", "issues", id];

export function useIssues(sponsor: issueBoardApi.IssueSponsor) {
  const qc = useQueryClient();
  const listKey = [...ISSUES_KEY, sponsor.type, sponsor.slug];

  const { data: issues = [], isLoading, error } = useQuery<IssueListItem[]>({
    queryKey: listKey,
    queryFn: () => issueBoardApi.listIssues(sponsor),
    enabled: !!sponsor.slug,
  });

  const createIssue = useMutation({
    mutationFn: (title: string) => issueBoardApi.createIssue(title, sponsor),
    onSuccess: () => qc.invalidateQueries({ queryKey: ISSUES_KEY }),
  });

  const deleteIssue = useMutation({
    mutationFn: (issueId: string) => issueBoardApi.deleteIssue(issueId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ISSUES_KEY }),
  });

  const addToIssue = useMutation({
    mutationFn: ({ issueId, pieceId, beforePieceId }: { issueId: string; pieceId: string; beforePieceId?: string }) =>
      issueBoardApi.addIssuePlacement(issueId, pieceId, beforePieceId),
    onSuccess: (_, { issueId }) => {
      qc.invalidateQueries({ queryKey: ISSUES_KEY });
      qc.invalidateQueries({ queryKey: issueKey(issueId) });
    },
  });

  const removeFromIssue = useMutation({
    mutationFn: ({ issueId, pieceId }: { issueId: string; pieceId: string }) =>
      issueBoardApi.removeIssuePlacement(issueId, pieceId),
    onSuccess: (_, { issueId }) => {
      qc.invalidateQueries({ queryKey: ISSUES_KEY });
      qc.invalidateQueries({ queryKey: issueKey(issueId) });
    },
  });

  return { issues, isLoading, error, createIssue, deleteIssue, addToIssue, removeFromIssue };
}

export function useIssue(issueId: string | null) {
  const qc = useQueryClient();

  const { data: issue, isLoading, error } = useQuery<Issue>({
    queryKey: issueKey(issueId!),
    queryFn: () => issueBoardApi.getIssue(issueId!),
    enabled: !!issueId,
  });

  const updateIssue = useMutation({
    mutationFn: (updates: { title?: string; designation?: string; description?: Record<string, unknown> }) =>
      issueBoardApi.updateIssue(issueId!, updates),
    onSuccess: (updated) => {
      qc.setQueryData(issueKey(issueId!), updated);
      qc.invalidateQueries({ queryKey: ISSUES_KEY });
    },
  });

  const publishIssue = useMutation({
    mutationFn: () => issueBoardApi.publishIssue(issueId!),
    onSuccess: (updated) => {
      qc.setQueryData(issueKey(issueId!), updated);
      qc.invalidateQueries({ queryKey: ["writing"] });
    },
  });

  const unpublishIssue = useMutation({
    mutationFn: ({ issueId: targetId, cascade }: { issueId: string; cascade: boolean }) =>
      issueBoardApi.unpublishIssue(targetId, cascade),
    onSuccess: (updated) => {
      qc.setQueryData(issueKey(updated.id), updated);
      qc.invalidateQueries({ queryKey: ["writing"] });
    },
  });

  const addPlacement = useMutation({
    mutationFn: (pieceId: string) => issueBoardApi.addIssuePlacement(issueId!, pieceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKey(issueId!) });
      qc.invalidateQueries({ queryKey: ISSUES_KEY });
    },
  });

  const removePlacement = useMutation({
    mutationFn: (pieceId: string) => issueBoardApi.removeIssuePlacement(issueId!, pieceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKey(issueId!) });
      qc.invalidateQueries({ queryKey: ISSUES_KEY });
    },
  });

  const setPlacementLead = useMutation({
    mutationFn: ({ pieceId, isLead }: { pieceId: string; isLead: boolean }) =>
      issueBoardApi.setIssuePlacementLead(issueId!, pieceId, isLead),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKey(issueId!) }),
  });

  const reorderPlacements = useMutation({
    mutationFn: (pieceIds: string[]) => issueBoardApi.reorderIssuePlacements(issueId!, pieceIds),
    onSuccess: (updated) => {
      qc.setQueryData(issueKey(issueId!), updated);
      qc.invalidateQueries({ queryKey: ISSUES_KEY });
    },
  });

  const signOffPiece = useMutation({
    mutationFn: ({ pieceId, revision }: { pieceId: string; revision: number }) => issueBoardApi.signOffPiece(pieceId, revision),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKey(issueId!) });
      qc.invalidateQueries({ queryKey: ["writing", "issues", issueId, "read"] });
      qc.invalidateQueries({ queryKey: ISSUES_KEY });
    },
  });

  const reviewSpelling = useMutation({
    mutationFn: ({ pieceId, revision }: { pieceId: string; revision: number }) => issueBoardApi.reviewSpelling(pieceId, revision),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKey(issueId!) });
      qc.invalidateQueries({ queryKey: ["writing", "issues", issueId, "read"] });
      qc.invalidateQueries({ queryKey: ISSUES_KEY });
    },
  });

  return {
    issue, isLoading, error, updateIssue, publishIssue, unpublishIssue,
    addPlacement, removePlacement, setPlacementLead, reorderPlacements, signOffPiece, reviewSpelling,
  };
}

// Phase 3 amendment P3-4: Continuous Read view data
export function useIssueRead(issueId: string | null) {
  return useQuery<IssueRead>({
    queryKey: ["writing", "issues", issueId, "read"],
    queryFn: () => issueBoardApi.getIssueRead(issueId!),
    enabled: !!issueId,
  });
}

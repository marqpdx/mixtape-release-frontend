// packages/api/src/hooks/useIssueBoard.ts
// ADR-0054 + Phase 3 amendment: Issue Board data hook (renamed from useRunBoard)

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Issue, IssueListItem, IssueRead } from "@mixtape/core/types/writingTypes";
import * as issueBoardApi from "@mixtape/api/clients/writing/issueBoardApi";

const ISSUES_KEY = ["writing", "issues"];
const issueKey = (id: string) => ["writing", "issues", id];

export function useIssues() {
  const qc = useQueryClient();

  const { data: issues = [], isLoading, error } = useQuery<IssueListItem[]>({
    queryKey: ISSUES_KEY,
    queryFn: issueBoardApi.listIssues,
  });

  const createIssue = useMutation({
    mutationFn: (title: string) => issueBoardApi.createIssue(title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ISSUES_KEY }),
  });

  const deleteIssue = useMutation({
    mutationFn: (issueId: string) => issueBoardApi.deleteIssue(issueId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ISSUES_KEY }),
  });

  return { issues, isLoading, error, createIssue, deleteIssue };
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
      qc.invalidateQueries({ queryKey: ISSUES_KEY });
    },
  });

  const addPlacement = useMutation({
    mutationFn: (pieceId: string) => issueBoardApi.addIssuePlacement(issueId!, pieceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKey(issueId!) }),
  });

  const removePlacement = useMutation({
    mutationFn: (pieceId: string) => issueBoardApi.removeIssuePlacement(issueId!, pieceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKey(issueId!) }),
  });

  const setPlacementLead = useMutation({
    mutationFn: (pieceId: string) => issueBoardApi.setIssuePlacementLead(issueId!, pieceId, true),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKey(issueId!) }),
  });

  const reorderPlacements = useMutation({
    mutationFn: (pieceIds: string[]) => issueBoardApi.reorderIssuePlacements(issueId!, pieceIds),
    onSuccess: (updated) => qc.setQueryData(issueKey(issueId!), updated),
  });

  const signOffPiece = useMutation({
    mutationFn: (pieceId: string) => issueBoardApi.signOffPiece(pieceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: issueKey(issueId!) }),
  });

  return {
    issue, isLoading, error, updateIssue, publishIssue,
    addPlacement, removePlacement, setPlacementLead, reorderPlacements, signOffPiece,
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

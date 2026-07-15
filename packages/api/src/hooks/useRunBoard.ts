// packages/api/src/hooks/useRunBoard.ts
// ADR-0054: Writing Assembly — Run Board data hook

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { WritingRun, WritingRunList } from "@mixtape/core/types/writingTypes";
import * as runBoardApi from "@mixtape/api/clients/writing/runBoardApi";

const RUNS_KEY = ["writing", "runs"];
const runKey = (id: string) => ["writing", "runs", id];

export function useRuns() {
  const qc = useQueryClient();

  const { data: runs = [], isLoading, error } = useQuery<WritingRunList[]>({
    queryKey: RUNS_KEY,
    queryFn: runBoardApi.listRuns,
  });

  const createRun = useMutation({
    mutationFn: (title: string) => runBoardApi.createRun(title),
    onSuccess: () => qc.invalidateQueries({ queryKey: RUNS_KEY }),
  });

  const deleteRun = useMutation({
    mutationFn: (runId: string) => runBoardApi.deleteRun(runId),
    onSuccess: () => qc.invalidateQueries({ queryKey: RUNS_KEY }),
  });

  return { runs, isLoading, error, createRun, deleteRun };
}

export function useRun(runId: string | null) {
  const qc = useQueryClient();

  const { data: run, isLoading, error } = useQuery<WritingRun>({
    queryKey: runKey(runId!),
    queryFn: () => runBoardApi.getRun(runId!),
    enabled: !!runId,
  });

  const updateRun = useMutation({
    mutationFn: (title: string) => runBoardApi.updateRun(runId!, title),
    onSuccess: (updated) => {
      qc.setQueryData(runKey(runId!), updated);
      qc.invalidateQueries({ queryKey: RUNS_KEY });
    },
  });

  const publishRun = useMutation({
    mutationFn: () => runBoardApi.publishRun(runId!),
    onSuccess: (updated) => {
      qc.setQueryData(runKey(runId!), updated);
      qc.invalidateQueries({ queryKey: RUNS_KEY });
    },
  });

  const addMember = useMutation({
    mutationFn: (pieceId: string) => runBoardApi.addRunMember(runId!, pieceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: runKey(runId!) }),
  });

  const removeMember = useMutation({
    mutationFn: (pieceId: string) => runBoardApi.removeRunMember(runId!, pieceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: runKey(runId!) }),
  });

  const reorderMembers = useMutation({
    mutationFn: (pieceIds: string[]) => runBoardApi.reorderRunMembers(runId!, pieceIds),
    onSuccess: (updated) => qc.setQueryData(runKey(runId!), updated),
  });

  const signOffPiece = useMutation({
    mutationFn: (pieceId: string) => runBoardApi.signOffPiece(pieceId),
    onSuccess: () => qc.invalidateQueries({ queryKey: runKey(runId!) }),
  });

  return { run, isLoading, error, updateRun, publishRun, addMember, removeMember, reorderMembers, signOffPiece };
}

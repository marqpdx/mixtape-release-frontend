// packages/api/src/clients/writing/runBoardApi.ts
// ADR-0054: Writing Assembly — Run Board API client

import { WritingRun, WritingRunList, RunMember } from "@mixtape/core/types/writingTypes";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export async function listRuns(): Promise<WritingRunList[]> {
  const res = await axiosInstance.get("/api/writing/runs");
  return res.data;
}

export async function createRun(title: string): Promise<WritingRun> {
  const res = await axiosInstance.post("/api/writing/runs", { title });
  return res.data;
}

export async function getRun(runId: string): Promise<WritingRun> {
  const res = await axiosInstance.get(`/api/writing/runs/${runId}`);
  return res.data;
}

export async function updateRun(runId: string, title: string): Promise<WritingRun> {
  const res = await axiosInstance.patch(`/api/writing/runs/${runId}`, { title });
  return res.data;
}

export async function deleteRun(runId: string): Promise<void> {
  await axiosInstance.delete(`/api/writing/runs/${runId}`);
}

export async function publishRun(runId: string): Promise<WritingRun> {
  const res = await axiosInstance.post(`/api/writing/runs/${runId}/publish`);
  return res.data;
}

export async function addRunMember(runId: string, pieceId: string): Promise<RunMember> {
  const res = await axiosInstance.post(`/api/writing/runs/${runId}/members`, { piece_id: pieceId });
  return res.data;
}

export async function removeRunMember(runId: string, pieceId: string): Promise<void> {
  await axiosInstance.delete(`/api/writing/runs/${runId}/members/${pieceId}`);
}

export async function reorderRunMembers(runId: string, pieceIds: string[]): Promise<WritingRun> {
  const res = await axiosInstance.patch(`/api/writing/runs/${runId}/members/reorder`, { piece_ids: pieceIds });
  return res.data;
}

export async function signOffPiece(pieceId: string): Promise<{ signed_off: boolean; piece_id: string }> {
  const res = await axiosInstance.post(`/api/writing/pieces/${pieceId}/sign-off`);
  return res.data;
}

export async function setSpellcheckClean(pieceId: string, clean: boolean): Promise<void> {
  await axiosInstance.patch(`/api/writing/pieces/${pieceId}`, { spellcheck_clean: clean });
}

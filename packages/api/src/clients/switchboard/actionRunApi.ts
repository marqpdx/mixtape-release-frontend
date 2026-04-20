import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export type ActionRunStatus = "pending" | "running" | "succeeded" | "failed";

export interface ActionRun {
  id: string;
  status: ActionRunStatus;
  tool_name: string;
  result_payload: Record<string, unknown> | null;
  error_payload: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
}

export async function getActionRun(id: string): Promise<ActionRun> {
  const res = await axiosInstance.get(`/api/initiatives/action-runs/${id}`);
  return res.data as ActionRun;
}

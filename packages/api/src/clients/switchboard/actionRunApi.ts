import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export type ActionRunStatus = "pending" | "running" | "succeeded" | "failed";
export type ApprovalMode = "standard" | "reviewed_default" | "trusted_default";

export interface ActionRun {
  id: string;
  status: ActionRunStatus;
  tool_name: string;
  cloud_approved: boolean;
  result_payload: Record<string, unknown> | null;
  error_payload: Record<string, unknown> | null;
  started_at: string;
  completed_at: string | null;
}

export interface ApproveActionRunRequest {
  approval_mode?: ApprovalMode;
}

export async function getActionRun(id: string): Promise<ActionRun> {
  const res = await axiosInstance.get(`/api/initiatives/action-runs/${id}`);
  return res.data as ActionRun;
}

export async function approveActionRun(
  id: string,
  payload: ApproveActionRunRequest = {}
): Promise<ActionRun> {
  const res = await axiosInstance.post(`/api/initiatives/action-runs/${id}/approve`, payload);
  return res.data as ActionRun;
}

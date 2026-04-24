import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export type AgentCommandSource = "mobile_initiatives" | "desktop_initiatives";
export type AgentCaptureMode = "typed" | "voice" | "imported" | "pasted";
export type AgentCommandStatus = "parsed" | "executed" | "failed";
export type AgentCommandResultType =
  | "acknowledgment"
  | "generated_artifact"
  | "search_results"
  | "";

export interface CreateAgentCommandRequest {
  text: string;
  source?: AgentCommandSource;
  capture_mode?: AgentCaptureMode;
  draft_id?: string;
  session_id?: string;
  initiative_id?: string | null;
  sponsor_model?: string;
  sponsor_id?: string | null;
}

export interface ConfirmAgentCommandRequest {
  confirm_action: "confirm";
  fields?: Record<string, unknown>;
}

export interface AgentCommandResponse {
  id: string;
  command_id: string;
  status: AgentCommandStatus;
  source: AgentCommandSource;
  capture_mode: AgentCaptureMode;
  draft_session_id: string;
  verb: string;
  executed_verb: string;
  confidence: number;
  title: string;
  summary: string;
  fields: Record<string, unknown>;
  generated_text: string;
  needs_clarification: boolean;
  clarification_reason: string;
  result_type: AgentCommandResultType;
  result_payload: Record<string, unknown>;
  follow_up_suggestions: unknown[];
  routing: Record<string, unknown>;
  error_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function createAgentCommand(
  payload: CreateAgentCommandRequest,
): Promise<AgentCommandResponse> {
  const res = await axiosInstance.post<AgentCommandResponse>(
    "/api/initiatives/mobile/commands",
    payload,
  );
  return res.data;
}

export async function getAgentCommand(
  commandId: string,
): Promise<AgentCommandResponse> {
  const res = await axiosInstance.get<AgentCommandResponse>(
    `/api/initiatives/mobile/commands/${commandId}`,
  );
  return res.data;
}

export async function confirmAgentCommand(
  commandId: string,
  payload: ConfirmAgentCommandRequest,
): Promise<AgentCommandResponse> {
  const res = await axiosInstance.post<AgentCommandResponse>(
    `/api/initiatives/mobile/commands/${commandId}/confirm`,
    payload,
  );
  return res.data;
}

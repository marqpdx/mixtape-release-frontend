import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export interface SummarizeAsyncRequest {
  text: string;
  words?: number;
  style?: string;
}

export interface SummarizeAsyncResponse {
  action_run_id: string;
}

export async function submitSummarizeAsync(
  payload: SummarizeAsyncRequest
): Promise<SummarizeAsyncResponse> {
  const res = await axiosInstance.post("/api/switchboard/summarize/async", payload);
  return res.data as SummarizeAsyncResponse;
}

export interface ClassifyAsyncRequest {
  text: string;
  max_tags?: number;
}

export interface ClassifyAsyncResponse {
  action_run_id: string;
}

export async function submitClassifyAsync(
  payload: ClassifyAsyncRequest
): Promise<ClassifyAsyncResponse> {
  const res = await axiosInstance.post("/api/switchboard/classify/async", payload);
  return res.data as ClassifyAsyncResponse;
}

export interface ContextShapeAsyncRequest {
  text: string;
  group_context?: string;
  surface?: string;
}

export interface ContextShapeAsyncResponse {
  action_run_id: string;
}

export async function submitContextShapeAsync(
  payload: ContextShapeAsyncRequest
): Promise<ContextShapeAsyncResponse> {
  const res = await axiosInstance.post("/api/switchboard/context-shape/async", payload);
  return res.data as ContextShapeAsyncResponse;
}

export type DraftContentType = 'email' | 'sop' | 'summary' | 'message' | 'document' | 'proposal';
export type DraftTone = 'professional' | 'friendly' | 'direct' | 'formal' | 'casual';
export type DraftLength = 'brief' | 'standard' | 'detailed';

export interface DraftAsyncRequest {
  content_type: DraftContentType;
  source_text: string;
  tone?: DraftTone;
  target_length?: DraftLength;
  audience?: string;
  additional_context?: string;
  surface?: 'console' | 'puddlejump';
}

export interface DraftAsyncResponse {
  action_run_id: string;
}

export interface DraftActionResult {
  status: 'SUCCEEDED';
  tool: string;
  content_type: DraftContentType;
  draft_text: string;
  tone: DraftTone | null;
  target_length: DraftLength | null;
  input_hash: string;
  quality_signal: number | null;
  model_used: string | null;
  draft_refused: boolean;
}

export async function submitDraftAsync(
  payload: DraftAsyncRequest
): Promise<DraftAsyncResponse> {
  const res = await axiosInstance.post("/api/switchboard/draft/async", payload);
  return res.data as DraftAsyncResponse;
}

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

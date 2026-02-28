import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export type FeedbackKind = "bug" | "request" | "idea" | "issue";
export type FeedbackStatus = "new" | "triaged" | "planned" | "shipped" | "wontfix";

export interface FeedbackChecklistItem {
  id: string;
  beacon_key: string;
  beacon_title: string;
  kind: FeedbackKind;
  message: string;
  page_url: string;
  status: FeedbackStatus;
  created_at: string;
  user_username?: string;
}

export interface FeedbackChecklistResponse {
  count: number;
  page: number;
  page_size: number;
  results: FeedbackChecklistItem[];
}

export async function listFeedbackChecklist(params?: {
  page?: number;
  pageSize?: number;
  kind?: FeedbackKind | "all";
  status?: FeedbackStatus | "all";
}): Promise<FeedbackChecklistResponse> {
  const query = {
    page: params?.page ?? 1,
    page_size: params?.pageSize ?? 50,
    ...(params?.kind && params.kind !== "all" ? { kind: params.kind } : {}),
    ...(params?.status && params.status !== "all" ? { status: params.status } : {}),
  };
  const response = await axiosInstance.get("/api/feedback/checklist", { params: query });
  return response.data;
}

export async function updateFeedbackStatus(
  id: string,
  status: FeedbackStatus
): Promise<FeedbackChecklistItem> {
  const response = await axiosInstance.patch(`/api/feedback/items/${id}`, { status });
  return response.data?.data as FeedbackChecklistItem;
}

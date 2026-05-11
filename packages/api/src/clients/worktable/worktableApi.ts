import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export interface StreamEntry {
  id: string;
  entry_type: "capture" | "prose" | "ledger" | "agentic_return";
  kind?: "fix" | "need_more" | "remind" | "note";
  body: string;
  status?: "open" | "resolved" | "promoted";
  visibility?: "private" | "shared";
  created_at: string;
  archived_at?: string | null;
  metadata: Record<string, unknown>;
}

export interface StreamResponse {
  entries: StreamEntry[];
  has_more: boolean;
  cursor: string | null;
}

export type StreamScope = "personal" | "group" | "initiative";

export async function archiveStreamEntry(entryId: string): Promise<void> {
  await axiosInstance.post(`/api/worktable/entries/${entryId}/archive/`);
}

export async function deleteStreamEntry(entryId: string): Promise<void> {
  await axiosInstance.delete(`/api/worktable/entries/${entryId}/`);
}

export async function fetchWorktableStream(params: {
  scope: StreamScope;
  group_slug?: string;
  initiative_id?: string;
  before?: string;
  limit?: number;
}): Promise<StreamResponse> {
  const p: Record<string, string> = { scope: params.scope };
  if (params.group_slug) p.group_slug = params.group_slug;
  if (params.initiative_id) p.initiative_id = params.initiative_id;
  if (params.before) p.before = params.before;
  if (params.limit) p.limit = String(params.limit);
  const res = await axiosInstance.get<StreamResponse>("/api/worktable/stream/", { params: p });
  return res.data;
}

// src/lib/gristmill/gristmillApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export interface GristBlock {
  type: string;
  title: string;  // From /type Title declaration
  fields: Record<string, string>;
  errors: Array<{field?: string; type: string; message: string}>;
}

export interface ParseResult {
  blocks: GristBlock[];
  warning?: string;
}

export interface MillDraft {
  id: string;
  block_type: string;
  ast: GristBlock;
  status: 'staged' | 'promoted' | 'rejected';
  created_at: string;
  warning?: string;
}

export interface PromoteDraftResponse {
  draft_id: string;
  event_id?: string;
  event_slug?: string;
  course_id?: string;
  course_slug?: string;
  lesson_id?: string;
  lesson_slug?: string;
  feedback_item_id?: string;
  kind?: string;
}

export async function parseGrist(grist: string): Promise<ParseResult> {
  const response = await axiosInstance.post('/api/gristmill/parse', { grist });
  return response.data;
}

export async function saveDraft(grist: string): Promise<MillDraft> {
  const response = await axiosInstance.post('/api/gristmill/drafts', { grist });
  return response.data;
}

export async function listDrafts(): Promise<MillDraft[]> {
  const response = await axiosInstance.get('/api/gristmill/drafts');
  return response.data;
}

export async function promoteDraft(
  draftId: string,
  groupSlug?: string,
  timezone?: string,
  pageUrl?: string
): Promise<PromoteDraftResponse> {
  const params = {
    ...(groupSlug ? { group_slug: groupSlug } : {}),
    ...(timezone ? { timezone } : {}),
    ...(pageUrl ? { page_url: pageUrl } : {}),
  };
  const response = await axiosInstance.post(`/api/gristmill/drafts/${draftId}/promote`, params);
  return response.data;
}

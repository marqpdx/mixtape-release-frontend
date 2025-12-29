// src/lib/gristmill/gristmillApi.ts

import { axiosInstance } from "../../lib/axiosInstance";

export interface GristBlock {
  type: string;
  title: string;  // From /type Title declaration
  fields: Record<string, string>;
  errors: Array<{field?: string; type: string; message: string}>;
}

export interface ParseResult {
  blocks: GristBlock[];
}

export interface MillDraft {
  id: string;
  block_type: string;
  ast: GristBlock;
  status: 'staged' | 'promoted' | 'rejected';
  created_at: string;
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

export async function promoteDraft(draftId: string, groupSlug?: string) {
  const params = groupSlug ? { group_slug: groupSlug } : {};
  const response = await axiosInstance.post(`/api/gristmill/drafts/${draftId}/promote`, params);
  return response.data;
}
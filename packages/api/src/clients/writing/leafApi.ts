// packages/api/src/clients/writing/leafApi.ts

import { axiosInstance } from '../../lib/axiosInstance';
import type { Leaf, LeafComment, LeafCreateData, LeafCommentCreateData } from '@mixtape/core/types/leaf';

export async function fetchStoryline(params?: {
  cursor?: string;
  limit?: number;
}): Promise<{ results: Leaf[]; next: string | null }> {
  const res = await axiosInstance.get('/api/writing/leaves', {
    params: { limit: params?.limit ?? 20, cursor: params?.cursor },
  });
  // Handle both paginated and flat responses
  if (Array.isArray(res.data)) {
    return { results: res.data, next: null };
  }
  return { results: res.data.results ?? [], next: res.data.next ?? null };
}

export async function fetchLeafDetail(id: string): Promise<Leaf> {
  const res = await axiosInstance.get(`/api/writing/leaves/${id}`);
  return res.data;
}

export async function createLeaf(data: LeafCreateData): Promise<Leaf> {
  const res = await axiosInstance.post('/api/writing/leaves', data);
  return res.data;
}

export async function createReferenceLeaf(data: {
  source_content_type: string;
  source_object_id: string;
  caption?: string;
}): Promise<Leaf> {
  const res = await axiosInstance.post('/api/writing/leaves/reference', data);
  return res.data;
}

export async function fetchLeafComments(leafId: string): Promise<LeafComment[]> {
  const res = await axiosInstance.get(`/api/writing/leaves/${leafId}/comments`);
  return Array.isArray(res.data) ? res.data : res.data.results ?? [];
}

export async function createLeafComment(
  leafId: string,
  data: LeafCommentCreateData
): Promise<LeafComment> {
  const res = await axiosInstance.post(`/api/writing/leaves/${leafId}/comments`, data);
  return res.data;
}

export async function uploadLeafImage(file: File): Promise<{ id: string; url: string }> {
  const form = new FormData();
  form.append('image', file);
  const res = await axiosInstance.post('/api/writing/leaves/upload-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function fetchDrafts(): Promise<{ results: Leaf[]; next: string | null }> {
  const res = await axiosInstance.get('/api/writing/leaves', {
    params: { drafts: 'true' },
  });
  if (Array.isArray(res.data)) {
    return { results: res.data, next: null };
  }
  return { results: res.data.results ?? [], next: res.data.next ?? null };
}

export async function publishLeaf(id: string): Promise<Leaf> {
  const res = await axiosInstance.post(`/api/writing/leaves/${id}/publish`);
  return res.data;
}

export async function deleteLeaf(id: string): Promise<void> {
  await axiosInstance.delete(`/api/writing/leaves/${id}`);
}

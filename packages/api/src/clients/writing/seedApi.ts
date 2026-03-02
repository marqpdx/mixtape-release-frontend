// packages/api/src/clients/writing/seedApi.ts

import { axiosInstance } from '../../lib/axiosInstance';

export interface Seed {
  id: string;
  body_text: string;
  kind: 'text' | 'voice';
  status: 'ready' | 'processing' | 'failed';
  audio_file: string | null;
  transcript_text: string | null;
  context_url: string | null;
  source: string;
  promoted_to: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchRecentSeeds(limit = 4): Promise<Seed[]> {
  const res = await axiosInstance.get('/api/writing/seeds', {
    params: { limit, ordering: '-created_at' },
  });
  // Handle both paginated and flat responses
  return Array.isArray(res.data) ? res.data : res.data.results ?? [];
}

export async function createSeed(data: {
  body_text: string;
  kind?: 'text' | 'voice';
  source?: string;
}): Promise<Seed> {
  const res = await axiosInstance.post('/api/writing/seeds', data);
  return res.data;
}

export async function updateSeed(
  id: string,
  data: { body_text?: string }
): Promise<Seed> {
  const res = await axiosInstance.patch(`/api/writing/seeds/${id}`, data);
  return res.data;
}

export async function deleteSeed(id: string): Promise<void> {
  await axiosInstance.delete(`/api/writing/seeds/${id}`);
}

export async function promoteSeedToLeaf(seedId: string) {
  const res = await axiosInstance.post(`/api/writing/seeds/${seedId}/promote-to-leaf`);
  return res.data;
}

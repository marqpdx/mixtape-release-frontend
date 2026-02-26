// packages/api/src/clients/writing/followApi.ts

import { axiosInstance } from '../../lib/axiosInstance';

export interface FollowEntry {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  followed_at: string;
}

export interface FollowStatus {
  is_following: boolean;
  followers_count: number;
  following_count: number;
}

export async function followUser(userId: string): Promise<{ id: string; following: string; created: boolean }> {
  const res = await axiosInstance.post('/api/workbench/follows', { user_id: userId });
  return res.data;
}

export async function unfollowUser(userId: string): Promise<void> {
  await axiosInstance.delete(`/api/workbench/follows/${userId}`);
}

export async function fetchFollowingList(): Promise<FollowEntry[]> {
  const res = await axiosInstance.get('/api/workbench/follows/list');
  return Array.isArray(res.data) ? res.data : res.data.results ?? [];
}

export async function fetchFollowStatus(userId: string): Promise<FollowStatus> {
  const res = await axiosInstance.get(`/api/workbench/follows/${userId}/status`);
  return res.data;
}

export async function fetchStreams(params?: {
  cursor?: string;
  limit?: number;
}) {
  const res = await axiosInstance.get('/api/writing/streams', {
    params: { limit: params?.limit ?? 20, cursor: params?.cursor },
  });
  if (Array.isArray(res.data)) {
    return { results: res.data, next: null };
  }
  return { results: res.data.results ?? [], next: res.data.next ?? null };
}

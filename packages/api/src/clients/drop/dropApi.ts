// packages/api/src/clients/drop/dropApi.ts
import type { Drop, DropCreateData } from '@mixtape/core/types/dropTypes';
import { axiosInstance } from '@mixtape/api/lib/axiosInstance';

export async function fetchGroupDrops(groupSlug: string): Promise<Drop[]> {
  const response = await axiosInstance.get<Drop[]>(`/api/groups/${groupSlug}/drops/`);
  return response.data;
}

export async function createGroupDrop(groupSlug: string, data: DropCreateData): Promise<Drop> {
  const response = await axiosInstance.post<Drop>(`/api/groups/${groupSlug}/drops/`, data);
  return response.data;
}

export async function archiveGroupDrop(groupSlug: string, dropId: string): Promise<void> {
  await axiosInstance.post(`/api/groups/${groupSlug}/drops/${dropId}/archive/`);
}

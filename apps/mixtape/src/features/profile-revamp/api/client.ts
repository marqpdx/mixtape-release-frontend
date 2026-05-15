import type { ProfileDTO, ProfilePatch, SectionEntry, PinnedDTO, NowDTO, QAItemDTO, LinkDTO } from './types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8010';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function fetchPublicProfile(username: string): Promise<ProfileDTO> {
  return apiFetch<ProfileDTO>(`/api/profiles/${username}`, { next: { revalidate: 60 } } as RequestInit);
}

export async function fetchMyProfile(): Promise<ProfileDTO> {
  return apiFetch<ProfileDTO>('/api/me/profile/new');
}

export async function patchMyProfile(data: ProfilePatch): Promise<ProfileDTO> {
  return apiFetch<ProfileDTO>('/api/me/profile/new', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function putSections(layout: SectionEntry[]): Promise<ProfileDTO> {
  return apiFetch<ProfileDTO>('/api/me/profile/new/sections', {
    method: 'PUT',
    body: JSON.stringify({ layout }),
  });
}

export async function putPinned(data: Omit<PinnedDTO, 'cover'>): Promise<ProfileDTO> {
  return apiFetch<ProfileDTO>('/api/me/profile/new/pinned', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function putNowPlaying(data: Partial<NowDTO>): Promise<ProfileDTO> {
  return apiFetch<ProfileDTO>('/api/me/profile/new/now-playing', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function putQA(items: QAItemDTO[]): Promise<ProfileDTO> {
  return apiFetch<ProfileDTO>('/api/me/profile/new/qa', {
    method: 'PUT',
    body: JSON.stringify(items),
  });
}

export async function putLinks(items: LinkDTO[]): Promise<ProfileDTO> {
  return apiFetch<ProfileDTO>('/api/me/profile/new/links', {
    method: 'PUT',
    body: JSON.stringify(items),
  });
}

export async function publishProfile(): Promise<{ status: string; version: number }> {
  return apiFetch('/api/me/profile/new/publish', { method: 'POST' });
}

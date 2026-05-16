import { axiosInstance } from '@/providers/auth-provider/axiosInstance';
import type { ProfileDTO, ProfilePatch, SectionEntry, PinnedDTO, NowDTO, QAItemDTO, LinkDTO } from './types';

const PUBLIC_API = process.env.NEXT_PUBLIC_ROOT_API_URL ?? 'http://127.0.0.1:8010';

// Public read uses plain fetch (SSR-compatible, no auth needed)
export async function fetchPublicProfile(username: string): Promise<ProfileDTO> {
  const res = await fetch(`${PUBLIC_API}/api/profiles/${username}`, {
    next: { revalidate: 60 },
  } as RequestInit);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json() as Promise<ProfileDTO>;
}

// All owner-write calls go through axiosInstance (handles Bearer token + refresh)
export async function fetchMyProfile(): Promise<ProfileDTO> {
  const { data } = await axiosInstance.get<ProfileDTO>('/api/me/profile/new');
  return data;
}

// Translate DTO camelCase keys to backend snake_case before sending
const DTO_TO_BACKEND: Record<string, string> = {
  displayName: 'display_name',
  bio:         'bio_markdown',
  status:      'right_now',
};

function toBackendKeys(patch: ProfilePatch): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(patch).map(([k, v]) => [DTO_TO_BACKEND[k] ?? k, v])
  );
}

export async function patchMyProfile(patch: ProfilePatch): Promise<ProfileDTO> {
  const { data } = await axiosInstance.patch<ProfileDTO>('/api/me/profile/new', toBackendKeys(patch));
  return data;
}

export async function putSections(layout: SectionEntry[]): Promise<ProfileDTO> {
  const { data } = await axiosInstance.put<ProfileDTO>('/api/me/profile/new/sections', { layout });
  return data;
}

export async function putPinned(body: Omit<PinnedDTO, 'cover'>): Promise<ProfileDTO> {
  const { data } = await axiosInstance.put<ProfileDTO>('/api/me/profile/new/pinned', body);
  return data;
}

export async function putNowPlaying(body: Partial<NowDTO>): Promise<ProfileDTO> {
  const { data } = await axiosInstance.put<ProfileDTO>('/api/me/profile/new/now-playing', body);
  return data;
}

export async function putQA(items: QAItemDTO[]): Promise<ProfileDTO> {
  const { data } = await axiosInstance.put<ProfileDTO>('/api/me/profile/new/qa', items);
  return data;
}

export async function putLinks(items: LinkDTO[]): Promise<ProfileDTO> {
  const { data } = await axiosInstance.put<ProfileDTO>('/api/me/profile/new/links', items);
  return data;
}

export async function publishProfile(): Promise<{ status: string; version: number }> {
  const { data } = await axiosInstance.post('/api/me/profile/new/publish');
  return data;
}

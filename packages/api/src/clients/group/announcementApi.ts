// packages/api/src/clients/group/announcementApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export type AnnouncementPriority = "critical" | "high" | "normal";

export interface GroupAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  author_name: string | null;
  author_avatar: string | null;
  is_expired: boolean;
  cta_text: string;
  cta_url: string;
  source_type: string | null;
  also_send_notification: boolean;
  notification_sent_at: string | null;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  position?: number;
  expires_at?: string | null;
  cta_text?: string;
  cta_url?: string;
  also_send_notification?: boolean;
}

export async function fetchAnnouncements(groupSlug: string): Promise<GroupAnnouncement[]> {
  const res = await axiosInstance.get<GroupAnnouncement[]>(
    `/api/groups/${groupSlug}/announcements/`
  );
  return res.data;
}

export async function fetchVisibleQueue(groupSlug: string): Promise<GroupAnnouncement[]> {
  const res = await axiosInstance.get<GroupAnnouncement[]>(
    `/api/groups/${groupSlug}/announcements/visible-queue/`
  );
  return res.data;
}

export async function createAnnouncement(
  groupSlug: string,
  payload: CreateAnnouncementPayload
): Promise<GroupAnnouncement> {
  const res = await axiosInstance.post<GroupAnnouncement>(
    `/api/groups/${groupSlug}/announcements/`,
    payload
  );
  return res.data;
}

export async function updateAnnouncement(
  groupSlug: string,
  id: string,
  payload: Partial<CreateAnnouncementPayload> & { is_active?: boolean; position?: number }
): Promise<GroupAnnouncement> {
  const res = await axiosInstance.patch<GroupAnnouncement>(
    `/api/groups/${groupSlug}/announcements/${id}/`,
    payload
  );
  return res.data;
}

export async function deleteAnnouncement(groupSlug: string, id: string): Promise<void> {
  await axiosInstance.delete(`/api/groups/${groupSlug}/announcements/${id}/`);
}

export async function dismissAnnouncement(
  groupSlug: string,
  id: string
): Promise<{ result: "snooze" | "permanent"; snoozed_until: string | null }> {
  const res = await axiosInstance.post(
    `/api/groups/${groupSlug}/announcements/${id}/dismiss/`
  );
  return res.data;
}

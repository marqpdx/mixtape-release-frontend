import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import type {
  GroupPulse,
  Notification,
  NotificationListResponse,
  NotificationPreference,
  NotificationSummary,
} from "@mixtape/core/types/activityTypes";

export interface FetchNotificationsOptions {
  bucket?: string;
  is_read?: boolean;
  cursor?: string | null;
}

function extractCursor(nextUrl: string | null | undefined): string | null {
  if (!nextUrl) return null;
  try {
    const url = new URL(nextUrl, "http://localhost");
    return url.searchParams.get("cursor");
  } catch {
    return null;
  }
}

export async function fetchNotifications(
  options: FetchNotificationsOptions = {}
): Promise<NotificationListResponse> {
  const params = new URLSearchParams();
  if (options.bucket) params.append("bucket", options.bucket);
  if (typeof options.is_read === "boolean") {
    params.append("is_read", options.is_read ? "true" : "false");
  }
  if (options.cursor) params.append("cursor", options.cursor);

  const url = `/api/activity/${params.toString() ? `?${params.toString()}` : ""}`;
  const response = await axiosInstance.get(url);

  const data = response.data as { results?: Notification[]; next?: string | null; previous?: string | null };
  return {
    results: data.results || [],
    next: data.next ?? null,
    previous: data.previous ?? null,
    nextCursor: extractCursor(data.next),
  };
}

export async function fetchNotificationSummary(): Promise<NotificationSummary> {
  const response = await axiosInstance.get<NotificationSummary>("/api/activity/summary");
  return response.data;
}

export async function markNotificationsRead(ids: string[]): Promise<{ updated: number }> {
  const response = await axiosInstance.post<{ updated: number }>(
    "/api/activity/mark-read",
    { ids }
  );
  return response.data;
}

export async function markAllNotificationsRead(bucket?: string): Promise<{ updated: number }> {
  const url = bucket ? `/api/activity/mark-all-read?bucket=${bucket}` : "/api/activity/mark-all-read";
  const response = await axiosInstance.post<{ updated: number }>(url);
  return response.data;
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await axiosInstance.delete(`/api/activity/${notificationId}`);
}

export async function fetchNotificationPreferences(): Promise<NotificationPreference[]> {
  const response = await axiosInstance.get<NotificationPreference[]>("/api/activity/preferences");
  return response.data;
}

export async function upsertNotificationPreference(
  data: Omit<NotificationPreference, "id">
): Promise<NotificationPreference> {
  const response = await axiosInstance.post<NotificationPreference>("/api/activity/preferences", data);
  return response.data;
}

export async function fetchGroupPulse(): Promise<Record<string, GroupPulse>> {
  const response = await axiosInstance.get<Record<string, GroupPulse>>("/api/activity/group-pulse");
  return response.data;
}

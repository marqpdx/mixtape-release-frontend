import type { IsoDateString } from "./groupTypes";

export type NotificationBucket = "messages" | "activity" | "system";
export type NotificationLevel = "mute" | "digest" | "realtime";
export type NotificationPriority = "critical" | "normal" | "low";

export interface Notification {
  id: string;
  bucket: NotificationBucket;
  level: NotificationLevel;
  priority: NotificationPriority;
  aggregate_count: number;
  last_occurred_at: IsoDateString;
  is_read: boolean;
  is_seen: boolean;
  dedupe_key: string;
  aggregate_key: string;
  action_code?: string;
  action_channel?: string;
  actor_name?: string;
  object_name?: string;
  action_url?: string;
  verb?: string;
}

export interface NotificationSummary {
  messages_unread_by_conversation: Record<string, number>;
  notifications_unread_count: number;
  mentions_unread_count: number;
  notifications_unread_by_bucket: Record<string, number>;
}

export interface NotificationPreference {
  id: string;
  bucket?: NotificationBucket | null;
  activity_code?: string | null;
  level: NotificationLevel;
}

export interface NotificationListResponse {
  results: Notification[];
  next: string | null;
  previous: string | null;
  nextCursor: string | null;
}

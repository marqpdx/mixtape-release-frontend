import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

export interface ReentryItem {
  kind: "reading" | "draft";
  id: string;
  title: string;
  slug: string;
  status: string;
}

export interface ReentryResponse {
  items: ReentryItem[];
}

export interface SignalMarkerItem {
  id: string;
  piece_id: string;
  piece_title: string;
  piece_slug: string;
  label: string;
  body: string;
  status: string;
  created_at: string;
}

export interface SignalMarkerGroup {
  signal: string;
  label: string;
  symbol: string;
  items: SignalMarkerItem[];
}

export interface FlaggedDart {
  id: string;
  piece_id: string;
  piece_title: string;
  piece_slug: string;
  note_text: string;
  selected_text: string;
  created_at: string;
}

export interface FlaggedReread {
  id: string;
  piece_id: string;
  piece_title: string;
  piece_slug: string;
  last_read_at: string | null;
}

export interface SignalsResponse {
  markers: SignalMarkerGroup[];
  flagged_darts: FlaggedDart[];
  flagged_rereads: FlaggedReread[];
}

export interface OrientationInitiative {
  id: string;
  title: string;
  status: string;
  updated_at: string;
}

export interface OrientationGroup {
  id: string;
  title: string;
  slug: string;
  group_type: string;
  updated_at: string;
}

export interface OrientationResponse {
  initiatives: OrientationInitiative[];
  groups: OrientationGroup[];
}

export interface StaleDraft {
  id: string;
  title: string;
  slug: string;
  updated_at: string;
  days_stale: number;
}

export interface OverdueReminder {
  id: string;
  title: string;
  body: string;
  remind_at: string;
  days_overdue: number;
}

export interface UnresolvedQuestion {
  id: string;
  piece_id: string;
  piece_title: string;
  piece_slug: string;
  label: string;
  body: string;
  created_at: string;
}

export interface StewardshipResponse {
  stale_drafts: StaleDraft[];
  overdue_reminders: OverdueReminder[];
  unresolved_questions: UnresolvedQuestion[];
  stale_threshold_days: number;
}

export async function fetchReentry(): Promise<ReentryResponse> {
  const res = await axiosInstance.get<ReentryResponse>("/api/console/reentry/");
  return res.data;
}

export async function fetchSignals(): Promise<SignalsResponse> {
  const res = await axiosInstance.get<SignalsResponse>("/api/console/signals/");
  return res.data;
}

export async function fetchOrientation(): Promise<OrientationResponse> {
  const res = await axiosInstance.get<OrientationResponse>("/api/console/orientation/");
  return res.data;
}

export async function fetchStewardship(): Promise<StewardshipResponse> {
  const res = await axiosInstance.get<StewardshipResponse>("/api/console/stewardship/");
  return res.data;
}

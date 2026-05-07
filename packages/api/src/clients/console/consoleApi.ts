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
  capture_counts: Record<string, number>;
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

// ---------------------------------------------------------------------------
// HubCapture
// ---------------------------------------------------------------------------

export type HubCaptureKind = "fix" | "need_more" | "remind" | "note";
export type HubCaptureStatus = "open" | "resolved" | "promoted";

export interface HubCapture {
  id: string;
  kind: HubCaptureKind;
  body: string;
  status: HubCaptureStatus;
  group_id: string | null;
  remind_at: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface HubCapturesResponse {
  captures: HubCapture[];
}

export async function fetchHubCaptures(
  kind: HubCaptureKind,
  groupSlug?: string,
): Promise<HubCapturesResponse> {
  const params: Record<string, string> = { kind, status: "open" };
  if (groupSlug) params.group = groupSlug;
  const res = await axiosInstance.get<HubCapturesResponse>("/api/console/hub/captures/", { params });
  return res.data;
}

export async function resolveHubCapture(captureId: string): Promise<HubCapture> {
  const res = await axiosInstance.patch<HubCapture>(
    `/api/console/hub/captures/${captureId}/`,
    { status: "resolved" },
  );
  return res.data;
}

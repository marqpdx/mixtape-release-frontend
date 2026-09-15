// packages/api/src/clients/studio/studioApi.ts

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

// ============================================================================
// Types
// ============================================================================

export interface StudioActivityItem {
  id: string;
  verb: string;
  summary: string;
  group_slug: string;
  timestamp: string | null;
}

export interface StudioContentItem {
  id: string;
  title: string;
  status: string;
  updated_at: string | null;
}

export type ClioDismissMode = "session" | "permanent" | "remind_later";

export interface ClioPrompt {
  message: string;
  action_label: string;
  action_context: string;
  dismissible: true;
}

export interface PersonalStudioResponse {
  activity: StudioActivityItem[];
  my_content: StudioContentItem[];
  clio_prompt: ClioPrompt | null;
  recurring_actions: RecurringActionItem[];
}

export interface PersonalGroupItem {
  slug: string;
  name: string;
  role: "admin" | "member";
  unread_count: number;
  pending_count: number;
}

export interface GroupPulseMetrics {
  active_threads: number;
  pending_approvals: number;
  new_members: number;
  loom_ops_in_flight: number;
}

export interface RecurringActionItem {
  id: string;
  title: string;
  description: string;
  recurrence_rule: string;
  next_due_at: string;
  last_triggered_at: string | null;
  suggested_verb: string;
  suggested_label: string;
  is_active?: boolean;
  is_overdue?: boolean;
  /** Present only in personal studio digest — identifies ownership context */
  owner_type?: "member" | "group";
  group_slug?: string | null;
}

export interface RecurringActionCreateInput {
  title: string;
  description?: string;
  recurrence_rule: string;
  next_due_at: string;
  suggested_verb?: string;
  suggested_label?: string;
  suggested_context?: Record<string, string>;
}

export type RecurringActionUpdateInput = Partial<RecurringActionCreateInput>;

export const INTENT_TAGS = [
  "reminder", "recipe", "contact", "reference", "list",
  "idea", "link", "question", "note",
] as const;

export type IntentTag = typeof INTENT_TAGS[number];

export interface ScrapItem {
  id: string;
  body: string;
  intent_tag: IntentTag;
  labels: string[];
  status: "raw" | "reviewed" | "promoted" | "archived";
  remind_at: string | null;
  created_at: string | null;
}

export interface ClioSessionResponse {
  scraps: ScrapItem[];
  context: string;
}

export interface ScrapUpdateInput {
  intent_tag?: IntentTag;
  labels?: string[];
  status?: "reviewed" | "archived";
  remind_at?: string;
}

export interface GroupPulseResponse {
  metrics: GroupPulseMetrics;
  activity: StudioActivityItem[];
  recurring_actions: RecurringActionItem[];
}

export interface CanonMetrics {
  canon: number;
  working: number;
  needs_review: number;
  stale: number;
}

export interface CanonDocItem {
  id: string;
  title: string;
  folder_path: string;
  status: string;
  updated_at: string | null;
}

export interface CanonPathBucket {
  path: string;
  doc_count: number;
}

export interface GroupCanonResponse {
  metrics: CanonMetrics;
  recently_updated: CanonDocItem[];
  library_by_path: CanonPathBucket[];
}

export interface CommandMetrics {
  ops_in_flight: number;
  awaiting_approval: number;
  schema_pass_rate: number | null;
}

export interface ActiveOp {
  id: string;
  tool_name: string;
  verb: string;
  description: string;
  execution_mode: string;
  status: string;
  created_at: string | null;
}

export interface GroupCommandResponse {
  metrics: CommandMetrics;
  active_ops: ActiveOp[];
}

export interface ClientData {
  id: string;
  group_slug: string;
  group_title: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  website: string;
  business_type: string;
  prospect_slug: string | null;
  created_at: string | null;
}

export interface ProspectData {
  id: string;
  slug: string;
  stage: string;
  contact_name: string;
  contact_email: string;
}

export interface GroupClientsResponse {
  client: ClientData | null;
  prospect: ProspectData | null;
}

// ============================================================================
// Personal Studio
// ============================================================================

export async function fetchPersonalStudio(): Promise<PersonalStudioResponse> {
  const { data } = await axiosInstance.get("/api/studio/personal");
  return data;
}

export async function fetchPersonalGroups(): Promise<PersonalGroupItem[]> {
  const { data } = await axiosInstance.get("/api/studio/personal/groups");
  return data;
}

export async function dismissClioPrompt(mode: ClioDismissMode): Promise<void> {
  await axiosInstance.post("/api/studio/personal/clio/dismiss", { mode });
}

// ============================================================================
// Group Studio
// ============================================================================

export async function fetchStudioGroupPulse(groupSlug: string): Promise<GroupPulseResponse> {
  const { data } = await axiosInstance.get(`/api/studio/groups/${groupSlug}/pulse`);
  return data;
}

export async function fetchGroupCanon(groupSlug: string): Promise<GroupCanonResponse> {
  const { data } = await axiosInstance.get(`/api/studio/groups/${groupSlug}/canon`);
  return data;
}

export async function fetchGroupCommand(groupSlug: string): Promise<GroupCommandResponse> {
  const { data } = await axiosInstance.get(`/api/studio/groups/${groupSlug}/command`);
  return data;
}

export async function fetchGroupClients(groupSlug: string): Promise<GroupClientsResponse> {
  const { data } = await axiosInstance.get(`/api/studio/groups/${groupSlug}/clients`);
  return data;
}

// ============================================================================
// RecurringAction CRUD
// ============================================================================

export async function fetchGroupRecurringActions(groupSlug: string): Promise<RecurringActionItem[]> {
  const { data } = await axiosInstance.get(`/api/studio/groups/${groupSlug}/recurring-actions`);
  return data;
}

export async function createRecurringAction(
  groupSlug: string,
  input: RecurringActionCreateInput,
): Promise<RecurringActionItem> {
  const { data } = await axiosInstance.post(`/api/studio/groups/${groupSlug}/recurring-actions`, input);
  return data;
}

export async function updateRecurringAction(
  groupSlug: string,
  id: string,
  input: RecurringActionUpdateInput,
): Promise<RecurringActionItem> {
  const { data } = await axiosInstance.patch(`/api/studio/groups/${groupSlug}/recurring-actions/${id}`, input);
  return data;
}

export async function deleteRecurringAction(groupSlug: string, id: string): Promise<void> {
  await axiosInstance.delete(`/api/studio/groups/${groupSlug}/recurring-actions/${id}`);
}

// ============================================================================
// Clio session
// ============================================================================

export async function fetchClioSession(ctx: string): Promise<ClioSessionResponse> {
  const params = new URLSearchParams({ ctx });
  const { data } = await axiosInstance.get(`/api/studio/clio/session?${params.toString()}`);
  return data;
}

export async function updateClioScrap(id: string, input: ScrapUpdateInput): Promise<ScrapItem> {
  const { data } = await axiosInstance.patch(`/api/studio/clio/scraps/${id}`, input);
  return data;
}

// ============================================================================
// Personal RecurringAction CRUD
// ============================================================================

export async function fetchPersonalRecurringActions(): Promise<RecurringActionItem[]> {
  const { data } = await axiosInstance.get("/api/studio/personal/recurring-actions");
  return data;
}

export async function createPersonalRecurringAction(
  input: RecurringActionCreateInput,
): Promise<RecurringActionItem> {
  const { data } = await axiosInstance.post("/api/studio/personal/recurring-actions", input);
  return data;
}

export async function updatePersonalRecurringAction(
  id: string,
  input: RecurringActionUpdateInput,
): Promise<RecurringActionItem> {
  const { data } = await axiosInstance.patch(`/api/studio/personal/recurring-actions/${id}`, input);
  return data;
}

export async function deletePersonalRecurringAction(id: string): Promise<void> {
  await axiosInstance.delete(`/api/studio/personal/recurring-actions/${id}`);
}

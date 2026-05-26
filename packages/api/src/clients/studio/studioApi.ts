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

export interface PersonalStudioResponse {
  activity: StudioActivityItem[];
  my_content: StudioContentItem[];
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

export interface GroupPulseResponse {
  metrics: GroupPulseMetrics;
  activity: StudioActivityItem[];
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

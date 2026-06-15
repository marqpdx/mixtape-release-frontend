// packages/api/src/lib/group/groupApi.ts

import {
  Group,
  GroupMembership,
  GroupsListResponse,
  GroupMembersResponse,
  GroupCreateFormData,
  GroupUpdateFormData,
  GroupOverviewLayout,
  CircleDeliverableIntent,
  DeliverableType,
  DeliverableStatus,
} from '@mixtape/core/types/groupTypes';
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { unwrapListResponse } from '../../lib/utils';

// ============================================================================
// GROUP API FUNCTIONS
// ============================================================================

export interface FetchGroupsOptions {
  group_type?: string;
  is_active?: boolean;
  search?: string;
  ordering?: string;
  exclude?: string[];
  limit?: number;
  offset?: number;
}

export interface FetchGroupMembersOptions {
  role?: string;
  status?: string;  // 'active', 'pending', 'banned', 'evicted'
  ordering?: string;
  limit?: number;
  offset?: number;
}

export interface GroupWelcomePin {
  placement_id: string;
  audience: 'group' | 'community' | 'public';
  piece: {
    id: string;
    slug: string;
    title: string;
    excerpt?: string | null;
    body_json?: unknown;
    published_at?: string | null;
    author_name?: string | null;
  };
  display?: {
    title?: string;
    excerpt?: string;
    body_json?: unknown;
  };
}

/**
 * Fetch group overview layout
 */
export async function fetchGroupOverviewLayout(groupSlug: string): Promise<GroupOverviewLayout> {
  const response = await axiosInstance.get<GroupOverviewLayout>(
    `/api/groups/${groupSlug}/overview-layout`
  );
  return response.data;
}

/**
 * Update group overview layout
 */
export async function updateGroupOverviewLayout(
  groupSlug: string,
  layout: GroupOverviewLayout
): Promise<GroupOverviewLayout> {
  const response = await axiosInstance.put<GroupOverviewLayout>(
    `/api/groups/${groupSlug}/overview-layout`,
    layout
  );
  return response.data;
}

/**
 * Fetch all groups (admin/steward view)
 */
export async function fetchGroups(options: FetchGroupsOptions = {}): Promise<Group[]> {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (key === "exclude" && Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry) {
          params.append("exclude", entry);
        }
      });
      return;
    }
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const url = `/api/groups/${queryString ? `?${queryString}` : ''}`;

  const response = await axiosInstance.get<GroupsListResponse>(url);
  return unwrapListResponse<Group>(response.data);
}

/**
 * Fetch user's groups (groups where current user is a member)
 */
export async function fetchUserGroups(): Promise<Group[]> {
  const response = await axiosInstance.get<GroupsListResponse>('/api/groups/my');
  return unwrapListResponse<Group>(response.data);
}

/**
 * Fetch the default group (from server settings)
 */
export async function fetchDefaultGroup(): Promise<Group | null> {
  try {
    const response = await axiosInstance.get<Group>('/api/groups/default');
    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch a single group by slug
 */
export async function fetchGroup(slug: string): Promise<Group> {
  const response = await axiosInstance.get<Group>(`/api/groups/${slug}`);
  return response.data;
}

/**
 * Fetch the welcome pin placement for a group
 */
export async function fetchGroupWelcomePin(groupSlug: string): Promise<GroupWelcomePin | null> {
  const response = await axiosInstance.get(`/api/groups/${groupSlug}/welcome`, {
    validateStatus: (status) => status === 204 || (status >= 200 && status < 300),
  });
  if (response.status === 204 || !response.data) {
    return null;
  }
  return response.data as GroupWelcomePin;
}

/**
 * Create a new group
 */
export async function createGroup(data: GroupCreateFormData): Promise<Group> {
  const response = await axiosInstance.post<Group>('/api/groups/', data);
  return response.data;
}

/**
 * Update a group
 */
export async function updateGroup(slug: string, updates: GroupUpdateFormData): Promise<Group> {
  const response = await axiosInstance.patch<Group>(`/api/groups/${slug}`, updates);
  return response.data;
}

/**
 * Delete a group (soft delete)
 */
export async function deleteGroup(slug: string): Promise<void> {
  await axiosInstance.delete(`/api/groups/${slug}`);
}

/**
 * Publish a group (remove from draft mode)
 * Note: This endpoint may not exist yet - check backend
 */
export async function publishGroup(slug: string): Promise<Group> {
  const response = await axiosInstance.post<Group>(`/api/groups/${slug}/publish`);
  return response.data;
}

// ============================================================================
// GROUP MEMBERSHIP API FUNCTIONS
// ============================================================================

/**
 * Fetch members of a specific group
 */
export async function fetchGroupMembers(
  groupSlug: string,
  options: FetchGroupMembersOptions = {}
): Promise<GroupMembership[]> {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) {
      params.append(key, value.toString());
    }
  });

  const queryString = params.toString();
  const url = `/api/groups/${groupSlug}/members${queryString ? `?${queryString}` : ''}`;

  const response = await axiosInstance.get<GroupMembersResponse>(url);
  return unwrapListResponse<GroupMembership>(response.data);
}

/**
 * Add a member to a group
 * Note: Check backend for actual endpoint structure
 */
export async function addGroupMember(
  groupSlug: string,
  userId: string,
  role: string = 'member'
): Promise<GroupMembership> {
  const response = await axiosInstance.post<GroupMembership>(
    `/api/groups/${groupSlug}/members`,
    { user_id: userId, role }
  );
  return response.data;
}

/**
 * Update a group member's role
 */
export async function updateGroupMember(
  groupSlug: string,
  memberId: string,
  updates: { role?: string; is_active?: boolean }
): Promise<GroupMembership> {
  const response = await axiosInstance.patch<GroupMembership>(
    `/api/groups/${groupSlug}/members/${memberId}`,
    updates
  );
  return response.data;
}

/**
 * Remove a member from a group
 */
export async function removeGroupMember(
  groupSlug: string,
  memberId: string
): Promise<void> {
  await axiosInstance.delete(`/api/groups/${groupSlug}/members/${memberId}`);
}

// ============================================================================
// GROUP INVITATION API FUNCTIONS
// ============================================================================

export interface InviteToGroupData {
  email: string;
  message?: string;
}

/**
 * Invite a user to a group by email
 */
export async function inviteToGroup(
  groupSlug: string,
  data: InviteToGroupData
): Promise<{ success: boolean; message: string }> {
  const response = await axiosInstance.post<{ success: boolean; message: string }>(
    `/api/groups/${groupSlug}/invite`,
    data
  );
  return response.data;
}

// --- Circles (group-scoped) ---

/**
 * Fetch pending invitations for a group
 */
export async function fetchGroupInvitations(groupSlug: string): Promise<any[]> {
  const response = await axiosInstance.get<any[]>(`/api/groups/${groupSlug}/invitations`);
  return response.data;
}

// ============================================================================
// JOIN REQUESTS API FUNCTIONS
// ============================================================================

export interface JoinRequest {
  id: number;
  invited_email: string | null;
  invited_user: string | null;
  message: string;
  token: string;
}

export async function fetchJoinRequests(groupSlug: string): Promise<JoinRequest[]> {
  const response = await axiosInstance.get<JoinRequest[]>(
    `/api/groups/${groupSlug}/join-requests`
  );
  return response.data;
}

export async function respondToJoinRequest(
  groupSlug: string,
  invitationId: number,
  action: "accept" | "decline"
): Promise<{ detail: string }> {
  const response = await axiosInstance.post(
    `/api/groups/${groupSlug}/join-requests/${invitationId}/respond`,
    { action }
  );
  return response.data;
}

// --- Circles (group-scoped) ---

export async function createGroupCircle(
  sponsorGroupSlug: string,
  data: GroupCreateFormData
): Promise<Group> {
  // Sponsor-scoped circles endpoint
  const response = await axiosInstance.post<Group>(
    `/api/groups/${sponsorGroupSlug}/circles`,
    data
  );
  return response.data;
}

export async function fetchGroupCircleDetail(
  parentSlug: string,
  circleSlug: string
): Promise<Group> {
  const response = await axiosInstance.get<Group>(
    `/api/groups/${parentSlug}/circles/${circleSlug}`
  );
  return response.data;
}

export async function fetchGroupCircles(
  sponsorGroupSlug: string,
  options: FetchGroupsOptions = {}
): Promise<Group[]> {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) params.append(key, value.toString());
  });

  const qs = params.toString();
  const url = `/api/groups/${sponsorGroupSlug}/circles${qs ? `?${qs}` : ""}`;

  const response = await axiosInstance.get<GroupsListResponse>(url);
  return unwrapListResponse<Group>(response.data);
}

// ============================================================================
// CIRCLE DECORATOR API (CR-E)
// ============================================================================

export interface ApplyDecoratorResponse {
  applied: string;
  deliverable_intent: CircleDeliverableIntent | null;
}

export async function applyCircleDecorator(
  circleSlug: string,
  decoratorCode: string,
  deliverableType: DeliverableType
): Promise<ApplyDecoratorResponse> {
  const response = await axiosInstance.post<ApplyDecoratorResponse>(
    `/api/groups/${circleSlug}/apply-decorator`,
    { decorator_code: decoratorCode, deliverable_type: deliverableType }
  );
  return response.data;
}

export async function applyCircleProfile(
  circleSlug: string,
  profileCode: string,
  deliverableType: DeliverableType
): Promise<ApplyDecoratorResponse> {
  const response = await axiosInstance.post<ApplyDecoratorResponse>(
    `/api/groups/${circleSlug}/apply-decorator`,
    { profile_code: profileCode, deliverable_type: deliverableType }
  );
  return response.data;
}

export async function removeCircleDecorator(
  circleSlug: string,
  decoratorCode: string
): Promise<void> {
  await axiosInstance.delete(`/api/groups/${circleSlug}/decorators/${decoratorCode}`);
}

export async function fetchCircleDeliverableIntent(
  circleSlug: string
): Promise<CircleDeliverableIntent | null> {
  const response = await axiosInstance.get(
    `/api/groups/${circleSlug}/deliverable-intent`,
    { validateStatus: (s) => s === 204 || (s >= 200 && s < 300) }
  );
  if (response.status === 204 || !response.data) return null;
  return response.data as CircleDeliverableIntent;
}

export async function updateCircleDeliverableIntent(
  circleSlug: string,
  updates: { deliverable_type?: DeliverableType; deliverable_status?: DeliverableStatus }
): Promise<CircleDeliverableIntent> {
  const response = await axiosInstance.patch<CircleDeliverableIntent>(
    `/api/groups/${circleSlug}/deliverable-intent`,
    updates
  );
  return response.data;
}

// ============================================================================
// EXPORT API OBJECT (alternative pattern)
// ============================================================================

// ============================================================================
// GROUP FILE API FUNCTIONS
// ============================================================================

export interface GroupFile {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  origin: string;
  created_at: string;
}

export async function fetchGroupFiles(groupSlug: string): Promise<GroupFile[]> {
  const response = await axiosInstance.get(`/api/groups/${groupSlug}/files/`);
  return response.data;
}

export async function deleteGroupFile(groupSlug: string, sourceFileId: string): Promise<void> {
  await axiosInstance.delete(`/api/groups/${groupSlug}/files/${sourceFileId}/`);
}

export async function fetchMyFiles(): Promise<GroupFile[]> {
  const response = await axiosInstance.get('/api/me/files/');
  return response.data;
}

export async function deleteMyFile(sourceFileId: string): Promise<void> {
  await axiosInstance.delete(`/api/me/files/${sourceFileId}/`);
}

export async function uploadGroupFile(
  groupSlug: string,
  file: File
): Promise<{ source_file_id: string; filename: string; status: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axiosInstance.post(
    `/api/groups/${groupSlug}/files/upload/`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
}

export const groupApi = {
  // Groups
  fetchGroups,
  fetchUserGroups,
  fetchGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  publishGroup,
  fetchGroupOverviewLayout,
  updateGroupOverviewLayout,

  // Members
  fetchGroupMembers,
  addGroupMember,
  updateGroupMember,
  removeGroupMember,

  // Circles
  fetchGroupCircles,
  fetchGroupCircleDetail,

  // Circle decorators (CR-E)
  applyCircleDecorator,
  applyCircleProfile,
  removeCircleDecorator,
  fetchCircleDeliverableIntent,
  updateCircleDeliverableIntent,

  // Invitations
  inviteToGroup,
  fetchGroupInvitations,

  // Join Requests
  fetchJoinRequests,
  respondToJoinRequest,

  // Files
  fetchGroupFiles,
  uploadGroupFile,
  deleteGroupFile,
  fetchMyFiles,
  deleteMyFile,
};

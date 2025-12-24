// src/lib/group/groupApi.ts

import {
  Group,
  GroupMembership,
  GroupsListResponse,
  GroupMembersResponse,
  GroupCreateFormData,
  GroupUpdateFormData,
} from '@/types/groupTypes';
import { axiosInstance } from '@/providers/auth-provider/axiosInstance';
import { unwrapListResponse } from '@/lib/api/utils';

// ============================================================================
// GROUP API FUNCTIONS
// ============================================================================

export interface FetchGroupsOptions {
  group_type?: string;
  is_active?: boolean;
  search?: string;
  ordering?: string;
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

/**
 * Fetch all groups (admin/steward view)
 */
export async function fetchGroups(options: FetchGroupsOptions = {}): Promise<Group[]> {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
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
 * Fetch a single group by slug
 */
export async function fetchGroup(slug: string): Promise<Group> {
  const response = await axiosInstance.get<Group>(`/api/groups/${slug}`);
  return response.data;
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
// EXPORT API OBJECT (alternative pattern)
// ============================================================================

export const groupApi = {
  // Groups
  fetchGroups,
  fetchUserGroups,
  fetchGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  publishGroup,

  // Members
  fetchGroupMembers,
  addGroupMember,
  updateGroupMember,
  removeGroupMember,

  // Invitations
  inviteToGroup,
  fetchGroupInvitations,
};

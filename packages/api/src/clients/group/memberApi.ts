// src/lib/group/memberApi.ts

import {
  GroupMembership,
  GroupMembersResponse,
  GroupRole,
  MemberType,
} from '@mixtape/core/types/groupTypes';
import { axiosInstance } from '../../lib/axiosInstance';
import { unwrapListResponse } from '../../lib/utils';

// ============================================================================
// OPTIONS INTERFACES
// ============================================================================

export interface FetchMembersOptions {
  role?: GroupRole;
  status?: string; // 'active', 'pending', 'banned', 'evicted'
  member_type?: MemberType;
  search?: string;
  ordering?: string;
  limit?: number;
  offset?: number;
}

export interface AddMemberData {
  user_id: string;
  role?: GroupRole;
}

export interface UpdateMemberData {
  role?: GroupRole;
  is_active?: boolean;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch members of a specific group
 */
export async function fetchMembers(
  groupSlug: string,
  options: FetchMembersOptions = {}
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
 * Fetch a single member by ID
 */
export async function fetchMember(
  groupSlug: string,
  memberId: string
): Promise<GroupMembership> {
  const response = await axiosInstance.get<GroupMembership>(
    `/api/groups/${groupSlug}/members/${memberId}`
  );
  return response.data;
}

/**
 * Add a member to a group
 */
export async function addMember(
  groupSlug: string,
  data: AddMemberData
): Promise<GroupMembership> {
  const response = await axiosInstance.post<GroupMembership>(
    `/api/groups/${groupSlug}/members`,
    data
  );
  return response.data;
}

/**
 * Update a group member (role, status, etc.)
 */
export async function updateMember(
  groupSlug: string,
  memberId: string,
  updates: UpdateMemberData
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
export async function removeMember(
  groupSlug: string,
  memberId: string
): Promise<void> {
  await axiosInstance.delete(`/api/groups/${groupSlug}/members/${memberId}`);
}

// ============================================================================
// EXPORT API OBJECT (alternative pattern)
// ============================================================================

export const memberApi = {
  fetchMembers,
  fetchMember,
  addMember,
  updateMember,
  removeMember,
};

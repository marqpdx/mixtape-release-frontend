//src/lib/group/groupApi.ts

import {
  Group,
  GroupMembership,
  GroupsListResponse,
  GroupMembersResponse,
  GroupCreateFormData,
  GroupUpdateFormData,
} from '@/types/groupTypes';
import { getAccessToken } from '@/lib/auth/tokenStorage';

const API_BASE = process.env.NEXT_PUBLIC_ROOT_API_URL;

/**
 * Get headers with auth token
 */
function getAuthHeaders(): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Handle API response and errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API request failed: ${response.status}`;

    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.detail || errorData.error || errorMessage;
    } catch {
      // If not JSON, use the text
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

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
  const url = `${API_BASE}/api/groups${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const data: GroupsListResponse = await handleResponse(response);
  return data.results || data as unknown as Group[];
}

/**
 * Fetch user's groups (groups where current user is a member)
 */
export async function fetchUserGroups(): Promise<Group[]> {
  const url = `${API_BASE}/api/groups/my`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const data: GroupsListResponse = await handleResponse(response);
  return data.results || data as unknown as Group[];
}

/**
 * Fetch a single group by slug
 */
export async function fetchGroup(slug: string): Promise<Group> {
  const url = `${API_BASE}/api/groups/${slug}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse<Group>(response);
}

/**
 * Create a new group
 */
export async function createGroup(data: GroupCreateFormData): Promise<Group> {
  const url = `${API_BASE}/api/groups`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<Group>(response);
}

/**
 * Update a group
 */
export async function updateGroup(slug: string, updates: GroupUpdateFormData): Promise<Group> {
  const url = `${API_BASE}/api/groups/${slug}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  return handleResponse<Group>(response);
}

/**
 * Delete a group (soft delete)
 */
export async function deleteGroup(slug: string): Promise<void> {
  const url = `${API_BASE}/api/groups/${slug}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete group: ${response.status}`);
  }
}

/**
 * Publish a group (remove from draft mode)
 * Note: This endpoint may not exist yet - check backend
 */
export async function publishGroup(slug: string): Promise<Group> {
  const url = `${API_BASE}/api/groups/${slug}/publish`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse<Group>(response);
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
  const url = `${API_BASE}/api/groups/${groupSlug}/members${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  const data: GroupMembersResponse = await handleResponse(response);
  return data.results || data as unknown as GroupMembership[];
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
  const url = `${API_BASE}/api/groups/${groupSlug}/members`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ user_id: userId, role }),
  });

  return handleResponse<GroupMembership>(response);
}

/**
 * Update a group member's role
 */
export async function updateGroupMember(
  groupSlug: string,
  memberId: string,
  updates: { role?: string; is_active?: boolean }
): Promise<GroupMembership> {
  const url = `${API_BASE}/api/groups/${groupSlug}/members/${memberId}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  return handleResponse<GroupMembership>(response);
}

/**
 * Remove a member from a group
 */
export async function removeGroupMember(
  groupSlug: string,
  memberId: string
): Promise<void> {
  const url = `${API_BASE}/api/groups/${groupSlug}/members/${memberId}`;

  const response = await fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to remove member: ${response.status}`);
  }
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
  const url = `${API_BASE}/api/groups/${groupSlug}/invite`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse(response);
}

/**
 * Fetch pending invitations for a group
 */
export async function fetchGroupInvitations(groupSlug: string): Promise<any[]> {
  const url = `${API_BASE}/api/groups/${groupSlug}/invitations`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse(response);
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

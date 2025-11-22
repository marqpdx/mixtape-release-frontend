// src/lib/group/memberApi.ts

import {
  GroupMembership,
  GroupMembersResponse,
  GroupRole,
  MemberType,
} from '@/types/groupTypes';
import { getAccessToken } from '@/lib/auth/tokenStorage';

const API_BASE = process.env.NEXT_PUBLIC_ROOT_API_URL;

// ============================================================================
// HELPER FUNCTIONS (private)
// ============================================================================

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
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

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
  const url = `${API_BASE}/api/groups/${groupSlug}/members${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include', // Critical: sends cookies
  });

  const data: GroupMembersResponse = await handleResponse(response);
  return data.results || data as unknown as GroupMembership[];
}

/**
 * Fetch a single member by ID
 */
export async function fetchMember(
  groupSlug: string,
  memberId: string
): Promise<GroupMembership> {
  const url = `${API_BASE}/api/groups/${groupSlug}/members/${memberId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    credentials: 'include',
  });

  return handleResponse<GroupMembership>(response);
}

/**
 * Add a member to a group
 */
export async function addMember(
  groupSlug: string,
  data: AddMemberData
): Promise<GroupMembership> {
  const url = `${API_BASE}/api/groups/${groupSlug}/members`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data),
  });

  return handleResponse<GroupMembership>(response);
}

/**
 * Update a group member (role, status, etc.)
 */
export async function updateMember(
  groupSlug: string,
  memberId: string,
  updates: UpdateMemberData
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
export async function removeMember(
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
// EXPORT API OBJECT (alternative pattern)
// ============================================================================

export const memberApi = {
  fetchMembers,
  fetchMember,
  addMember,
  updateMember,
  removeMember,
};

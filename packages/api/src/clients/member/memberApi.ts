// packages/api/src/clients/member/memberApi.ts

/**
 * Member Profile API Client
 *
 * Handles all API calls to /api/members/ endpoints.
 * Members are users who are part of the Mixtape community with public profiles.
 */

// import { axiosInstance } from '@mixtape/api/lib/axiosInstance';
import { MemberProfile, MemberProfileUpdate } from '@mixtape/core/types/memberTypes';
import { axiosInstance } from '../../lib/axiosInstance';

/**
 * Fetch all members (public profiles)
 * GET /api/members/
 */
export const fetchMembers = async (): Promise<MemberProfile[]> => {
  const response = await axiosInstance.get<MemberProfile[]>('/api/members/');
  return response.data;
};

/**
 * Fetch a single member by username
 * GET /api/members/<username>/
 */
export const fetchMember = async (username: string): Promise<MemberProfile> => {
  const response = await axiosInstance.get<MemberProfile>(`/api/members/${username}`);
  return response.data;
};

/**
 * Fetch the current user's member profile
 * GET /api/members/me/
 *
 * Note: This endpoint may need to be added to the backend.
 * Falls back to fetching by username if available.
 */
export const fetchMyProfile = async (): Promise<MemberProfile> => {
  const response = await axiosInstance.get<MemberProfile>('/api/members/me');
  return response.data;
};

/**
 * Update a member profile
 * PATCH /api/members/<username>/
 *
 * Note: Backend currently has this commented out (Phase 2).
 * This is prepared for when it's enabled.
 */
export const updateMemberProfile = async (
  username: string,
  data: MemberProfileUpdate
): Promise<MemberProfile> => {
  const response = await axiosInstance.patch<MemberProfile>(
    `/api/members/${username}`,
    data
  );
  return response.data;
};

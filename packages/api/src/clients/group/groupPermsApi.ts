// src/api/groupPermsApi.ts
// API interface for group permissions management

import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

/**
 * Data structures (based on UI needs)
 */

export interface Permission {
  code: string;           // 'can__ManageWriting'
  name: string;           // 'Manage Writing'
  description: string;    // 'Create, edit, and manage writing pieces'
  category: 'identity' | 'capability' | 'policy';
}

export interface MemberPermissions {
  user_id: string;
  user: {
    id: string;
    username: string;
    email: string;
    profile?: {
      display_name?: string;
      avatar?: string;
    };
  };
  roles: string[];        // ['member', 'steward', 'admin']
  decorators: string[];   // ['can__ManageWriting', 'can__InviteMembers']
}

/**
 * API Endpoints (to be implemented on backend)
 */

export const groupPermsApi = {
  /**
   * GET /api/groups/{slug}/permissions/available
   * Get list of all available permissions that can be granted
   */
  getAvailablePermissions: async (groupSlug: string): Promise<Permission[]> => {
    const res = await axiosInstance.get(`/api/groups/${groupSlug}/permissions/available`);
    return res.data;
  },

  /**
   * GET /api/groups/{slug}/members/permissions
   * Get permissions for all members in the group
   */
  getMemberPermissions: async (groupSlug: string): Promise<MemberPermissions[]> => {
    const res = await axiosInstance.get(`/api/groups/${groupSlug}/members/permissions`);
    return res.data;
  },

  /**
   * POST /api/groups/{slug}/members/{userId}/permissions
   * Grant a permission to a member
   * Body: { decorator: 'can__ManageWriting' }
   *
   * Backend should:
   * - Add decorator to membership
   * - Auto-add 'steward' role if first decorator
   * - Return updated member permissions
   */
  grantPermission: async (
    groupSlug: string,
    userId: string,
    decorator: string
  ): Promise<MemberPermissions> => {
    const res = await axiosInstance.post(
      `/api/groups/${groupSlug}/members/${userId}/permissions`,
      { decorator }
    );
    return res.data;
  },

  /**
   * DELETE /api/groups/{slug}/members/{userId}/permissions/{decorator}
   * Revoke a permission from a member
   *
   * Backend should:
   * - Remove decorator from membership
   * - Auto-remove 'steward' role if no decorators left
   * - Return updated member permissions
   */
  revokePermission: async (
    groupSlug: string,
    userId: string,
    decorator: string
  ): Promise<MemberPermissions> => {
    const res = await axiosInstance.delete(
      `/api/groups/${groupSlug}/members/${userId}/permissions/${decorator}`
    );
    return res.data;
  },

  /**
   * POST /api/groups/{slug}/members/{userId}/roles
   * Grant a role to a member
   * Body: { role: 'admin' | 'steward' }
   */
  grantRole: async (
    groupSlug: string,
    userId: string,
    role: string
  ): Promise<MemberPermissions> => {
    const res = await axiosInstance.post(
      `/api/groups/${groupSlug}/members/${userId}/roles`,
      { role }
    );
    return res.data;
  },

  /**
   * GET /api/groups/{slug}/my-permissions
   * Get current user's permissions in the group
   * Used for frontend permission guards
   *
   * Returns:
   * {
   *   role: 'member' | 'steward' | 'admin',
   *   decorators: ['can__ManageWriting', ...],
   *   can: (permission: string) => boolean
   * }
   */
  getMyPermissions: async (groupSlug: string) => {
    const res = await axiosInstance.get(`/api/groups/${groupSlug}/my-permissions`);
    return res.data;
  },
};

/**
 * Backend Implementation Notes:
 *
 * 1. Available Permissions Endpoint:
 *    - Could be hardcoded or from MembershipDecorator table
 *    - For now: just return the 3 initial permissions
 *
 * 2. Member Permissions Endpoint:
 *    - Query all GroupMemberships for the group
 *    - Include user info, roles, and decorators
 *    - Filter to active memberships only
 *
 * 3. Grant Permission Logic:
 *    - membership.add_decorator(decorator_code)
 *    - if len(membership.decorators) == 1 and 'steward' not in membership.roles:
 *        membership.grant_role('steward')
 *
 * 4. Revoke Permission Logic:
 *    - membership.remove_decorator(decorator_code)
 *    - if len(membership.decorators) == 0 and 'steward' in membership.roles:
 *        membership.revoke_role('steward')
 *
 * 5. My Permissions Endpoint:
 *    - Get user's membership in group
 *    - Return role, decorators, and computed permissions
 *    - Admins: return all permissions = True
 */

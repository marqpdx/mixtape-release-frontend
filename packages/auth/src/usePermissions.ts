// packages/auth/src/usePermissions.ts
'use client';

import { useMemo } from 'react';
import { Permission, UserIdentity } from '@mixtape/core/types/auth';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  isAdmin,
  isSteward,
  isMember,
} from './permissions';

export interface UsePermissionsParams {
  user: UserIdentity | null;
  can: (permission: string) => boolean;
  canInGroup: (permission: string, groupSlug: string) => boolean;
}

/**
 * Hook for checking user permissions and roles
 *
 * @param params - User and permission check functions from auth context
 *
 * @example
 * ```tsx
 * function PostActions() {
 *   const { user, can, canInGroup } = useAuth();
 *   const permissions = usePermissions({ user, can, canInGroup });
 *
 *   return (
 *     <div>
 *       {permissions.can('create_course') && <button>Create Course</button>}
 *       {permissions.canInGroup('edit_course', 'my-group') && <button>Edit</button>}
 *       {permissions.isAdmin && <button>Admin Panel</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions({ user, can: authCan, canInGroup: authCanInGroup }: UsePermissionsParams) {

  const permissions = useMemo(() => {
    /**
     * Check if user has a specific permission globally
     * Uses the new permission system from Phase 1
     */
    const can = (permission: string): boolean => {
      return authCan(permission);
    };

    /**
     * Check if user has a permission within a specific group
     * Uses the new permission system from Phase 1
     */
    const canInGroup = (permission: string, groupSlug: string): boolean => {
      return authCanInGroup(permission, groupSlug);
    };

    /**
     * Check if user has ANY of the specified permissions (legacy)
     * @deprecated Use can() with individual checks instead
     */
    const canAny = (permissions: Permission[]): boolean => {
      return hasAnyPermission(user, permissions);
    };

    /**
     * Check if user has ALL of the specified permissions (legacy)
     * @deprecated Use can() with individual checks instead
     */
    const canAll = (permissions: Permission[]): boolean => {
      return hasAllPermissions(user, permissions);
    };

    /**
     * Get all permissions for current user (legacy)
     * @deprecated Use user.permissions.effective instead
     */
    const getAllPermissions = (): Permission[] => {
      return getUserPermissions(user);
    };

    return {
      can,
      canInGroup,
      canAny,
      canAll,
      getAllPermissions,
      isAdmin: isAdmin(user),
      isSteward: isSteward(user),
      isMember: isMember(user),
    };
  }, [user, authCan, authCanInGroup]);

  return permissions;
}

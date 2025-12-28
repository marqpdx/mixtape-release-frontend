// src/lib/auth/usePermissions.ts
'use client';

import { useMemo } from 'react';
import { Permission } from '@mixtape/core/types/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserPermissions,
  isAdmin,
  isSteward,
  isMember,
} from './permissions';

/**
 * Hook for checking user permissions and roles
 *
 * @example
 * ```tsx
 * function PostActions() {
 *   const { can, canInGroup, isAdmin } = usePermissions();
 *
 *   return (
 *     <div>
 *       {can('create_course') && <button>Create Course</button>}
 *       {canInGroup('edit_course', 'my-group') && <button>Edit</button>}
 *       {isAdmin && <button>Admin Panel</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions() {
  const { user, can: authCan, canInGroup: authCanInGroup } = useAuth();

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

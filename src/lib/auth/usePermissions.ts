// src/lib/auth/usePermissions.ts
'use client';

import { useMemo } from 'react';
import { Permission } from '@/types/auth';
import { useAuth } from './AuthContext';
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
 *   const { can, isAdmin } = usePermissions();
 *
 *   return (
 *     <div>
 *       {can('posts:write') && <button>Edit</button>}
 *       {can('posts:delete') && <button>Delete</button>}
 *       {isAdmin && <button>Admin Panel</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    /**
     * Check if user has a specific permission
     */
    const can = (permission: Permission): boolean => {
      return hasPermission(user, permission);
    };

    /**
     * Check if user has ANY of the specified permissions
     */
    const canAny = (permissions: Permission[]): boolean => {
      return hasAnyPermission(user, permissions);
    };

    /**
     * Check if user has ALL of the specified permissions
     */
    const canAll = (permissions: Permission[]): boolean => {
      return hasAllPermissions(user, permissions);
    };

    /**
     * Get all permissions for current user
     */
    const getAllPermissions = (): Permission[] => {
      return getUserPermissions(user);
    };

    return {
      can,
      canAny,
      canAll,
      getAllPermissions,
      isAdmin: isAdmin(user),
      isSteward: isSteward(user),
      isMember: isMember(user),
    };
  }, [user]);

  return permissions;
}

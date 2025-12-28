// src/lib/auth/permissions.ts

import { Role, Permission, UserIdentity } from '@mixtape/core/types/auth';

/**
 * Role-Based Access Control (RBAC) Configuration
 *
 * Maps roles to their allowed permissions.
 * This can be extended to fetch from an external authorization service.
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // Full access to everything
    'users:read',
    'users:write',
    'users:delete',
    'posts:read',
    'posts:write',
    'posts:delete',
    'posts:publish',
    'members:read',
    'members:write',
    'members:invite',
    'admin:access',
    'admin:settings',
  ],
  steward: [
    // Content management + member viewing
    'users:read',
    'posts:read',
    'posts:write',
    'posts:publish',
    'members:read',
    'members:invite',
  ],
  member: [
    // Basic read access
    'posts:read',
    'members:read',
  ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: UserIdentity | null, permission: Permission): boolean {
  if (!user) return false;

  // Superusers and staff have all permissions
  if (user.is_superuser || user.is_staff) {
    return true;
  }

  // Check role-based permissions
  return user.roles.some(role =>
    ROLE_PERMISSIONS[role]?.includes(permission) || false
  );
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(user: UserIdentity | null, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(user: UserIdentity | null, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: UserIdentity | null): Permission[] {
  if (!user) return [];

  // Superusers have all permissions
  if (user.is_superuser || user.is_staff) {
    return Object.values(ROLE_PERMISSIONS).flat();
  }

  // Collect all permissions from user's roles
  const permissions = new Set<Permission>();

  user.roles.forEach(role => {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    rolePerms.forEach(perm => permissions.add(perm));
  });

  return Array.from(permissions);
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: UserIdentity | null, role: Role): boolean {
  if (!user) return false;
  return user.roles.includes(role);
}

/**
 * Check if user is admin (staff or superuser)
 */
export function isAdmin(user: UserIdentity | null): boolean {
  if (!user) return false;
  return user.is_staff || user.is_superuser;
}

/**
 * Check if user is steward
 */
export function isSteward(user: UserIdentity | null): boolean {
  if (!user) return false;
  return hasRole(user, 'steward') || isAdmin(user);
}

/**
 * Check if user is member
 */
export function isMember(user: UserIdentity | null): boolean {
  if (!user) return false;
  return hasRole(user, 'member') || isSteward(user) || isAdmin(user);
}

// ============================================================================
// External Authorization System Integration (Future)
// ============================================================================

/**
 * Interface for external authorization providers
 * This allows integration with systems like:
 * - OpenFGA (https://openfga.dev/)
 * - Ory Keto (https://www.ory.sh/keto/)
 * - Casbin (https://casbin.org/)
 * - Warrant (https://warrant.dev/)
 */
export interface AuthorizationProvider {
  /**
   * Check if user has permission for a resource/action
   */
  check(params: {
    userId: string;
    resource: string;
    action: string;
    context?: Record<string, any>;
  }): Promise<boolean>;

  /**
   * Get all permissions for a user
   */
  getUserPermissions(userId: string): Promise<string[]>;

  /**
   * Grant permission to user
   */
  grant(params: {
    userId: string;
    resource: string;
    action: string;
  }): Promise<void>;

  /**
   * Revoke permission from user
   */
  revoke(params: {
    userId: string;
    resource: string;
    action: string;
  }): Promise<void>;
}

/**
 * Example: OpenFGA integration (placeholder)
 * Uncomment and implement when ready to integrate
 */
/*
export class OpenFGAProvider implements AuthorizationProvider {
  private apiUrl: string;
  private storeId: string;

  constructor(apiUrl: string, storeId: string) {
    this.apiUrl = apiUrl;
    this.storeId = storeId;
  }

  async check(params: {
    userId: string;
    resource: string;
    action: string;
  }): Promise<boolean> {
    const response = await fetch(`${this.apiUrl}/stores/${this.storeId}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tuple_key: {
          user: `user:${params.userId}`,
          relation: params.action,
          object: params.resource,
        },
      }),
    });

    const result = await response.json();
    return result.allowed || false;
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    // Implementation for fetching user permissions
    // This would query OpenFGA's API to list all tuples for the user
    throw new Error('Not implemented');
  }

  async grant(params: {
    userId: string;
    resource: string;
    action: string;
  }): Promise<void> {
    // Implementation for granting permissions
    throw new Error('Not implemented');
  }

  async revoke(params: {
    userId: string;
    resource: string;
    action: string;
  }): Promise<void> {
    // Implementation for revoking permissions
    throw new Error('Not implemented');
  }
}
*/

/**
 * Authorization manager that can switch between different providers
 */
export class AuthorizationManager {
  private provider: AuthorizationProvider | null = null;

  setProvider(provider: AuthorizationProvider) {
    this.provider = provider;
  }

  async check(params: {
    userId: string;
    resource: string;
    action: string;
    context?: Record<string, any>;
  }): Promise<boolean> {
    if (!this.provider) {
      throw new Error('No authorization provider configured');
    }

    return this.provider.check(params);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    if (!this.provider) {
      throw new Error('No authorization provider configured');
    }

    return this.provider.getUserPermissions(userId);
  }
}

// Global authorization manager instance
export const authzManager = new AuthorizationManager();

// src/config/groupSectionPermissions.ts
/**
 * Permission requirements for group work area sections
 *
 * Access Model:
 * - Steward role = gateway to GroupWorkArea access
 * - Decorators = specific section access
 * - Admin role = access to all sections
 */

export interface SectionPermissionRequirement {
  /** Section requires admin role */
  requiredRole?: 'admin' | 'steward';

  /** Section requires specific decorator */
  requiredDecorator?: string;

  /** Section is accessible to all stewards (no specific decorator needed) */
  public?: boolean;

  /** Human-readable description */
  description?: string;
}

/**
 * Map of section keys to their permission requirements
 */
export const SECTION_PERMISSIONS: Record<string, SectionPermissionRequirement> = {
  // Overview - accessible to all stewards
  'admin-dashboard': {
    public: true,
    description: 'Group overview and dashboard',
  },
  'dashboard': {
    public: true,
    description: 'Group overview and dashboard (alias)',
  },

  // Permissions management - admin only
  'stewards-permissions': {
    requiredRole: 'admin',
    description: 'Manage member permissions and steward roles',
  },
  'members-permissions': {
    requiredRole: 'admin',
    description: 'Manage member permissions (duplicate route)',
  },

  // Members - requires invite permission
  'members-roles': {
    requiredDecorator: 'can__InviteMembers',
    description: 'View and manage group members',
  },
  'invitations': {
    requiredDecorator: 'can__InviteMembers',
    description: 'Send invitations to new members',
  },

  // Writing - requires writing permission
  'writing': {
    requiredDecorator: 'can__ManageWriting',
    description: 'View and manage group writing pieces',
  },
  'write': {
    requiredDecorator: 'can__ManageWriting',
    description: 'Create or edit writing pieces',
  },

  // Dispatch - requires dispatch permission
  'dispatches': {
    requiredDecorator: 'can__ManageDispatch',
    description: 'View and manage dispatch documents',
  },
  'dispatch': {
    requiredDecorator: 'can__ManageDispatch',
    description: 'Create or edit dispatch documents',
  },

  // Settings - admin only
  'edit-group': {
    requiredRole: 'admin',
    description: 'Edit group settings and details',
  },
};

/**
 * Check if a user can access a specific section
 *
 * @param section - The section key
 * @param userRoles - Array of user's roles ['member', 'steward', 'admin']
 * @param userDecorators - Array of user's decorator codes
 * @returns true if user can access the section
 */
export function canAccessSection(
  section: string,
  userRoles: string[],
  userDecorators: string[]
): boolean {
  const requirement = SECTION_PERMISSIONS[section];

  // If section has no requirements defined, default to deny
  if (!requirement) {
    return false;
  }

  // Admins can access everything
  if (userRoles.includes('admin')) {
    return true;
  }

  // Public sections accessible to all stewards
  if (requirement.public) {
    return userRoles.includes('steward') || userRoles.includes('admin');
  }

  // Role-based requirement
  if (requirement.requiredRole) {
    return userRoles.includes(requirement.requiredRole);
  }

  // Decorator-based requirement
  if (requirement.requiredDecorator) {
    return userDecorators.includes(requirement.requiredDecorator);
  }

  return false;
}

/**
 * Get list of sections a user can access
 *
 * @param userRoles - Array of user's roles
 * @param userDecorators - Array of user's decorator codes
 * @returns Array of section keys the user can access
 */
export function getAccessibleSections(
  userRoles: string[],
  userDecorators: string[]
): string[] {
  return Object.keys(SECTION_PERMISSIONS).filter(section =>
    canAccessSection(section, userRoles, userDecorators)
  );
}

// src/hooks/groups/useGroupSectionPermissions.ts
/**
 * Hook for checking group section access permissions
 */

import { useMemo } from 'react';
import { useMyPermissions } from './useGroupPermissions';
import { canAccessSection, getAccessibleSections, SECTION_PERMISSIONS } from '@/config/groupSectionPermissions';

/**
 * Hook to check if current user can access a specific section
 */
export function useCanAccessSection(groupSlug: string, section: string): boolean {
  const { data: myPermissions, isLoading } = useMyPermissions(groupSlug);

  return useMemo(() => {
    // While loading, deny access
    if (isLoading || !myPermissions) {
      return false;
    }

    return canAccessSection(
      section,
      myPermissions.roles || [],
      myPermissions.decorators || []
    );
  }, [section, myPermissions, isLoading]);
}

/**
 * Hook to get all sections the current user can access
 */
export function useAccessibleSections(groupSlug: string): string[] {
  const { data: myPermissions, isLoading } = useMyPermissions(groupSlug);

  return useMemo(() => {
    if (isLoading || !myPermissions) {
      return [];
    }

    return getAccessibleSections(
      myPermissions.roles || [],
      myPermissions.decorators || []
    );
  }, [myPermissions, isLoading]);
}

/**
 * Hook to get user's permissions with helper methods
 */
export function useGroupPermissions(groupSlug: string) {
  const { data: myPermissions, isLoading } = useMyPermissions(groupSlug);
  const accessibleSections = useAccessibleSections(groupSlug);

  return useMemo(() => ({
    permissions: myPermissions,
    isLoading,
    isAdmin: myPermissions?.is_admin || false,
    isSteward: myPermissions?.is_steward || false,
    roles: myPermissions?.roles || [],
    decorators: myPermissions?.decorators || [],
    accessibleSections,
    canAccessSection: (section: string) => canAccessSection(
      section,
      myPermissions?.roles || [],
      myPermissions?.decorators || []
    ),
    hasDecorator: (decorator: string) => myPermissions?.decorators?.includes(decorator) || false,
  }), [myPermissions, isLoading, accessibleSections]);
}

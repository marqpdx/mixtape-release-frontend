// src/config/groupTypeSections.ts

/**
 * Group Type Section Restrictions
 *
 * Defines which sections are EXCLUDED for specific group types.
 * Everything else is available by default.
 *
 * Design Philosophy:
 * - Circles have feature parity with communities
 * - Only exclude features that fundamentally don't make sense for circles
 * - Use exclusion list (not inclusion) to make adding new features easier
 */

export const GROUP_TYPE_EXCLUDED_SECTIONS: Record<string, Set<string>> = {
  /**
   * Circles cannot create sub-circles (no nesting in MVP)
   */
  circle: new Set([
    'circles-landing',  // Can't view/manage circles
    'circle-create',    // Can't create sub-circles
  ]),

  /**
   * Communities have no restrictions - full feature set
   */
  community: new Set([]),

  persona: new Set([]),

  coalition: new Set([]),
};

/**
 * Check if a section is allowed for a given group type
 *
 * @param section - The section key to check
 * @param groupType - The group type ('community' or 'circle')
 * @returns true if section is allowed, false if excluded
 */
export function isSectionAllowedForGroupType(
  section: string,
  groupType: string = 'community'
): boolean {
  const excludedSections = GROUP_TYPE_EXCLUDED_SECTIONS[groupType];

  // If no exclusion list exists for this group type, allow everything
  if (!excludedSections) {
    return true;
  }

  // Return true if section is NOT in the exclusion list
  return !excludedSections.has(section);
}

/**
 * Get all excluded sections for a group type
 * Useful for debugging or displaying limitations
 */
export function getExcludedSections(groupType: string): string[] {
  const excluded = GROUP_TYPE_EXCLUDED_SECTIONS[groupType];
  return excluded ? Array.from(excluded) : [];
}

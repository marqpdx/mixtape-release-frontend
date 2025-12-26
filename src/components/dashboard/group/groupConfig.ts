// src/components/dashboard/group/groupConfig.ts

import { MenuItem } from "@components/dashboard/shared/types";
import { canAccessSection } from "@/config/groupSectionPermissions";
import { isSectionAllowedForGroupType } from "@/config/groupTypeSections";

// Admin/Steward Dashboard - Full feature set
export const GROUP_ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    key: "overview", // This becomes admin-only overview
    label: "Overview",
    icon: "📊",
    subItems: [
      { key: "admin-dashboard", label: "Admin Dashboard" },
      { key: "stewards-permissions", label: "Stewards & Permission", hidden: false },
      { key: "activity", label: "Recent Activity", hidden: true },
      { key: "analytics", label: "Analytics", hidden: true },
    ]
  },
  {
    key: "members",
    label: "Members",
    icon: "👥",
    subItems: [
      { key: "members-roles", label: "Members" },
      { key: "invitations", label: "Invitations" },
      { key: "member-requests", label: "Join Requests", hidden: true },
    ]
  },
  {
    key: "threadworks",
    label: "Threadworks",
    icon: "💬",
    subItems: [
      { key: "threadworks-landing", label: "Conversations" },
    ]
  },
  {
    key: "almanac",
    label: "Almanac",
    icon: "📅",
    subItems: [
      { key: "almanac-landing", label: "Events & Calendar" },
    ]
  },

  // {
  //   key: "mill",
  //   label: "Mill",
  //   icon: "🌾",
  //   subItems: [
  //     { key: "mill", label: "Grist Mill" },
  //   ]
  // },


  // {
  //   key: "earthlab",
  //   label: "EarthLab",
  //   icon: "🌎",
  //   subItems: [
  //     { key: "earthlab", label: "Learning", hidden: true },
  //     { key: "course-detail", label: "Create/Edit", hidden: true },
  //     // { key: "create-event", label: "Create Event", hidden: true },
  //   ]
  // },
  {
    key: "content",
    label: "Content",
    icon: "📝",
    subItems: [
      { key: "writing", label: "Posts & Announcements", hidden: false },
      // { key: "create-writing", label: "Write", hidden: false },
      // { key: "threadworks-landing", label: "Threadworks", hidden: false },
      { key: "write", label: "Write", hidden: false },
      { key: "comments", label: "Comments", hidden: true },
      { key: "pinned", label: "Pinned Writing", hidden: true },
      { key: "files", label: "File Management", hidden: true },
      { key: "group-courses", label: "Course Management", hidden: true },
    ]
  },
  {
    key: "settings",
    label: "Settings",
    icon: "⚙️",
    subItems: [
      { key: "edit-group", label: "Edit Group" },
      { key: "circles-landing", label: "Circles", hidden: false },
      { key: "circle-create", label: "Create Circle", hidden: false },
      { key: "mill", label: "Grist Mill" },
      // { key: "general", label: "General Settings" },
      { key: "permissions", label: "Permissions", hidden: true },
      { key: "integrations", label: "Integrations", hidden: true },
    ]
  }
];

// Member Dashboard - Simplified navigation
export const GROUP_MEMBER_MENU_ITEMS: MenuItem[] = [
  {
    key: "group-home", // This shows the GroupLanding component
    label: "Group Home",
    icon: "🏠",
    subItems: []
  },
  {
    key: "my-activity",
    label: "My Activity",
    icon: "📈",
    subItems: [
      { key: "my-posts", label: "My Posts" },
      { key: "my-files", label: "My Files" },
      { key: "notifications", label: "Notifications" },
    ]
  },
];

// Helper function to get appropriate menu based on role
export function getGroupMenuItems(userRole: string | null): MenuItem[] {
  const adminRoles = ['admin', 'steward'];

  if (adminRoles.includes(userRole || '')) {
    return GROUP_ADMIN_MENU_ITEMS;
  }

  return GROUP_MEMBER_MENU_ITEMS;
}

/**
 * Filter menu items based on user permissions and group type
 * @param menuItems - The menu items to filter
 * @param userRoles - Array of user's roles
 * @param userDecorators - Array of user's decorator codes
 * @param groupType - The group type ('community' or 'circle') - defaults to 'community'
 * @returns Filtered menu items with only accessible sections
 */
export function filterMenuByPermissions(
  menuItems: MenuItem[],
  userRoles: string[],
  userDecorators: string[],
  groupType: string = 'community'
): MenuItem[] {
  return menuItems
    .map(item => {
      // Filter subItems based on permissions and group type
      const filteredSubItems = item.subItems
        ?.filter(subItem => {
          // Skip hidden items
          if (subItem.hidden) return false;

          // Check if section is allowed for this group type
          if (!isSectionAllowedForGroupType(subItem.key, groupType)) {
            return false;
          }

          // Check if user has access to this section
          return canAccessSection(subItem.key, userRoles, userDecorators);
        });

      // If this is a parent item with subItems, only include if it has accessible children
      if (item.subItems && item.subItems.length > 0) {
        if (!filteredSubItems || filteredSubItems.length === 0) {
          return null; // No accessible subItems, hide parent
        }
        return {
          ...item,
          subItems: filteredSubItems,
        };
      }

      // For items without subItems, check direct access
      return canAccessSection(item.key, userRoles, userDecorators) ? item : null;
    })
    .filter((item): item is MenuItem => item !== null);
}

/**
 * Get filtered menu items based on user role, permissions, and group type
 * @param userRole - User's primary role (for determining base menu)
 * @param userRoles - Array of all user's roles
 * @param userDecorators - Array of user's decorator codes
 * @param groupType - The group type ('community' or 'circle') - defaults to 'community'
 * @returns Filtered menu items
 */
export function getFilteredGroupMenuItems(
  userRole: string | null,
  userRoles: string[] = [],
  userDecorators: string[] = [],
  groupType: string = 'community'
): MenuItem[] {
  const baseMenu = getGroupMenuItems(userRole);

  // If user is admin or steward, filter the admin menu by permissions and group type
  if (['admin', 'steward'].includes(userRole || '')) {
    return filterMenuByPermissions(baseMenu, userRoles, userDecorators, groupType);
  }

  // Regular members get the member menu as-is
  return baseMenu;
}
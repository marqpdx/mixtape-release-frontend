// src/components/dashboard/group/groupConfig.ts

import { MenuItem } from "@components/dashboard/shared/types";

// Admin/Steward Dashboard - Full feature set
export const GROUP_ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    key: "overview", // This becomes admin-only overview
    label: "Overview",
    icon: "📊",
    subItems: [
      { key: "admin-dashboard", label: "Admin Dashboard" },
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
    key: "events",
    label: "Events",
    icon: "👥",
    subItems: [
      { key: "events-landing", label: "E1", hidden: true },
      { key: "events-2", label: "E2", hidden: true },
      { key: "create-event", label: "Create Event", hidden: true },
    ]
  },
  {
    key: "communication",
    label: "Communication",
    icon: "💬",
    subItems: [
      { key: "threadworks", label: "Threadworks", hidden: true },
      { key: "do-writing", label: "Write", hidden: true },
      { key: "drafts", label: "Draft Writing", hidden: true },
      { key: "comments", label: "Comments", hidden: true },
      { key: "pinned", label: "Pinned Writing", hidden: true },
      { key: "files", label: "File Management", hidden: true },
      { key: "courses", label: "Course Management", hidden: true },
    ]
  },
  {
    key: "earthlab",
    label: "EarthLab",
    icon: "🌎",
    subItems: [
      { key: "earthlab", label: "Learning", hidden: true },
      { key: "course-detail", label: "Create/Edit", hidden: true },
      // { key: "create-event", label: "Create Event", hidden: true },
    ]
  },
  {
    key: "content",
    label: "Content",
    icon: "📝",
    subItems: [
      { key: "writing", label: "Posts & Announcements", hidden: true },
      { key: "do-writing", label: "Write", hidden: true },
      { key: "drafts", label: "Draft Writing", hidden: true },
      { key: "comments", label: "Comments", hidden: true },
      { key: "pinned", label: "Pinned Writing", hidden: true },
      { key: "files", label: "File Management", hidden: true },
      { key: "group-courses", label: "Course Management", hidden: false },
    ]
  },
  {
    key: "settings",
    label: "Settings",
    icon: "⚙️",
    subItems: [
      { key: "edit-group", label: "Edit Group" },
      { key: "general", label: "General Settings" },
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
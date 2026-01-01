// src/components/dashboard/dashboardMenu.ts

export interface MenuItem {
  key: string;
  label: string;
  minRole?: string;
  hidden?: boolean;
  exclude?: string[];
  subItems?: MenuItem[];
}

export const DASHBOARD_MENU_ITEMS: MenuItem[] = [
  {
    key: "personal",
    label: "Personal",
    minRole: "member",
    subItems: [
      { key: "overview", label: "Overview", minRole: "member" },
      { key: "profile", label: "Profile", minRole: "member" },
      { key: "preferences", label: "Preferences", minRole: "member" },
      { key: "activity", label: "Activity", minRole: "member" },
    ]
  },
  {
    key: "groups",
    label: "Groups",
    minRole: "member",
    subItems: [
      { key: "my-groups", label: "My Groups", minRole: "member" },
      { key: "discover-groups", label: "Discover", minRole: "member" },
      { key: "group-invites", label: "Invitations", minRole: "member" },
      { key: "create-group", label: "Create Group", minRole: "member" },
    ]
  },
  {
    key: "learning",
    label: "EarthLab",
    minRole: "member",
    subItems: [
      { key: "my-courses", label: "My Courses", minRole: "member" },
      { key: "browse-courses", label: "Browse Courses", minRole: "member" },
      { key: "achievements", label: "Achievements", minRole: "member" },
      { key: "learning-path", label: "Learning Path", minRole: "member" },
    ]
  },
  {
    key: "threadworks",
    label: "Threadworks",
    minRole: "member",
    subItems: [
      { key: "forums", label: "All Forums", minRole: "member" },
      { key: "my-forums", label: "My Forums", minRole: "member" },
      { key: "forum-create", label: "Create Forum", minRole: "steward" },
      { key: "forum-detail", label: "Forum Detail", minRole: "member", hidden: true },
    ]
  },
  {
    key: "stackroom",
    label: "Stackroom",
    minRole: "member",
    subItems: [
      { key: "search", label: "Search Library", minRole: "member" },
      { key: "libraries", label: "My Libraries", minRole: "member" },
    ]
  },
  // {
  //   key: "writing",
  //   label: "Writing",
  //   minRole: "member",
  //   subItems: [
  //     { key: "forums", label: "All Forums", minRole: "member" },
  //     { key: "my-forums", label: "My Forums", minRole: "member" },
  //     { key: "forum-create", label: "Create Forum", minRole: "steward" },
  //     { key: "forum-detail", label: "Forum Detail", minRole: "member", hidden: true },
  //   ]
  // },
  {
    key: "admin",
    label: "Administration",
    minRole: "steward",
    subItems: [
      { key: "admin-overview", label: "Admin Overview", minRole: "steward" },
      { key: "quick-actions", label: "Quick Actions", minRole: "steward" },
      { key: "todos", label: "Todo List", minRole: "steward" },
      { key: "user-management", label: "Users", minRole: "steward" },
      { key: "group-management", label: "Groups", minRole: "steward" },
      { key: "content-management", label: "Content", minRole: "steward" },
      { key: "system-health", label: "System Health", minRole: "steward" },
      { key: "site-settings", label: "Site Settings", minRole: "admin" },
      { key: "permissions", label: "Permissions", minRole: "admin" },
    ]
  }
];
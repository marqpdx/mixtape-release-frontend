// src/components/dashboard/types.ts

export interface MenuItem {
  key: string;
  label: string;
  icon?: string;
  hidden?: boolean;
  subItems?: MenuItem[];
}

export interface DashboardConfig {
  title: string;
  menuItems: MenuItem[];
  defaultSection: string;
  localStorageKey: string;
}

// =====================================================
// 1. MEMBER DASHBOARD - Community participation & content creation
// =====================================================

// src/components/dashboard/member/memberMenuItems.ts
export const MEMBER_MENU_ITEMS: MenuItem[] = [
  {
    key: "personal",
    label: "Personal",
    icon: "👤",
    subItems: [
      { key: "overview", label: "Overview" },
      { key: "profile", label: "Profile" },
      { key: "preferences", label: "Preferences" },
      { key: "activity", label: "Activity Feed" },
    ]
  },
  {
    key: "writing",
    label: "Writing",
    icon: "📝",
    subItems: [
      { key: "new-post", label: "New Post" },
      { key: "my-drafts", label: "My Drafts" },
      { key: "published-posts", label: "Published Posts" },
      { key: "writing-tools", label: "Writing Tools" },
      { key: "templates", label: "Templates" },
    ]
  },
  {
    key: "groups",
    label: "Groups",
    icon: "👥",
    subItems: [
      { key: "my-groups", label: "My Groups" },
      { key: "discover-groups", label: "Discover" },
      { key: "group-invites", label: "Invitations" },
      { key: "create-group", label: "Create Group" },
    ]
  },
  {
    key: "learning",
    label: "EarthLab",
    icon: "🌱",
    subItems: [
      { key: "my-courses", label: "My Courses" },
      { key: "browse-courses", label: "Browse Courses" },
      { key: "achievements", label: "Achievements" },
      { key: "learning-path", label: "Learning Path" },
    ]
  },
  {
    key: "threadworks",
    label: "Threadworks",
    icon: "🧵",
    subItems: [
      { key: "forums", label: "All Forums" },
      { key: "my-forums", label: "My Forums" },
      { key: "subscriptions", label: "Subscriptions" },
      { key: "forum-detail", label: "Forum Detail", hidden: true },
    ]
  }
];

export const MEMBER_DASHBOARD_CONFIG: DashboardConfig = {
  title: "Community Dashboard",
  menuItems: MEMBER_MENU_ITEMS,
  defaultSection: "overview",
  localStorageKey: "memberDashboard"
};

// =====================================================
// 2. SITE ADMIN DASHBOARD - Site-wide administration
// =====================================================
// Simplified to only working items. Infrastructure monitoring moved to /admin/sysadmin.
// Future items (users, groups, content management) will be added as backend APIs are built.

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    key: "overview",
    label: "Overview",
    icon: "📊",
    subItems: [
      { key: "admin-overview", label: "Dashboard" },
      { key: "todos", label: "To-Dos" },
    ]
  },
  {
    key: "tools",
    label: "Tools",
    icon: "🔧",
    subItems: [
      { key: "auth-debug", label: "Auth Debug" },
    ]
  },
  // ==========================================================================
  // FUTURE SECTIONS - Uncomment as backend APIs are implemented
  // ==========================================================================
  // {
  //   key: "users",
  //   label: "Users",
  //   icon: "👥",
  //   subItems: [
  //     { key: "user-management", label: "All Users" },
  //     { key: "user-roles", label: "Roles & Permissions" },
  //   ]
  // },
  // {
  //   key: "groups",
  //   label: "Groups",
  //   icon: "🏢",
  //   subItems: [
  //     { key: "group-management", label: "All Groups" },
  //   ]
  // },
  {
    key: "groups",
    label: "Groups",
    icon: "🏢",
    subItems: [
      { key: "group-management", label: "All Groups" },
    ]
  },
  // {
  //   key: "content",
  //   label: "Content",
  //   icon: "📝",
  //   subItems: [
  //     { key: "content-moderation", label: "Moderation Queue" },
  //   ]
  // },
];

export const ADMIN_DASHBOARD_CONFIG: DashboardConfig = {
  title: "Admin Dashboard",
  menuItems: ADMIN_MENU_ITEMS,
  defaultSection: "admin-overview",
  localStorageKey: "adminDashboard"
};

// =====================================================
// 3. GROUP ADMIN DASHBOARD - Group-specific administration
// =====================================================

// src/components/dashboard/groupAdmin/groupAdminMenuItems.ts
export const GROUP_ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    key: "overview",
    label: "Overview",
    icon: "📊",
    subItems: [
      { key: "group-overview", label: "Group Dashboard" },
      { key: "group-analytics", label: "Analytics" },
      { key: "member-activity", label: "Member Activity" },
    ]
  },
  {
    key: "members",
    label: "Members",
    icon: "👥",
    subItems: [
      { key: "member-management", label: "All Members" },
      { key: "member-invites", label: "Invitations" },
      { key: "member-requests", label: "Join Requests" },
      { key: "member-roles", label: "Roles & Permissions" },
    ]
  },
  {
    key: "content",
    label: "Content",
    icon: "📝",
    subItems: [
      { key: "group-content", label: "Group Content" },
      { key: "content-moderation", label: "Moderation" },
      { key: "pinned-posts", label: "Pinned Posts" },
      { key: "content-templates", label: "Templates" },
    ]
  },
  {
    key: "forums",
    label: "Forums",
    icon: "🧵",
    subItems: [
      { key: "group-forums", label: "Group Forums" },
      { key: "forum-create", label: "Create Forum" },
      { key: "forum-settings", label: "Forum Settings" },
    ]
  },
  {
    key: "settings",
    label: "Settings",
    icon: "⚙️",
    subItems: [
      { key: "group-settings", label: "Group Settings" },
      { key: "privacy-settings", label: "Privacy & Access" },
      { key: "notification-settings", label: "Notifications" },
      { key: "integrations", label: "Integrations" },
    ]
  }
];

export const GROUP_ADMIN_DASHBOARD_CONFIG: DashboardConfig = {
  title: "Group Administration",
  menuItems: GROUP_ADMIN_MENU_ITEMS,
  defaultSection: "group-overview",
  localStorageKey: "groupAdminDashboard"
};

// =====================================================
// 4. SYSADMIN DASHBOARD - Technical monitoring & maintenance
// =====================================================
// Menu structure mirrors actual backend data from /api/ops/health-snapshot
// See: docs/sysadmin/dashboard-hierarchy.md

export const SYSADMIN_MENU_ITEMS: MenuItem[] = [
  {
    key: "overview",
    label: "Overview",
    icon: "📊",
    subItems: [
      { key: "system-overview", label: "System Overview" },
    ]
  },
  {
    key: "mission-critical",
    label: "Mission Critical",
    icon: "🚨",
    subItems: [
      { key: "svc-postgres", label: "Database" },
      { key: "svc-application-surfaces", label: "Application Surfaces" },
      { key: "svc-django", label: "API" },
      { key: "svc-rabbitmq", label: "Message Broker" },
      { key: "svc-backups", label: "Backups" },
    ]
  },
  {
    key: "core-services",
    label: "Core Services",
    icon: "⚙️",
    subItems: [
      { key: "svc-celery", label: "Workers" },
      { key: "svc-nginx", label: "Proxy" },
      { key: "svc-seaweedfs", label: "Storage" },
    ]
  },
  {
    key: "feature-services",
    label: "Feature Services",
    icon: "🔌",
    subItems: [
      { key: "svc-inkwell", label: "Inkwell (LLM)" },
      { key: "svc-lanternmail", label: "Lanternmail" },
      { key: "svc-livewire", label: "Livewire" },
    ]
  },
  {
    key: "resources",
    label: "Resources",
    icon: "📈",
    subItems: [
      { key: "res-memory", label: "Memory" },
      { key: "res-disk", label: "Disk" },
      { key: "res-network", label: "Network" },
    ]
  },
  {
    key: "diagnostics",
    label: "Diagnostics",
    icon: "🔍",
    subItems: [
      { key: "puddlejump-status", label: "Project Status" },
      { key: "diag-build-log", label: "Build Log" },
      { key: "diag-processes", label: "Top Processes" },
      { key: "diag-snapshot", label: "Raw Snapshot" },
    ]
  },
];

export const SYSADMIN_DASHBOARD_CONFIG: DashboardConfig = {
  title: "🔧 System Administration",
  menuItems: SYSADMIN_MENU_ITEMS,
  defaultSection: "system-overview",
  localStorageKey: "sysadminDashboard"
};

// =====================================================
// DASHBOARD FACTORY - Route to appropriate dashboard
// =====================================================

// src/components/dashboard/DashboardFactory.tsx
export type DashboardType = 'member' | 'admin' | 'groupAdmin' | 'sysadmin';

export function getDashboardConfig(type: DashboardType): DashboardConfig {
  switch (type) {
    case 'member':
      return MEMBER_DASHBOARD_CONFIG;
    case 'admin':
      return ADMIN_DASHBOARD_CONFIG;
    case 'groupAdmin':
      return GROUP_ADMIN_DASHBOARD_CONFIG;
    case 'sysadmin':
      return SYSADMIN_DASHBOARD_CONFIG;
    default:
      return MEMBER_DASHBOARD_CONFIG;
  }
}

export function getDashboardTypeFromRoles(roles: string[]): DashboardType {
  if (roles.includes('sysadmin')) return 'sysadmin';
  if (roles.includes('admin')) return 'admin';
  if (roles.includes('steward')) return 'admin'; // Stewards use admin dashboard
  return 'member';
}

// =====================================================
// ROUTE MAPPING - Map sections to their dashboard type
// =====================================================

export const DASHBOARD_ROUTES: Record<string, DashboardType> = {
  // Member sections
  'overview': 'member',
  'profile': 'member',
  'new-post': 'member',
  'my-drafts': 'member',
  'my-groups': 'member',
  'forums': 'member',

  // Admin sections
  'admin-overview': 'admin',
  'user-management': 'admin',
  'content-moderation': 'admin',
  'site-settings': 'admin',

  // Group Admin sections (would be contextual based on group)
  'group-overview': 'groupAdmin',
  'member-management': 'groupAdmin',
  'group-settings': 'groupAdmin',

  // Sysadmin sections
  'system-overview': 'sysadmin',
  'svc-postgres': 'sysadmin',
  'svc-application-surfaces': 'sysadmin',
  'svc-django': 'sysadmin',
  'svc-rabbitmq': 'sysadmin',
  'svc-backups': 'sysadmin',
  'svc-celery': 'sysadmin',
  'svc-nginx': 'sysadmin',
  'svc-seaweedfs': 'sysadmin',
  'svc-inkwell': 'sysadmin',
  'svc-lanternmail': 'sysadmin',
  'svc-livewire': 'sysadmin',
  'puddlejump-status': 'sysadmin',
  'diag-build-log': 'sysadmin',
  'res-memory': 'sysadmin',
  'res-disk': 'sysadmin',
  'res-network': 'sysadmin',
  'diag-processes': 'sysadmin',
  'diag-snapshot': 'sysadmin',
};

// Usage example:
/*
// app/(protected)/dashboard/page.tsx
import { getDashboardConfig, getDashboardTypeFromRoles } from '@/components/dashboard/types';

export default function DashboardPage() {
  const { data: identity } = useGetIdentity();
  const dashboardType = getDashboardTypeFromRoles(identity?.roles || []);
  const config = getDashboardConfig(dashboardType);

  return (
    <DashboardLayout
      title={config.title}
      menuItems={config.menuItems}
      defaultSection={config.defaultSection}
      localStorageKey={config.localStorageKey}
      WorkAreaComponent={getWorkAreaComponent(dashboardType)}
    />
  );
}
*/

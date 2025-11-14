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

// src/components/dashboard/admin/adminMenuItems.ts
export const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    key: "overview",
    label: "Overview",
    icon: "📊",
    subItems: [
      { key: "admin-overview", label: "Admin Dashboard" },
      { key: "metrics", label: "Site Metrics" },
      { key: "recent-activity", label: "Recent Activity" },
    ]
  },
  {
    key: "users",
    label: "Users",
    icon: "👥",
    subItems: [
      { key: "user-management", label: "All Users" },
      { key: "user-roles", label: "Roles & Permissions" },
      { key: "user-invites", label: "Invitations" },
      { key: "banned-users", label: "Banned Users" },
    ]
  },
  {
    key: "content",
    label: "Content",
    icon: "📝",
    subItems: [
      { key: "content-overview", label: "Content Overview" },
      { key: "content-moderation", label: "Moderation Queue" },
      { key: "reported-content", label: "Reported Content" },
      { key: "content-analytics", label: "Analytics" },
    ]
  },
  {
    key: "groups",
    label: "Groups",
    icon: "🏢",
    subItems: [
      { key: "group-management", label: "All Groups" },
      { key: "group-analytics", label: "Group Analytics" },
      { key: "group-settings", label: "Group Policies" },
    ]
  },
  {
    key: "system",
    label: "System",
    icon: "⚙️",
    subItems: [
      { key: "site-settings", label: "Site Settings" },
      { key: "system-health", label: "System Health" },
      { key: "email-settings", label: "Email Configuration" },
      { key: "integrations", label: "Integrations" },
    ]
  }
];

export const ADMIN_DASHBOARD_CONFIG: DashboardConfig = {
  title: "🎧 Mixtape Admin Dashboard",
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

// src/components/dashboard/sysadmin/sysadminMenuItems.ts
export const SYSADMIN_MENU_ITEMS: MenuItem[] = [
  {
    key: "monitoring",
    label: "Monitoring",
    icon: "📈",
    subItems: [
      { key: "system-overview", label: "System Overview" },
      { key: "performance-metrics", label: "Performance" },
      { key: "error-logs", label: "Error Logs" },
      { key: "uptime-monitoring", label: "Uptime" },
    ]
  },
  {
    key: "infrastructure",
    label: "Infrastructure",
    icon: "🏗️",
    subItems: [
      { key: "server-status", label: "Server Status" },
      { key: "database-health", label: "Database Health" },
      { key: "storage-usage", label: "Storage Usage" },
      { key: "cdn-status", label: "CDN Status" },
    ]
  },
  {
    key: "security",
    label: "Security",
    icon: "🔒",
    subItems: [
      { key: "security-overview", label: "Security Overview" },
      { key: "failed-logins", label: "Failed Logins" },
      { key: "suspicious-activity", label: "Suspicious Activity" },
      { key: "security-logs", label: "Security Logs" },
    ]
  },
  {
    key: "maintenance",
    label: "Maintenance",
    icon: "🔧",
    subItems: [
      { key: "scheduled-tasks", label: "Scheduled Tasks" },
      { key: "database-maintenance", label: "Database Maintenance" },
      { key: "backup-status", label: "Backup Status" },
      { key: "deployment-logs", label: "Deployment Logs" },
    ]
  },
  {
    key: "alerts",
    label: "Alerts",
    icon: "🚨",
    subItems: [
      { key: "active-alerts", label: "Active Alerts" },
      { key: "alert-history", label: "Alert History" },
      { key: "alert-settings", label: "Alert Settings" },
    ]
  }
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
  'performance-metrics': 'sysadmin',
  'error-logs': 'sysadmin',
  'server-status': 'sysadmin',
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
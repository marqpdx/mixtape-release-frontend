// apps/mixtape/src/components/dashboard/admin/adminConfig.ts

/**
 * ADMIN DASHBOARD MENU CONFIGURATION
 *
 * Site-wide administration menu for managing users, content, and system settings.
 *
 * 📋 TO ADD NEW ADMIN MENU ITEMS:
 * 1. Add to the appropriate section's subItems array
 * 2. Set hidden: true if the item shouldn't appear in navigation
 * 3. Follow the MenuItem interface structure
 * 4. Add corresponding section handler in AdminWorkArea.tsx
 */

// apps/mixtape/src/config/admin-dashboard.config.ts

export const ADMIN_DASHBOARD_CONFIG = {
  title: "System Administration",
  defaultSection: "admin-overview",
  localStorageKey: "admin-dashboard-section",
  menuItems: [
    {
      key: "overview",
      label: "Admin Overview",
      icon: "🎧",
      subItems: [
        { key: "admin-overview", label: "Dashboard" },
        { key: "quick-actions", label: "Quick Actions" },
      ]
    },
    {
      key: "system",
      label: "System & Debug",
      icon: "⚡",
      subItems: [
        { key: "system-health", label: "System Health" },
        { key: "system-stats", label: "System Stats" },
        { key: "auth-debug", label: "Auth Debug" },
        { key: "system-logs", label: "System Logs" },
        { key: "system-metrics", label: "Performance Metrics" },
        { key: "system-maintenance", label: "Maintenance Mode" },
      ]
    },
    {
      key: "users",
      label: "Platform Users",
      icon: "👥",
      subItems: [
        { key: "user-management", label: "User Management" },
        { key: "user-analytics", label: "User Analytics" },
        { key: "user-roles", label: "Role Management" },
        { key: "user-reports", label: "User Reports" },
      ]
    },
    {
      key: "groups",
      label: "Groups & Communities",
      icon: "🏢",
      subItems: [
        { key: "group-management", label: "Group Management" },
        { key: "group-analytics", label: "Group Analytics" },
        { key: "group-moderation", label: "Group Moderation" },
      ]
    },
    {
      key: "content",
      label: "Content Moderation",
      icon: "🛡️",
      subItems: [
        { key: "content-moderation", label: "Moderation Queue" },
        { key: "content-reports", label: "Content Reports" },
        { key: "content-policies", label: "Content Policies" },
      ]
    },
    {
      key: "projects",
      label: "Projects",
      icon: "📁",
      subItems: [
        { key: "active-projects", label: "Active Projects" },
        { key: "project-analytics", label: "Project Analytics" },
      ]
    },
    {
      key: "settings",
      label: "Site Settings",
      icon: "⚙️",
      subItems: [
        { key: "site-settings", label: "General Settings" },
        { key: "email-settings", label: "Email Configuration" },
        { key: "feature-flags", label: "Feature Flags" },
      ]
    },
    {
      key: "tasks",
      label: "Admin Tasks",
      icon: "✅",
      subItems: [
        { key: "todos", label: "Todo List" },
        { key: "scheduled-tasks", label: "Scheduled Tasks" },
        { key: "maintenance-log", label: "Maintenance Log" },
      ]
    },
    {
      key: "business",
      label: "Business Operations",
      icon: "💼",
      subItems: [
        { key: "revenue-metrics", label: "Revenue & Subscriptions" },
        { key: "business-analytics", label: "Business Analytics" },
        { key: "financial-reports", label: "Financial Reports" },
      ]
    }
  ]
};

// Helper to get all valid section keys
export const getAllAdminSections = (): string[] => {
  return ADMIN_DASHBOARD_CONFIG.menuItems.flatMap(
    item => item.subItems.map(subItem => subItem.key)
  );
};

// Helper to find menu item by section key
export const findMenuItemBySection = (sectionKey: string) => {
  for (const menuItem of ADMIN_DASHBOARD_CONFIG.menuItems) {
    const subItem = menuItem.subItems.find(sub => sub.key === sectionKey);
    if (subItem) {
      return {
        parentKey: menuItem.key,
        parentLabel: menuItem.label,
        parentIcon: menuItem.icon,
        ...subItem
      };
    }
  }
  return null;
};

// Helper to get breadcrumb for current section
export const getAdminBreadcrumb = (sectionKey: string) => {
  const menuItem = findMenuItemBySection(sectionKey);
  if (!menuItem) return [ADMIN_DASHBOARD_CONFIG.title];

  return [
    ADMIN_DASHBOARD_CONFIG.title,
    menuItem.parentLabel,
    menuItem.label
  ];
};



/**
 * 🔄 ADMIN MENU EVOLUTION EXAMPLES:
 *
 * Adding a new "Analytics" section:
 *
 * {
 *   key: "analytics",
 *   label: "Analytics",
 *   icon: "📈",
 *   subItems: [
 *     { key: "user-analytics", label: "User Analytics" },
 *     { key: "content-analytics", label: "Content Analytics" },
 *     { key: "performance-analytics", label: "Performance" },
 *     { key: "revenue-analytics", label: "Revenue" },
 *   ]
 * }
 *
 * Then add corresponding sections in AdminWorkArea.tsx:
 *
 * if (section === "user-analytics") {
 *   return (
 *     <WorkAreaWrapper>
 *       <VStack align="stretch" gap={4}>
 *         <Text fontSize="xl" fontWeight="bold">📈 User Analytics</Text>
 *         <UserAnalyticsDashboard />
 *       </VStack>
 *     </WorkAreaWrapper>
 *   );
 * }
 */
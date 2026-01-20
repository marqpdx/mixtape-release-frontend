// apps/mixtape/src/app/(authenticated)/admin/page.tsx

"use client";

import { useEffect, useCallback, useMemo } from "react";
import { Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserIdentity } from "@mixtape/core/types/auth";
import { ADMIN_DASHBOARD_CONFIG } from "@components/dashboard/admin/adminConfig";
import { SYSADMIN_DASHBOARD_CONFIG } from "@components/dashboard/types";
import DashboardLayout, { WorkAreaProps } from "@components/common/DashboardLayout";
import AdminWorkArea from "@components/dashboard/admin/AdminWorkArea";
import SysadminWorkArea from "@components/dashboard/sysadmin/SysadminWorkArea";
import { useUsers } from "@mixtape/api/hooks/useUsers";
import {
  useAdminSystemStats,
  useAdminUserMetrics,
  useAdminTodos,
  useCompleteAdminTodo,
} from "@mixtape/api/hooks/admin/useAdmin";

/**
 * ADMIN DASHBOARD
 *
 * Site-wide administration dashboard for system operators only.
 *
 * This dashboard is ONLY for people who run the entire site.
 * Group administration and content management should be accessed
 * through the member dashboard's expanded functionality.
 *
 * Features:
 * - System health monitoring
 * - Platform-wide user metrics
 * - Revenue and subscription management
 * - Site-wide content moderation
 * - Critical system settings
 *
 * ARCHITECTURE FOLLOWS MEMBER DASHBOARD PATTERN:
 * - Early auth checks to prevent unnecessary API calls
 * - Dynamic page titles
 * - Consistent component structure
 * - No auto-refresh intervals (manual refresh only)
 */
export default function AdminDashboard() {
  const { user, isLoading: identityLoading } = useAuth();

  const identity = user as UserIdentity | null;
  const isSuperuser = !!identity?.is_superuser;
  const isAdminReady = !!identity && isSuperuser;

  // Set dynamic title
  useEffect(() => {
    if (identity) {
      document.title = "System Admin - Mixtape Crossroads";
    }
  }, [identity]);

  const { data: systemStats = null } = useAdminSystemStats({
    enabled: isAdminReady,
  });
  const { data: userMetrics = null } = useAdminUserMetrics({
    enabled: isAdminReady,
  });
  const { data: todos = [], refetch: refetchTodos } = useAdminTodos({
    enabled: isAdminReady,
  });
  const completeTodo = useCompleteAdminTodo();
  const { users: allMembers = [] } = useUsers({ enabled: isAdminReady });

  const sysadminSectionKeys = useMemo(() => {
    return new Set(
      SYSADMIN_DASHBOARD_CONFIG.menuItems.flatMap((item) =>
        item.subItems?.map((subItem) => subItem.key) ?? []
      )
    );
  }, []);

  const mergedMenuItems = useMemo(() => {
    if (!isSuperuser) {
      return ADMIN_DASHBOARD_CONFIG.menuItems;
    }

    const adminSectionKeys = new Set(
      ADMIN_DASHBOARD_CONFIG.menuItems.flatMap((item) =>
        item.subItems?.map((subItem) => subItem.key) ?? []
      )
    );

    const sysadminMenuItems = SYSADMIN_DASHBOARD_CONFIG.menuItems
      .map((item) => ({
        ...item,
        subItems: item.subItems?.filter((subItem) => !adminSectionKeys.has(subItem.key)),
      }))
      .filter((item) => (item.subItems?.length ?? 0) > 0);

    return [...ADMIN_DASHBOARD_CONFIG.menuItems, ...sysadminMenuItems];
  }, [isSuperuser]);

  // Work area wrapper
  const WorkAreaWrapper = useCallback((props: WorkAreaProps) => {
    if (!identity) return null;
    if (sysadminSectionKeys.has(props.section)) {
      return <SysadminWorkArea {...props} identity={identity} />;
    }

    return (
      <AdminWorkArea
        {...props}
        identity={identity}
        todos={todos}
        onCompleteTodo={(id: number) => completeTodo.mutate(id)}
        onRefreshTodos={() => refetchTodos()}
        systemStats={systemStats}
        userMetrics={userMetrics}
        allMembers={allMembers}
      />
    );
  }, [
    identity,
    sysadminSectionKeys,
    todos,
    completeTodo,
    refetchTodos,
    systemStats,
    userMetrics,
    allMembers,
  ]);

  // EARLY RETURNS - after hooks
  if (identityLoading) {
    return <Text>Loading admin dashboard...</Text>;
  }

  if (!identity) {
    return <Text>Authentication required...</Text>;
  }

  if (!isSuperuser) {
    return <Text>Superuser access required.</Text>;
  }

  return (
    <DashboardLayout
      title="System Administration"
      menuItems={mergedMenuItems}
      defaultSection={ADMIN_DASHBOARD_CONFIG.defaultSection}
      localStorageKey={ADMIN_DASHBOARD_CONFIG.localStorageKey}
      WorkAreaComponent={WorkAreaWrapper}
      workAreaProps={{}}
      loading={identityLoading}
    />
  );
}

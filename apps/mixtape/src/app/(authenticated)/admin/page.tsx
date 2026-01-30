// apps/mixtape/src/app/(authenticated)/admin/page.tsx

"use client";

import { useEffect, useCallback } from "react";
import { Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserIdentity } from "@mixtape/core/types/auth";
import { ADMIN_DASHBOARD_CONFIG } from "@components/dashboard/types";
import DashboardLayout, { WorkAreaProps } from "@components/common/DashboardLayout";
import AdminWorkArea from "@components/dashboard/admin/AdminWorkArea";
import { useUsers } from "@mixtape/api/hooks/useUsers";
import { useAdminTodos, useCompleteAdminTodo } from "@mixtape/api/hooks/admin/useAdmin";

/**
 * ADMIN DASHBOARD
 *
 * Platform administration dashboard for superusers.
 *
 * Features:
 * - Platform snapshot (users, groups, todos)
 * - Quick actions
 * - Link to Sysadmin dashboard (/admin/sysadmin)
 *
 * Infrastructure monitoring is at /admin/sysadmin (separate page).
 */
export default function AdminDashboard() {
  const { user, isLoading: identityLoading } = useAuth();

  const identity = user as UserIdentity | null;
  const isSuperuser = !!identity?.is_superuser;
  const isAdminReady = !!identity && isSuperuser;

  // Set dynamic title
  useEffect(() => {
    if (identity) {
      document.title = "Admin - Mixtape Crossroads";
    }
  }, [identity]);

  // Data hooks
  const { data: todos = [], refetch: refetchTodos } = useAdminTodos({
    enabled: isAdminReady,
  });
  const completeTodo = useCompleteAdminTodo();
  const { users: allMembers = [] } = useUsers({ enabled: isAdminReady });

  // Work area wrapper
  const WorkAreaWrapper = useCallback(
    (props: WorkAreaProps) => {
      if (!identity) return null;

      return (
        <AdminWorkArea
          {...props}
          identity={identity}
          todos={todos}
          onCompleteTodo={(id: number) => completeTodo.mutate(id)}
          onRefreshTodos={() => refetchTodos()}
          allMembers={allMembers}
        />
      );
    },
    [identity, todos, completeTodo, refetchTodos, allMembers]
  );

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
      title={ADMIN_DASHBOARD_CONFIG.title}
      menuItems={ADMIN_DASHBOARD_CONFIG.menuItems}
      defaultSection={ADMIN_DASHBOARD_CONFIG.defaultSection}
      localStorageKey={ADMIN_DASHBOARD_CONFIG.localStorageKey}
      WorkAreaComponent={WorkAreaWrapper}
      workAreaProps={{}}
      loading={identityLoading}
    />
  );
}

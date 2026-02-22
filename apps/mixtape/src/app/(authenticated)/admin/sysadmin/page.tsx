// apps/mixtape/src/app/(authenticated)/admin/sysadmin/page.tsx

"use client";

import { Suspense, useEffect } from "react";
import { Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserIdentity } from "@mixtape/core/types/auth";
import { SYSADMIN_DASHBOARD_CONFIG } from "@components/dashboard/types";
import DashboardLayout, { WorkAreaProps } from "@components/common/DashboardLayout";
import SysadminWorkArea from "@components/dashboard/sysadmin/SysadminWorkArea";

/**
 * SYSADMIN DASHBOARD
 *
 * Infrastructure monitoring and operations dashboard.
 * Superuser-only access for platform operators.
 *
 * Features:
 * - System health overview
 * - Service status monitoring (Postgres, RabbitMQ, Celery, etc.)
 * - Resource usage (memory, disk, network)
 * - Process diagnostics
 * - Raw snapshot access
 *
 * Data source: /api/ops/summary and /api/ops/health-snapshot
 */
function SysadminDashboardClient() {
  const { user, isLoading: identityLoading } = useAuth();

  const identity = user as UserIdentity | null;
  const isSuperuser = !!identity?.is_superuser;

  // Set dynamic title
  useEffect(() => {
    if (identity) {
      document.title = "Sysadmin - Mixtape Crossroads";
    }
  }, [identity]);

  // Work area wrapper
  const WorkAreaWrapper = (props: WorkAreaProps) => {
    if (!identity) return null;
    return <SysadminWorkArea {...props} identity={identity} />;
  };

  // EARLY RETURNS - after hooks
  if (identityLoading) {
    return <Text>Loading sysadmin dashboard...</Text>;
  }

  if (!identity) {
    return <Text>Authentication required...</Text>;
  }

  if (!isSuperuser) {
    return <Text>Superuser access required.</Text>;
  }

  return (
    <DashboardLayout
      title={SYSADMIN_DASHBOARD_CONFIG.title}
      menuItems={SYSADMIN_DASHBOARD_CONFIG.menuItems}
      defaultSection={SYSADMIN_DASHBOARD_CONFIG.defaultSection}
      localStorageKey={SYSADMIN_DASHBOARD_CONFIG.localStorageKey}
      WorkAreaComponent={WorkAreaWrapper}
      workAreaProps={{}}
      loading={identityLoading}
    />
  );
}

export default function SysadminDashboard() {
  return (
    <Suspense fallback={<Text>Loading sysadmin dashboard...</Text>}>
      <SysadminDashboardClient />
    </Suspense>
  );
}

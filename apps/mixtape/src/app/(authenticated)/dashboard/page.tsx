// apps/mixtape/src/app/(authenticated)/dashboard/page.tsx

"use client";

import { useEffect, useMemo } from "react";
import { Text } from "@chakra-ui/react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useUserGroups } from "@mixtape/api/hooks/groups/useGroups";

import DashboardLayout from "@components/common/DashboardLayout";
import { MEMBER_DASHBOARD_CONFIG } from "@components/dashboard/member/memberConfig";
import MemberWorkArea from "@components/dashboard/member/MemberWorkArea";

/**
 * MEMBER DASHBOARD
 *
 * Main dashboard for community members. Provides access to:
 * - Personal profile and activity
 * - Writing tools (drafts, publishing, templates)
 * - Group participation and discovery
 * - Learning (EarthLab courses and achievements)
 * - Forum participation (Threadworks)
 *
 * TO ADD NEW MENU ITEMS:
 * Edit: src/components/dashboard/member/memberConfig.ts
 *
 * TO ADD NEW WORK AREA SECTIONS:
 * Edit: src/components/dashboard/member/MemberWorkArea.tsx
 */
export default function MemberDashboard() {
  // ==========================================
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  // ==========================================

  const { user: identity, isLoading: identityLoading } = useAuth();
  const { isLoading: groupsLoading } = useUserGroups();

  const defaultGroupName =
    process.env.NEXT_PUBLIC_DEFAULT_GROUP_NAME ||
    process.env.MIXTAPE_DEFAULT_GROUP_NAME ||
    "Crossroads";

  const userRoles = useMemo(() => {
    const roles: string[] = ["member"];
    if (identity?.is_staff || identity?.is_superuser) roles.push("admin");
    return roles;
  }, [identity]);

  const dashboardTitle = useMemo(() => {
    if (identity?.is_staff || identity?.is_superuser) return "Community Dashboard";
    return `Welcome back, ${identity?.first_name || identity?.username || ""}!`;
  }, [identity]);

  // Stable workAreaProps — only identity is needed by MemberWorkArea
  const workAreaProps = useMemo(() => ({
    identity: identity ?? undefined,
  }), [identity]);

  useEffect(() => {
    if (identity) {
      document.title = `Dashboard - ${defaultGroupName}`;
    }
  }, [identity, defaultGroupName]);

  // ==========================================
  // EARLY RETURNS (all hooks called above)
  // ==========================================

  if (identityLoading) {
    return <Text>Loading your dashboard...</Text>;
  }

  if (!identity) {
    return <Text>Authentication required...</Text>;
  }

  return (
    <DashboardLayout
      title={dashboardTitle}
      menuItems={MEMBER_DASHBOARD_CONFIG.menuItems}
      defaultSection={MEMBER_DASHBOARD_CONFIG.defaultSection}
      localStorageKey={MEMBER_DASHBOARD_CONFIG.localStorageKey}
      userRoles={userRoles}
      WorkAreaComponent={MemberWorkArea}
      workAreaProps={workAreaProps}
      loading={identityLoading || groupsLoading}
    />
  );
}

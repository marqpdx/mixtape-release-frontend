"use client";

import { Box } from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useGroup } from "@mixtape/api/hooks/groups/useGroups";
import { GroupAdminHeader } from "@components/groups/headers/GroupAdminHeader";
import GroupWorkArea from "@components/dashboard/group/GroupWorkArea";
import { getFilteredGroupMenuItems } from "@components/dashboard/group/groupConfig";
import DashboardLayout from "@components/common/DashboardLayout";
import { canUserModerateGroup, isGroupMember, getPrimaryRole } from "@mixtape/core/types/groupTypes";
import { recordGroupVisit } from "@mixtape/core/lib/groupVisitTracker";
import { getBestEmblemUrl } from "@mixtape/core/types/emblemTypes";
import { GroupMemberViewRenderer } from "@/components/groups/member-views/GroupMemberViewRenderer";
import { useMyPermissions } from "@mixtape/api/hooks/groups/useGroupPermissions";
import { GroupAdminView2WorkArea } from "@/components/groups/admin-view-2/GroupAdminView2WorkArea";
import { CircleParentBar } from "@/components/groups/CircleParentBar";
import { WorkAreaProps } from "@components/dashboard/shared/types";
import { GroupOnboardingTour } from "@/features/onboarding/GroupOnboardingTour";
import { canAccessSection } from "@/config/groupSectionPermissions";
import type { GroupLayoutVariant } from "@/components/groups/GroupLayoutSwitcher";
import {
  isGroupMemberViewId,
  normalizeGroupMemberViewId,
} from "@/components/groups/member-views/registry";

type ViewRole = "admin" | "member" | "public" | "ops";

interface GroupPageCoreProps {
  slug: string;
}

export function GroupPageCore({ slug }: GroupPageCoreProps) {
  const searchParams = useSearchParams();
  const urlView = searchParams.get("view") as ViewRole | null;
  const urlLayout = searchParams.get("layout") as GroupLayoutVariant | null;

  const { group, isLoading, refetch } = useGroup(slug);
  const { data: myPermissions, isLoading: permissionsLoading } = useMyPermissions(slug);

  const isMember = group ? isGroupMember(group) : false;
  const isAdminOrSteward =
    (group ? canUserModerateGroup(group) : false) ||
    (myPermissions?.roles?.includes("admin") ?? false) ||
    (myPermissions?.roles?.includes("steward") ?? false) ||
    ((myPermissions?.decorators?.length ?? 0) > 0);
  const primaryRole = group ? getPrimaryRole(group) : null;
  const canEditGroup = canAccessSection(
    "edit-group",
    myPermissions?.roles || [],
    myPermissions?.decorators || []
  );
  const canUseAdminView = isAdminOrSteward || canEditGroup;
  const isSuperuser =
    (myPermissions?.roles?.includes("owner") ?? false) ||
    (myPermissions?.roles?.includes("superuser") ?? false);

  useEffect(() => {
    if (group?.slug) recordGroupVisit(group.slug);
  }, [group?.slug]);

  const storageKey = useMemo(
    () => (group ? `group-${group.slug}-view` : null),
    [group]
  );
  const layoutStorageKey = useMemo(
    () => (group ? `group-${group.slug}-member-layout` : null),
    [group]
  );

  const [testRole, setTestRole] = useState<ViewRole>("public");
  const [layoutVariant, setLayoutVariant] = useState<GroupLayoutVariant>("c");
  const [didInit, setDidInit] = useState(false);
  const [didInitLayout, setDidInitLayout] = useState(false);

  const clampViewToPermissions = useCallback(
    (candidate: ViewRole): ViewRole => {
      if (candidate === "ops" && !isSuperuser) return canUseAdminView ? "admin" : isMember ? "member" : "public";
      if (canUseAdminView) return candidate;
      if (isMember) return candidate === "admin" ? "member" : candidate;
      return "public";
    },
    [canUseAdminView, isMember, isSuperuser]
  );

  const clampLayoutVariant = useCallback(
    (candidate: unknown): GroupLayoutVariant => normalizeGroupMemberViewId(candidate),
    []
  );

  useEffect(() => {
    if (!group) return;
    const fromUrl =
      urlView && ["admin", "member", "public", "ops"].includes(urlView)
        ? (urlView as ViewRole)
        : null;
    let fromStorage: ViewRole | null = null;
    if (storageKey && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw === "admin" || raw === "member" || raw === "public" || raw === "ops") fromStorage = raw;
      } catch { /* ignore */ }
    }
    const roleDefault: ViewRole = canUseAdminView ? "admin" : isMember ? "member" : "public";
    setTestRole(clampViewToPermissions(fromUrl ?? fromStorage ?? roleDefault));
    setDidInit(true);
  }, [group, canUseAdminView, isMember, storageKey, urlView, clampViewToPermissions]);

  useEffect(() => {
    if (!group) return;
    const fromUrl =
      urlLayout && isGroupMemberViewId(urlLayout) ? (urlLayout as GroupLayoutVariant) : null;
    let fromStorage: GroupLayoutVariant | null = null;
    if (layoutStorageKey && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(layoutStorageKey);
        if (isGroupMemberViewId(raw)) fromStorage = raw;
      } catch { /* ignore */ }
    }
    setLayoutVariant(clampLayoutVariant(fromUrl ?? fromStorage ?? "c"));
    setDidInitLayout(true);
  }, [group, layoutStorageKey, urlLayout, clampLayoutVariant]);

  useEffect(() => {
    if (!didInit || !storageKey) return;
    try { localStorage.setItem(storageKey, testRole); } catch { /* ignore */ }
  }, [didInit, storageKey, testRole]);

  useEffect(() => {
    if (!didInitLayout || !layoutStorageKey) return;
    try { localStorage.setItem(layoutStorageKey, layoutVariant); } catch { /* ignore */ }
  }, [didInitLayout, layoutStorageKey, layoutVariant]);

  const handleJoinGroup = async () => {
    try {
      console.warn("Join group functionality not implemented yet - backend endpoint needed");
      await refetch();
      setTestRole("member");
    } catch (err) {
      console.error("Failed to join group:", err);
    }
  };

  const effectiveRole: "admin" | "member" = testRole === "admin" ? "admin" : "member";
  const menuItems = useMemo(
    () =>
      group && myPermissions
        ? getFilteredGroupMenuItems(
            effectiveRole,
            myPermissions.roles || [],
            myPermissions.decorators || [],
            group.group_type || "community"
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveRole, myPermissions, group?.group_type, group?.slug]
  );

  if (isLoading) return <Box p={4}>Loading group...</Box>;
  if (!group) return <Box p={4}>Group not found.</Box>;

  const viewingAsAdmin = testRole === "admin";
  const viewingAsOps = testRole === "ops" && isSuperuser;
  const showAdminDashboard = canUseAdminView && viewingAsAdmin;
  const viewingAsMember = testRole === "member" || testRole === "admin" || testRole === "ops";

  const circleBar = <CircleParentBar group={group} />;
  const emblemUrl = getBestEmblemUrl(group.emblem) || undefined;

  if (viewingAsOps) {
    if (permissionsLoading || !myPermissions) return <Box p={4}>Loading...</Box>;

    return (
      <Box className="sixty-box" pt={0} px={2}>
        <GroupAdminHeader
          group={group}
          currentGroupSlug={slug}
          testRole={testRole}
          onRoleChange={(next) => setTestRole(clampViewToPermissions(next))}
          isAdminOrSteward={canUseAdminView}
          isSuperuser={isSuperuser}
          onOpsClick={() => setTestRole("ops")}
        />
        {circleBar}
        <GroupAdminView2WorkArea group={group} />
      </Box>
    );
  }

  if (showAdminDashboard) {
    if (permissionsLoading || !myPermissions) return <Box p={4}>Loading...</Box>;

    return (
      <Box className="sixty-box" pt={0} px={2}>
        <GroupOnboardingTour
          groupSlug={slug}
          groupTitle={group.title}
          groupEmblemUrl={emblemUrl}
          isMember={isMember}
        />
        <GroupAdminHeader
          group={group}
          currentGroupSlug={slug}
          testRole={testRole}
          onRoleChange={(next) => setTestRole(clampViewToPermissions(next))}
          isAdminOrSteward={canUseAdminView}
          isSuperuser={isSuperuser}
          onOpsClick={() => setTestRole("ops")}
        />
        {circleBar}
        <DashboardLayout
          title={group.title}
          menuItems={menuItems}
          WorkAreaComponent={GroupWorkArea as React.ComponentType<WorkAreaProps>}
          workAreaProps={{ group, userRole: effectiveRole }}
          defaultSection={menuItems[0]?.subItems?.[0]?.key || menuItems[0]?.key}
          localStorageKey={`group-${group.slug}-dashboard`}
        />
      </Box>
    );
  }

  return (
    <Box className="sixty-box" pt={0} px={2}>
      <GroupOnboardingTour
        groupSlug={slug}
        groupTitle={group.title}
        groupEmblemUrl={emblemUrl}
        isMember={isMember}
      />
      {circleBar}
      <GroupMemberViewRenderer
        group={group}
        userRole={primaryRole}
        onJoinGroup={handleJoinGroup}
        testRole={testRole === "ops" ? "admin" : testRole}
        onRoleChange={(next) => setTestRole(clampViewToPermissions(next))}
        isMember={isMember}
        isAdminOrSteward={canUseAdminView}
        canEditGroup={canEditGroup}
        layoutVariant={layoutVariant}
        onLayoutChange={viewingAsMember ? (next) => setLayoutVariant(clampLayoutVariant(next)) : undefined}
      />
    </Box>
  );
}

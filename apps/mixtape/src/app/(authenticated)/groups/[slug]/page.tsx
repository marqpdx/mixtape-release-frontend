// apps/mixtape/src/app/(authenticated)/groups/[slug]/page.tsx

"use client";

import { Box } from "@chakra-ui/react";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useGroup } from "@mixtape/api/hooks/groups/useGroups";
import { GroupAdminHeader } from "@components/groups/headers/GroupAdminHeader";
import GroupWorkArea from "@components/dashboard/group/GroupWorkArea";
import { getFilteredGroupMenuItems } from "@components/dashboard/group/groupConfig";
import DashboardLayout from "@components/common/DashboardLayout";
import { canUserModerateGroup, isGroupMember, getPrimaryRole } from "@mixtape/core/types/groupTypes";
import { getBestEmblemUrl } from "@mixtape/core/types/emblemTypes";
import { GroupMemberViewRenderer } from "@/components/groups/member-views/GroupMemberViewRenderer";
import { useMyPermissions } from "@mixtape/api/hooks/groups/useGroupPermissions";
import { CircleParentBar } from "@/components/groups/CircleParentBar";
import { WorkAreaProps } from "@components/dashboard/shared/types";
import { GroupOnboardingTour } from "@/features/onboarding/GroupOnboardingTour";
import { canAccessSection } from "@/config/groupSectionPermissions";
import type { GroupLayoutVariant } from "@/components/groups/GroupLayoutSwitcher";
import {
  isGroupMemberViewId,
  normalizeGroupMemberViewId,
} from "@/components/groups/member-views/registry";

type ViewRole = "admin" | "member" | "public";

export default function GroupPage() {
  const { slug } = useParams();
  const slugStr = Array.isArray(slug) ? slug[0] : (slug as string);
  const searchParams = useSearchParams();
  const urlView = searchParams.get("view") as ViewRole | null;
  const urlLayout = searchParams.get("layout") as GroupLayoutVariant | null;

  const { group, isLoading, refetch } = useGroup(slugStr);

  // Fetch user's permissions for this group
  const { data: myPermissions, isLoading: permissionsLoading } = useMyPermissions(slugStr);

  const isMember = group ? isGroupMember(group) : false;
  const isAdminOrSteward = group ? canUserModerateGroup(group) : false;
  const primaryRole = group ? getPrimaryRole(group) : null;
  const canEditGroup = canAccessSection(
    "edit-group",
    myPermissions?.roles || [],
    myPermissions?.decorators || []
  );
  const canUseAdminView = isAdminOrSteward || canEditGroup;

  // One canonical storage key (once group is known)
  const storageKey = useMemo(
    () => (group ? `group-${group.slug}-view` : null),
    [group]
  );
  const layoutStorageKey = useMemo(
    () => (group ? `group-${group.slug}-member-layout` : null),
    [group]
  );

  // console.log("aaa GroupPage debug:", { slugStr, group, isMember, isAdmin, isSteward, primaryRole, roles });

  // UI state: what view to render as
  const [testRole, setTestRole] = useState<ViewRole>("public");
  const [layoutVariant, setLayoutVariant] = useState<GroupLayoutVariant>("a");

  // Flag to prevent the "early overwrite" of localStorage
  const [didInit, setDidInit] = useState(false);
  const [didInitLayout, setDidInitLayout] = useState(false);

  // Helper: validate a candidate view for current permissions
  const clampViewToPermissions = useCallback((candidate: ViewRole): ViewRole => {
    if (canUseAdminView) return candidate;
    if (isMember) return candidate === "admin" ? "member" : candidate; // members: no admin
    return "public"; // public: only public
  }, [canUseAdminView, isMember]);
  const clampLayoutVariant = useCallback((candidate: unknown): GroupLayoutVariant => {
    return normalizeGroupMemberViewId(candidate);
  }, []);

  // Decide initial view (reads localStorage *after* group is available)
  useEffect(() => {
    if (!group) return;

    // Priority 1: explicit ?view= override
    const fromUrl = urlView && ["admin", "member", "public"].includes(urlView)
      ? (urlView as ViewRole)
      : null;

    // Priority 2: saved preference
    let fromStorage: ViewRole | null = null;
    if (storageKey && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw === "admin" || raw === "member" || raw === "public") {
          fromStorage = raw;
        }
      } catch {
        // ignore storage errors
      }
    }

    // Priority 3: role-based default
    const roleDefault: ViewRole = canUseAdminView ? "admin" : isMember ? "member" : "public";

    const chosen = clampViewToPermissions(fromUrl ?? fromStorage ?? roleDefault);

    setTestRole(chosen);
    setDidInit(true); // allow subsequent saves
  }, [group, canUseAdminView, isMember, storageKey, urlView, clampViewToPermissions]);

  useEffect(() => {
    if (!group) return;

    const fromUrl =
      urlLayout && isGroupMemberViewId(urlLayout)
        ? (urlLayout as GroupLayoutVariant)
        : null;

    let fromStorage: GroupLayoutVariant | null = null;
    if (layoutStorageKey && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(layoutStorageKey);
        if (isGroupMemberViewId(raw)) {
          fromStorage = raw;
        }
      } catch {
        // ignore storage errors
      }
    }

    setLayoutVariant(clampLayoutVariant(fromUrl ?? fromStorage ?? "a"));
    setDidInitLayout(true);
  }, [group, layoutStorageKey, urlLayout, clampLayoutVariant]);

  // Persist preference only *after* initialization
  useEffect(() => {
    if (!didInit || !storageKey) return;
    try {
      localStorage.setItem(storageKey, testRole);
    } catch {
      // ignore storage errors
    }
  }, [didInit, storageKey, testRole]);

  useEffect(() => {
    if (!didInitLayout || !layoutStorageKey) return;
    try {
      localStorage.setItem(layoutStorageKey, layoutVariant);
    } catch {
      // ignore storage errors
    }
  }, [didInitLayout, layoutStorageKey, layoutVariant]);

  const handleJoinGroup = async () => {
    try {
      // TODO: Add joinGroup function to groupApi when backend endpoint is implemented
      // Backend endpoint /api/groups/{slug}/join doesn't exist yet in Phase 2
      // For now, this is a placeholder that should request membership
      console.warn("Join group functionality not implemented yet - backend endpoint needed");
      await refetch();
      setTestRole("member");
    } catch (err) {
      console.error("Failed to join group:", err);
    }
  };

  if (isLoading) return <Box p={4}>Loading group...</Box>;
  if (!group) return <Box p={4}>Group not found.</Box>;

  const viewingAsAdmin = testRole === "admin";
  const showAdminDashboard = canUseAdminView && viewingAsAdmin;
  const viewingAsMember = testRole === "member" || testRole === "admin";

  // Circle parent context bar (shown for all views)
  const circleBar = <CircleParentBar group={group} />;

  const emblemUrl = getBestEmblemUrl(group.emblem) || undefined;

  if (showAdminDashboard) {
    // Wait for permissions before building the menu — without them filterMenuByPermissions
    // produces a sparse/empty menu that causes DashboardLayout's guard to reset activeSection
    // to a hidden section not in SECTION_PERMISSIONS, producing an "Access Denied" flash.
    if (permissionsLoading || !myPermissions) {
      return <Box p={4}>Loading...</Box>;
    }

    const effectiveRole: "admin" | "member" = testRole === "admin" ? "admin" : "member";

    // Filter menu items based on user's permissions and group type
    const menuItems = getFilteredGroupMenuItems(
      effectiveRole,
      myPermissions?.roles || [],
      myPermissions?.decorators || [],
      group.group_type || 'community'
    );

    return (
      <Box className="sixty-box" pt={0} px={2}>
        <GroupOnboardingTour
          groupSlug={slugStr}
          groupTitle={group.title}
          groupEmblemUrl={emblemUrl}
          isMember={isMember}
        />
        <GroupAdminHeader
          group={group}
          currentGroupSlug={slugStr}
          testRole={testRole}
          onRoleChange={(next) => setTestRole(clampViewToPermissions(next))}
          isAdminOrSteward={canUseAdminView}
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

  // Member or Public landing
  return (
    <Box className="sixty-box" pt={0} px={2}>
      <GroupOnboardingTour
        groupSlug={slugStr}
        groupTitle={group.title}
        groupEmblemUrl={emblemUrl}
        isMember={isMember}
      />
      {circleBar}
      <GroupMemberViewRenderer
        group={group}
        userRole={primaryRole}
        onJoinGroup={handleJoinGroup}
        testRole={testRole}
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

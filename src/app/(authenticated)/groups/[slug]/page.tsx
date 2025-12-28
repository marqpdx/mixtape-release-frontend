// src/app/(authenticate)/groups/[slug]/page.tsx

"use client";

import { Box } from "@chakra-ui/react";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useGroup } from "@/hooks/groups/useGroups";
import { GroupAdminHeader } from "@components/groups/headers/GroupAdminHeader";
import GroupWorkArea from "@components/dashboard/group/GroupWorkArea";
import { getFilteredGroupMenuItems } from "@components/dashboard/group/groupConfig";
import DashboardLayout from "@components/common/DashboardLayout";
import { hasRole, canUserModerateGroup, isGroupMember, getPrimaryRole } from "@mixtape/core/types/groupTypes";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserIdentity } from "@mixtape/core/types/auth";
import { GroupLanding } from "@/components/groups/layout/GroupLanding";
import { useMyPermissions } from "@/hooks/groups/useGroupPermissions";
import { CircleParentBar } from "@/components/groups/CircleParentBar";

type ViewRole = "admin" | "member" | "public";

export default function GroupPage() {
  const { slug } = useParams();
  const slugStr = Array.isArray(slug) ? slug[0] : (slug as string);
  const searchParams = useSearchParams();
  const urlView = searchParams.get("view") as ViewRole | null;

  const { user: identity } = useAuth();
  const { group, isLoading, refetch } = useGroup(slugStr);

  // Fetch user's permissions for this group
  const { data: myPermissions } = useMyPermissions(slugStr);

  const isMember = group ? isGroupMember(group) : false;
  const isAdmin = group ? hasRole(group, "admin") : false;
  const isSteward = group ? hasRole(group, "steward") : false;
  const isAdminOrSteward = group ? canUserModerateGroup(group) : false;
  const primaryRole = group ? getPrimaryRole(group) : null;
  const roles = group?.user_roles || [];

  // One canonical storage key (once group is known)
  const storageKey = useMemo(
    () => (group ? `group-${group.slug}-view` : null),
    [group]
  );

  // console.log("aaa GroupPage debug:", { slugStr, group, isMember, isAdmin, isSteward, primaryRole, roles });

  // UI state: what view to render as
  const [testRole, setTestRole] = useState<ViewRole>("public");

  // Flag to prevent the "early overwrite" of localStorage
  const [didInit, setDidInit] = useState(false);

  // Helper: validate a candidate view for current permissions
  const clampViewToPermissions = (candidate: ViewRole): ViewRole => {
    if (isAdminOrSteward) return candidate; // admins/stewards can see any
    if (isMember) return candidate === "admin" ? "member" : candidate; // members: no admin
    return "public"; // public: only public
  };

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
    const roleDefault: ViewRole = isAdminOrSteward ? "admin" : isMember ? "member" : "public";

    const chosen = clampViewToPermissions(fromUrl ?? fromStorage ?? roleDefault);

    setTestRole(chosen);
    setDidInit(true); // allow subsequent saves
  }, [group, isAdminOrSteward, isMember, storageKey, urlView]);

  // Persist preference only *after* initialization
  useEffect(() => {
    if (!didInit || !storageKey) return;
    try {
      localStorage.setItem(storageKey, testRole);
    } catch {
      // ignore storage errors
    }
  }, [didInit, storageKey, testRole]);

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
  const showAdminDashboard = isAdminOrSteward && viewingAsAdmin;

  // Circle parent context bar (shown for all views)
  const circleBar = <CircleParentBar group={group} />;

  if (showAdminDashboard) {
    const effectiveRole: "admin" | "member" = testRole === "admin" ? "admin" : "member";

    // Filter menu items based on user's permissions and group type
    const menuItems = getFilteredGroupMenuItems(
      effectiveRole,
      myPermissions?.roles || [],
      myPermissions?.decorators || [],
      group.group_type || 'community'
    );

    const WrappedGroupWorkArea = (props: any) => (
      <GroupWorkArea {...props} group={group} identity={identity} userRole={effectiveRole} />
    );

    return (
      <Box className="sixty-box" pt={0} px={2}>
        <GroupAdminHeader
          group={group}
          currentGroupSlug={slugStr}
          testRole={testRole}
          onRoleChange={(next) => setTestRole(clampViewToPermissions(next))}
          isAdminOrSteward={isAdminOrSteward}
        />
        {circleBar}
        <DashboardLayout
          title={group.title}
          menuItems={menuItems}
          WorkAreaComponent={WrappedGroupWorkArea}
          defaultSection={menuItems[0]?.subItems?.[0]?.key || menuItems[0]?.key}
          localStorageKey={`group-${group.slug}-dashboard`}
        />
      </Box>
    );
  }

  // Member or Public landing
  return (
    <Box className="sixty-box" pt={0} px={2}>
      {circleBar}
      <GroupLanding
        group={group}
        userRole={primaryRole as any}
        onJoinGroup={handleJoinGroup}
        testRole={testRole}
        onRoleChange={(next) => setTestRole(clampViewToPermissions(next))}
        isMember={isMember}
        isAdminOrSteward={isAdminOrSteward}
      />
    </Box>
  );
}

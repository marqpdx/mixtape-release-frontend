"use client";

import type { Group } from "@mixtape/core/types/groupTypes";
import { GroupLanding } from "../layout/GroupLanding";
import { GroupLandingB } from "../memberview-b/GroupLandingB";
import type { GroupLayoutVariant } from "../GroupLayoutSwitcher";

interface GroupMemberViewRendererProps {
  group: Group;
  userRole?: "admin" | "steward" | "member" | null;
  onJoinGroup?: () => void;
  testRole?: "admin" | "member" | "public" | null;
  onRoleChange?: (role: "admin" | "member" | "public") => void;
  isMember: boolean;
  isAdminOrSteward: boolean;
  canEditGroup: boolean;
  layoutVariant: GroupLayoutVariant;
  onLayoutChange?: (layout: GroupLayoutVariant) => void;
}

export function GroupMemberViewRenderer({
  group,
  userRole,
  onJoinGroup,
  testRole,
  onRoleChange,
  isMember,
  isAdminOrSteward,
  canEditGroup,
  layoutVariant,
  onLayoutChange,
}: GroupMemberViewRendererProps) {
  const viewingAsMember = testRole === "member" || testRole === "admin";

  if (viewingAsMember && layoutVariant === "b") {
    return (
      <GroupLandingB
        group={group}
        testRole={testRole}
        onRoleChange={onRoleChange}
        isMember={isMember}
        isAdminOrSteward={isAdminOrSteward}
        canEditGroup={canEditGroup}
        layoutVariant={layoutVariant}
        onLayoutChange={onLayoutChange}
      />
    );
  }

  return (
    <GroupLanding
      group={group}
      userRole={userRole}
      onJoinGroup={onJoinGroup}
      testRole={testRole}
      onRoleChange={onRoleChange}
      isMember={isMember}
      isAdminOrSteward={isAdminOrSteward}
      canEditGroup={canEditGroup}
      layoutVariant={layoutVariant}
      onLayoutChange={viewingAsMember ? onLayoutChange : undefined}
    />
  );
}

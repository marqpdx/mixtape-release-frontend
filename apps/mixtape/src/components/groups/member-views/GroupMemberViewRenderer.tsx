"use client";

import type { Group } from "@mixtape/core/types/groupTypes";
import { GroupLanding } from "../layout/GroupLanding";
import { GroupLandingD } from "../memberview-d/GroupLandingD";
import type { GroupLayoutVariant } from "../GroupLayoutSwitcher";

interface GroupMemberViewRendererProps {
  group: Group;
  userRole?: "admin" | "steward" | "member" | null;
  onJoinGroup?: () => void;
  testRole?: "admin" | "member" | "public" | null;
  onRoleChange?: (role: "admin" | "member" | "public") => void;
  isMember: boolean;
  isAdminOrSteward: boolean;
  isGroupAdmin?: boolean;
  canEditGroup: boolean;
  isSuperuser?: boolean;
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
  isGroupAdmin = false,
  canEditGroup,
  isSuperuser = false,
  layoutVariant,
  onLayoutChange,
}: GroupMemberViewRendererProps) {
  const viewingAsMember = testRole === "member" || testRole === "admin";

  // D is the live member view — A/B/C stay registered as references.
  if (viewingAsMember) {
    return (
      <GroupLandingD
        group={group}
        testRole={testRole}
        onRoleChange={onRoleChange}
        isMember={isMember}
        isAdminOrSteward={isAdminOrSteward}
        isGroupAdmin={isGroupAdmin}
        canEditGroup={canEditGroup}
        isSuperuser={isSuperuser}
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
      onLayoutChange={onLayoutChange}
    />
  );
}

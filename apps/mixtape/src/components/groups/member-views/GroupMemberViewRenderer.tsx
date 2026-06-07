"use client";

import type { Group } from "@mixtape/core/types/groupTypes";
import { GroupLanding } from "../layout/GroupLanding";
import { GroupLandingC } from "../memberview-c/GroupLandingC";
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

  // C is the unified, only member view now — A/B stay registered as references
  // but are no longer reachable from here (see member-views/registry.ts).
  if (viewingAsMember) {
    return (
      <GroupLandingC
        group={group}
        testRole={testRole}
        onRoleChange={onRoleChange}
        isMember={isMember}
        isAdminOrSteward={isAdminOrSteward}
        canEditGroup={canEditGroup}
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

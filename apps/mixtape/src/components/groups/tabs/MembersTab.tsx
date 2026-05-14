// apps/mixtape/src/components/groups/tabs/MembersTab.tsx

"use client";

import { Box, Text } from "@chakra-ui/react";
import type { Group, GroupMembership } from "@mixtape/core/types/groupTypes";
import { canUserModerateGroup } from "@mixtape/core/types/groupTypes";
import { useMembers } from "@mixtape/api/hooks";
import { GroupMemberList } from "@/components/groups/members/GroupMemberList";

export function MembersTab({ group }: { group: Group }) {
  const { members, isLoading, error } = useMembers(group.slug);
  const isAdminOrSteward = canUserModerateGroup(group);

  const canEditMember = (membership: GroupMembership): boolean => {
    if (!isAdminOrSteward) return false;
    // Don't allow removing yourself or other admins (unless you're admin)
    const userRoles = group.user_roles || [];
    const isAdmin = userRoles.includes("admin");
    const memberIsAdmin = membership.roles.includes("admin");
    if (memberIsAdmin && !isAdmin) return false;
    return true;
  };

  return (
    <Box>
      {error && (
        <Text color="fg.muted" mb={4}>
          Unable to load members right now.
        </Text>
      )}
      <GroupMemberList
        group={group}
        members={members}
        isLoading={isLoading}
        error={error?.message ?? null}
        canEditMember={canEditMember}
      />
    </Box>
  );
}

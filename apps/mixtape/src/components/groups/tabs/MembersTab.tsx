// apps/mixtape/src/components/groups/tabs/MembersTab.tsx

"use client";

import { Box, Heading, Text } from "@chakra-ui/react";
import type { Group } from "@mixtape/core/types/groupTypes";
import { useMembers } from "@mixtape/api/hooks";
import { GroupMemberList } from "@/components/groups/members/GroupMemberList";

export function MembersTab({ group }: { group: Group }) {
  const { members, isLoading, error } = useMembers(group.slug);

  return (
    <Box>
      <Heading size="lg" mb={4}>
        Group Members
      </Heading>
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
      />
    </Box>
  );
}

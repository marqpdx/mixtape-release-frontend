"use client";

import { useMemo } from "react";
import { Avatar, Box, Flex, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useUserGroups, useGroupMembers } from "@mixtape/api/hooks/groups/useGroups";
import type { UserIdentity } from "@mixtape/core/types/auth";
import DashboardCard from "./DashboardCard";

interface PeopleInSphereCardProps {
  identity: UserIdentity;
}

export default function PeopleInSphereCard({ identity }: PeopleInSphereCardProps) {
  const { groups, isLoading: groupsLoading } = useUserGroups();

  // Take first 3 groups to limit API calls
  const slugs = groups.slice(0, 3).map((g) => g.slug);

  const { members: members0, isLoading: l0 } = useGroupMembers(slugs[0] ?? null);
  const { members: members1, isLoading: l1 } = useGroupMembers(slugs[1] ?? null);
  const { members: members2, isLoading: l2 } = useGroupMembers(slugs[2] ?? null);

  const isLoading = groupsLoading || l0 || l1 || l2;

  const people = useMemo(() => {
    const all = [...members0, ...members1, ...members2];
    const seen = new Set<string>();
    const result: { id: string; username: string; displayName: string; avatar?: string }[] = [];

    for (const m of all) {
      if (!m.username || m.username === identity.username) continue;
      if (seen.has(m.username)) continue;
      seen.add(m.username);
      result.push({
        id: m.member_id,
        username: m.username,
        displayName: m.display_name || m.username,
        avatar: m.profile_image,
      });
      if (result.length >= 8) break;
    }
    return result;
  }, [members0, members1, members2, identity.username]);

  const hoverBg = useColorModeValue("gray.100", "gray.700");

  return (
    <DashboardCard
      title="People in My Sphere"
      isLoading={isLoading}
      isEmpty={people.length === 0}
      emptyMessage="Join groups to see people in your sphere"
    >
      <Flex wrap="wrap" gap={3} py={1}>
        {people.map((person) => (
          <Box
            key={person.id}
            textAlign="center"
            cursor="pointer"
            onClick={() => { window.location.href = `/app/member/${person.username}`; }}
            px={2}
            py={1.5}
            borderRadius="md"
            _hover={{ bg: hoverBg }}
            transition="background 0.15s"
            title={person.displayName}
          >
            <Avatar.Root size="md">
              {person.avatar && <Avatar.Image src={person.avatar} />}
              <Avatar.Fallback>{person.displayName.charAt(0)}</Avatar.Fallback>
            </Avatar.Root>
            <Text fontSize="xs" mt={1} lineClamp={1} maxW="60px">
              {person.displayName}
            </Text>
          </Box>
        ))}
      </Flex>
    </DashboardCard>
  );
}

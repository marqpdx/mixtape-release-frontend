"use client";

import { Box, HStack, Text, VStack, Badge } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useUserGroups } from "@mixtape/api/hooks/groups/useGroups";
import type { UserIdentity } from "@mixtape/core/types/auth";
import DashboardCard from "./DashboardCard";

interface MyGroupsCardProps {
  identity: UserIdentity;
  onViewAll: () => void;
}

export default function MyGroupsCard({ identity, onViewAll }: MyGroupsCardProps) {
  void identity;
  const { groups, isLoading } = useUserGroups();

  const sorted = [...groups]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 4);

  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const countColor = useColorModeValue("gray.500", "gray.400");

  const getRoleBadge = (roles: string[] | null) => {
    if (!roles) return null;
    if (roles.includes("owner")) return <Badge size="sm" colorPalette="purple">Owner</Badge>;
    if (roles.includes("admin")) return <Badge size="sm" colorPalette="orange">Admin</Badge>;
    if (roles.includes("steward")) return <Badge size="sm" colorPalette="teal">Steward</Badge>;
    return null;
  };

  return (
    <DashboardCard
      title="My Groups"
      viewAllOnClick={onViewAll}
      isLoading={isLoading}
      isEmpty={sorted.length === 0}
      emptyMessage="Join a group to get started"
    >
      <VStack gap={0} align="stretch">
        {sorted.map((group) => (
          <HStack
            key={group.id}
            px={2}
            py={2}
            borderRadius="md"
            _hover={{ bg: hoverBg }}
            cursor="pointer"
            onClick={() => { window.location.href = `/app/group/${group.slug}/admin`; }}
            gap={3}
          >
            <Box flex="1" minW={0}>
              <HStack gap={2}>
                <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                  {group.title}
                </Text>
                {getRoleBadge(group.user_roles)}
              </HStack>
            </Box>
            {group.member_count != null && (
              <Text fontSize="xs" color={countColor} flexShrink={0}>
                {group.member_count} members
              </Text>
            )}
          </HStack>
        ))}
      </VStack>
    </DashboardCard>
  );
}

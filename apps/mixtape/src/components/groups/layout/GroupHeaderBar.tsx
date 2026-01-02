// src/components/groups/GroupHeaderBar.tsx

"use client";

import { Box, Text, HStack, IconButton } from "@chakra-ui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  IconUsers,
  IconBuildingCommunity,
  IconCircleDot,
  IconUserCircle,
  IconNetwork
} from "@tabler/icons-react";
import { useUserGroups } from "@mixtape/api/hooks/groups/useGroups";
import { GroupType } from "@mixtape/core/types/groupTypes";
import { GroupAdminRoleSwitcher } from "../utils/GroupAdminRoleSwitcher";

interface GroupHeaderBarProps {
  currentGroupSlug: string;
  groupTitle: string;
  groupType?: GroupType;
  userRole?: 'admin' | 'member' | 'public' | null;
  testRole?: 'admin' | 'member' | 'public' | null;
  onRoleChange?: (role: 'admin' | 'member' | 'public' | null) => void;
}

const GROUP_TYPE_ICONS = {
  community: IconBuildingCommunity,  // Multiple people, can contain circles
  circle: IconCircleDot,             // Smallest unit, contained within
  persona: IconUserCircle,           // Individual identity/brand
  coalition: IconNetwork,            // Connected groups working together
};

export function GroupHeaderBar({
  currentGroupSlug,
  groupTitle,
  groupType = 'community',
  userRole,
  testRole,
  onRoleChange
}: GroupHeaderBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const { groups: myGroups, isLoading: myGroupsLoading } = useUserGroups();

  const otherGroups = myGroups.filter(g => g.slug !== currentGroupSlug);

  const GroupTypeIcon = GROUP_TYPE_ICONS[groupType] || IconBuildingCommunity;
  const isAdmin = ['admin', 'steward'].includes(userRole || '');

  return (
    <Box
      className="group-header-bar"
      position="sticky"
      top={0}
      bg="white"
      zIndex={100}
      borderBottom="1px solid"
      borderColor="gray.200"
      px={4}
      py={2}
    >
      <HStack justify="space-between">
        {/* Left: Group Name + Type Icon */}
        <HStack gap={2}>
          <GroupTypeIcon size={20} color="gray.600" />
          <Text fontWeight="semibold" fontSize="lg">
            {groupTitle}
          </Text>
        </HStack>

        {/* Right: Group Switcher + Role Switcher */}
        <HStack gap={2}>
          {/* Group Switcher Dropdown */}
          {!myGroupsLoading && otherGroups.length > 0 && (
            <Box position="relative">
              <IconButton
                aria-label="Switch group"
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
              >
                <IconUsers size={18} />
              </IconButton>

              {isOpen && (
                <>
                  <Box
                    position="fixed"
                    inset={0}
                    zIndex={999}
                    onClick={() => setIsOpen(false)}
                  />
                  <Box
                    position="absolute"
                    top="100%"
                    right={0}
                    mt={1}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    boxShadow="lg"
                    minW="200px"
                    maxH="300px"
                    overflowY="auto"
                    zIndex={1000}
                  >
                    <Box px={3} py={2} borderBottom="1px solid" borderColor="gray.100">
                      <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                        SWITCH TO
                      </Text>
                    </Box>
                    {otherGroups.map((group) => (
                      <Box
                        key={group.id}
                        px={3}
                        py={2}
                        cursor="pointer"
                        _hover={{ bg: "gray.50" }}
                        onClick={() => {
                          router.push(`/groups/${group.slug}`);
                          setIsOpen(false);
                        }}
                      >
                        <Text fontSize="sm">{group.title}</Text>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          )}

          {/* Role Switcher (Admin/Steward only) */}
          {isAdmin && onRoleChange && (
            <Box className="role-switcher" position="relative">

              <GroupAdminRoleSwitcher
                testRole={testRole}
                onRoleChange={onRoleChange}
              />

            </Box>
          )}
        </HStack>
      </HStack>
    </Box>
  );
}

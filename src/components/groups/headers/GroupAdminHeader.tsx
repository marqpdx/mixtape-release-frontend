// src/components/groups/headers/GroupAdminHeader.tsx

"use client";

import { Box, Container, Flex, Heading, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { GroupHeaderWrapper } from "../GroupHeaderWrapper";
import {
  IconBuildingCommunity,
  IconCircleDot,
  IconUserCircle,
  IconNetwork,
} from "@tabler/icons-react";

const GROUP_TYPE_ICONS = {
  community: IconBuildingCommunity,
  circle: IconCircleDot,
  persona: IconUserCircle,
  coalition: IconNetwork,
};

interface GroupAdminHeaderProps {
  group: any;
  currentGroupSlug: string;
  testRole?: 'admin' | 'member' | 'public' | null;
  onRoleChange?: (role: 'admin' | 'member' | 'public') => void;
  isAdminOrSteward?: boolean;
}

export function GroupAdminHeader({
  group,
  currentGroupSlug,
  testRole,
  onRoleChange,
  isAdminOrSteward = false,
}: GroupAdminHeaderProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.400');

  const GroupTypeIcon = GROUP_TYPE_ICONS[group.group_type as keyof typeof GROUP_TYPE_ICONS] || IconBuildingCommunity;

  return (
    <GroupHeaderWrapper
      showRoleSwitcher={true}
      testRole={testRole}
      onRoleChange={onRoleChange}
      isAdminOrSteward={isAdminOrSteward}
    >
      <Box bg={cardBg} borderBottomWidth="1px" borderColor={borderColor} py={4}>
        <Container maxW="7xl">
          <Flex alignItems="center" gap={3}>
            <GroupTypeIcon size={20} style={{ color: 'var(--chakra-colors-gray-500)' }} />
            <Heading size="lg">{group.title}</Heading>
            <Text color={textColor} fontSize="sm">
              • Admin Dashboard
            </Text>
          </Flex>
        </Container>
      </Box>
    </GroupHeaderWrapper>
  );
}
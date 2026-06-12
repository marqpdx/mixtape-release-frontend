// src/components/groups/headers/GroupAdminHeader.tsx

"use client";

import { Box, Container, Flex, Heading, Text } from "@chakra-ui/react";
import {
  IconBuildingCommunity,
  IconCircleDot,
  IconUserCircle,
  IconNetwork,
} from "@tabler/icons-react";
import { GroupHeaderWrapper } from "../layout/GroupHeaderWrapper";

const GROUP_TYPE_ICONS = {
  community: IconBuildingCommunity,
  circle: IconCircleDot,
  persona: IconUserCircle,
  coalition: IconNetwork,
};

interface GroupAdminHeaderProps {
  group: { title: string; group_type?: string };
  currentGroupSlug: string;
  testRole?: 'admin' | 'member' | 'public' | 'ops' | null;
  onRoleChange?: (role: 'admin' | 'member' | 'public') => void;
  isAdminOrSteward?: boolean;
  isSuperuser?: boolean;
  onOpsClick?: () => void;
}

export function GroupAdminHeader({
  group,
  currentGroupSlug,
  testRole,
  onRoleChange,
  isAdminOrSteward = false,
  isSuperuser = false,
  onOpsClick,
}: GroupAdminHeaderProps) {
  void currentGroupSlug;
  const borderColor = "theme.border";
  const textColor = "theme.textSecondary";

  const GroupTypeIcon = GROUP_TYPE_ICONS[group.group_type as keyof typeof GROUP_TYPE_ICONS] || IconBuildingCommunity;

  return (
    <GroupHeaderWrapper
      showRoleSwitcher={true}
      testRole={testRole}
      onRoleChange={onRoleChange}
      isAdminOrSteward={isAdminOrSteward}
      isSuperuser={isSuperuser}
      onOpsClick={onOpsClick}
    >
      <Box bg="transparent" borderBottomWidth="1px" borderColor={borderColor} py={4}>
        <Container maxW="7xl">
          <Flex alignItems="center" gap={3}>
            <GroupTypeIcon size={23} style={{ color: "var(--theme-text-secondary)" }} />
            <Heading size="xl">{group.title}</Heading>
            <Text color={textColor} fontSize="sm">
              • Admin Dashboard!
            </Text>
          </Flex>
        </Container>
      </Box>
    </GroupHeaderWrapper>
  );
}

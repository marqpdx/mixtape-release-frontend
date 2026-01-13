// apps/mixtape/src/components/groups/layout/GroupLanding.tsx

import { useColorModeValue } from "@components/ui/color-mode";
import { Box, Container } from "@chakra-ui/react";
import { GroupMemberHeader } from "../headers/GroupMemberHeader";
import { GroupPublicHeader } from "../headers/GroupPublicHeader";
import { GroupTabs } from "../tabs/GroupTabs";
import type { Group } from "@mixtape/core/types/groupTypes";

interface GroupLandingProps {
  group: Group;
  userRole?: 'admin' | 'steward' | 'member' | null; // ACTUAL role
  onJoinGroup?: () => void;
  loading?: boolean;
  testRole?: 'admin' | 'member' | 'public' | null; // VIEWING role
  onRoleChange?: (role: 'admin' | 'member' | 'public') => void;
  isMember?: boolean; // Is member of THIS group
  isAdminOrSteward?: boolean; // Has admin/steward role
}

export function GroupLanding({
  group,
  userRole,
  onJoinGroup,
  loading = false,
  testRole,
  onRoleChange,
  isMember = false,
  isAdminOrSteward = false,
}: GroupLandingProps) {
  void userRole;
  void loading;
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  // Viewing logic based on testRole
  const viewingAsMember = testRole === 'member' || testRole === 'admin';

  // Only show role switcher if they're actually a member
  const showRoleSwitcher = isMember;

  return (
    <Box className="group-landing" bg={bgColor} minH="100vh">
      {viewingAsMember ? (
        <GroupMemberHeader
          group={group}
          testRole={testRole}
          onRoleChange={showRoleSwitcher ? onRoleChange : undefined}
          isAdminOrSteward={isAdminOrSteward}
        />
      ) : (
        <GroupPublicHeader
          group={group}
          isMember={isMember}
          isAdminOrSteward={isAdminOrSteward}
          testRole={testRole}
          onRoleChange={showRoleSwitcher ? onRoleChange : undefined}
          onJoinGroup={onJoinGroup}
        />
      )}

      <Container maxW="7xl" py={8}>
        <GroupTabs
          group={group}
          viewingAsMember={viewingAsMember}
          isMember={isMember}
          onJoinGroup={onJoinGroup}
        />
      </Container>
    </Box>
  );
}

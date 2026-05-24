// apps/mixtape/src/components/groups/GroupHeaderWrapper.tsx - Enhanced

"use client";

import { Box } from "@chakra-ui/react";
import { UnifiedRoleSwitcher } from "../UnifiedRoleSwitcher";

interface GroupHeaderWrapperProps {
  children: React.ReactNode;
  showRoleSwitcher?: boolean;
  testRole?: 'admin' | 'member' | 'public' | null;
  onRoleChange?: (role: 'admin' | 'member' | 'public') => void;
  isAdminOrSteward?: boolean;
}

export function GroupHeaderWrapper({
  children,
  showRoleSwitcher = false,
  testRole,
  onRoleChange,
  isAdminOrSteward = false,
}: GroupHeaderWrapperProps) {
  return (
    <Box position="relative" display={'flex'} justifyContent={'center'}>
      {/* Role Switcher - ALWAYS in exact same position across all headers */}
      {showRoleSwitcher && onRoleChange && (
        <Box className="unified-role-switcher-wrapper"
          position="absolute"
          top={2}
          right={2}
          zIndex={100} // Higher z-index to ensure it's always on top
        >
          <UnifiedRoleSwitcher
            testRole={testRole}
            onRoleChange={onRoleChange}
            isAdminOrSteward={isAdminOrSteward}
          />
        </Box>
      )}

      {/* Header content (varies by type - Admin/Member/Public) */}
      <Box className="whatho" w="full">{children}</Box>
    </Box>
  );
}
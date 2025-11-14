// src/components/groups/RoleSwitcher.tsx

"use client";

import { VStack, IconButton } from "@chakra-ui/react";
import { IconShield, IconUser, IconEyeOff } from "@tabler/icons-react";
import { Tooltip } from "@components/ui/tooltip";

interface RoleSwitcherProps {
  testRole?: 'admin' | 'member' | 'public' | null;
  onRoleChange: (role: 'admin' | 'member' | 'public' | null) => void;
  isAdminOrSteward: boolean;
}

export function RoleSwitcher({
  testRole,
  onRoleChange,
  isAdminOrSteward,
}: RoleSwitcherProps) {
  return (
    <VStack gap={1}>
      {/* Public button - TOP (always in same spot) */}
      <Tooltip content="View as Public (Non-member)">
        <IconButton
          aria-label="Public view"
          size="sm"
          variant={testRole === null || testRole === 'public' ? 'solid' : 'ghost'}
          colorScheme={testRole === null || testRole === 'public' ? 'green' : 'gray'}
          onClick={() => onRoleChange(null)}
        >
          <IconEyeOff size={18} />
        </IconButton>
      </Tooltip>

      {/* Member button - MIDDLE */}
      <Tooltip content="View as Member">
        <IconButton
          aria-label="Member view"
          size="sm"
          variant={testRole === 'member' ? 'solid' : 'ghost'}
          colorScheme={testRole === 'member' ? 'green' : 'gray'}
          onClick={() => onRoleChange('member')}
        >
          <IconUser size={18} />
        </IconButton>
      </Tooltip>

      {/* Admin button - BOTTOM (only for admin/steward) */}
      {isAdminOrSteward && (
        <Tooltip content="View as Admin">
          <IconButton
            aria-label="Admin view"
            size="sm"
            variant={testRole === 'admin' ? 'solid' : 'ghost'}
            colorScheme={testRole === 'admin' ? 'green' : 'gray'}
            onClick={() => onRoleChange('admin')}
          >
            <IconShield size={18} />
          </IconButton>
        </Tooltip>
      )}
    </VStack>
  );
}
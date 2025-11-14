// src/components/groups/AdminRoleSwitcher.tsx

// Horizontal version for admin header

"use client";

import { HStack, IconButton } from "@chakra-ui/react";
import { IconShield, IconUser, IconEyeOff } from "@tabler/icons-react";
import { Tooltip } from "@components/ui/tooltip";

interface AdminRoleSwitcherProps {
  testRole?: 'admin' | 'member' | 'public' | null;
  onRoleChange: (role: 'admin' | 'member' | 'public' | null) => void;
}

export function AdminRoleSwitcher({
  testRole,
  onRoleChange,
}: AdminRoleSwitcherProps) {
  return (
    <HStack gap={1}>
      {/* Admin button - LEFT */}
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

      {/* Public button - RIGHT (always in same spot) */}
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
    </HStack>
  );
}
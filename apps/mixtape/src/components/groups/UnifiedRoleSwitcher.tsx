// src/components/groups/UnifiedRoleSwitcher.tsx - REVERSED ORDER

"use client";

import { HStack, IconButton, Box } from "@chakra-ui/react";
import { IconShield, IconUser, IconEyeOff, IconLayoutDashboard } from "@tabler/icons-react";
import { Tooltip } from "@components/ui/tooltip";
import { useColorModeValue } from "@components/ui/color-mode";

interface UnifiedRoleSwitcherProps {
  testRole?: 'admin' | 'member' | 'public' | 'ops' | null;
  onRoleChange: (role: 'admin' | 'member' | 'public') => void;
  isAdminOrSteward: boolean;
  isSuperuser?: boolean;
  onOpsClick?: () => void;
}

export function UnifiedRoleSwitcher({
  testRole,
  onRoleChange,
  isAdminOrSteward,
  isSuperuser = false,
  onOpsClick,
}: UnifiedRoleSwitcherProps) {
  const bgColor = useColorModeValue("background.light", "background.dark");
  return (
    <Box
      // bg="blackAlpha.600"
      bg={bgColor}
      backdropFilter="blur(8px)"
      borderRadius="md"
      p={1}
      boxShadow="sm"
    >
      <HStack gap={1}>
        {/* Ops button - leftmost (superuser only) */}
        {isSuperuser && onOpsClick && (
          <Tooltip content="Ops dashboard">
            <IconButton
              aria-label="Ops view"
              size="xs"
              variant={testRole === 'ops' ? 'solid' : 'ghost'}
              colorScheme={testRole === 'ops' ? 'orange' : 'gray'}
              onClick={onOpsClick}
            >
              <IconLayoutDashboard size={14} />
            </IconButton>
          </Tooltip>
        )}

        {/* Admin button - LEFT (only for admin/steward) */}
        {isAdminOrSteward && (
          <Tooltip content="View as Admin">
            <IconButton
              aria-label="Admin view"
              size="xs"
              variant={testRole === 'admin' ? 'solid' : 'ghost'}
              colorScheme={testRole === 'admin' ? 'green' : 'gray'}
              onClick={() => onRoleChange('admin')}
            >
              <IconShield size={14} />
            </IconButton>
          </Tooltip>
        )}

        {/* Member button - MIDDLE */}
        <Tooltip content="View as Member">
          <IconButton
            aria-label="Member view"
            size="xs"
            variant={testRole === 'member' ? 'solid' : 'ghost'}
            colorScheme={testRole === 'member' ? 'green' : 'gray'}
            onClick={() => onRoleChange('member')}
          >
            <IconUser size={14} />
          </IconButton>
        </Tooltip>

        {/* Public button - superuser only */}
        {isSuperuser && (
          <Tooltip content="View as Public (Non-member)">
            <IconButton
              aria-label="Public view"
              size="xs"
              variant={testRole === 'public' ? 'solid' : 'ghost'}
              colorScheme={testRole === 'public' ? 'green' : 'gray'}
              onClick={() => onRoleChange('public')}
            >
              <IconEyeOff size={14} />
            </IconButton>
          </Tooltip>
        )}
      </HStack>
    </Box>
  );
}
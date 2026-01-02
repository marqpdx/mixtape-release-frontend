// src/components/groups/UnifiedRoleSwitcher.tsx - REVERSED ORDER

"use client";

import { HStack, IconButton, Box } from "@chakra-ui/react";
import { IconShield, IconUser, IconEyeOff } from "@tabler/icons-react";
import { Tooltip } from "@components/ui/tooltip";
import { useColorModeValue } from "@components/ui/color-mode";

interface UnifiedRoleSwitcherProps {
  testRole?: 'admin' | 'member' | 'public' | null;
  onRoleChange: (role: 'admin' | 'member' | 'public') => void;
  isAdminOrSteward: boolean;
}

export function UnifiedRoleSwitcher({
  testRole,
  onRoleChange,
  isAdminOrSteward,
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
        {/* Admin button - LEFT (only for admin/steward) */}
        {isAdminOrSteward && (
          <Tooltip content="View as Admin">
            <IconButton
              aria-label="Admin view"
              size="sm"
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
            size="sm"
            variant={testRole === 'member' ? 'solid' : 'ghost'}
            colorScheme={testRole === 'member' ? 'green' : 'gray'}
            onClick={() => onRoleChange('member')}
          >
            <IconUser size={14} />
          </IconButton>
        </Tooltip>

        {/* Public button - RIGHT (always same spot) */}
        <Tooltip content="View as Public (Non-member)">
          <IconButton
            aria-label="Public view"
            size="sm"
            variant={testRole === 'public' ? 'solid' : 'ghost'}
            colorScheme={testRole === 'public' ? 'green' : 'gray'}
            onClick={() => onRoleChange('public')}
          >
            <IconEyeOff size={14} />
          </IconButton>
        </Tooltip>
      </HStack>
    </Box>
  );
}
// apps/mixtape/src/components/groups/GroupHeaderWrapper.tsx - Enhanced

"use client";

import { Box, Button, HStack } from "@chakra-ui/react";
import { UnifiedRoleSwitcher } from "../UnifiedRoleSwitcher";
import { GROUP_MEMBER_VIEW_DEFINITIONS, type GroupMemberViewId } from "../member-views/registry";

interface GroupHeaderWrapperProps {
  children: React.ReactNode;
  showRoleSwitcher?: boolean;
  testRole?: 'admin' | 'member' | 'public' | null;
  onRoleChange?: (role: 'admin' | 'member' | 'public') => void;
  isAdminOrSteward?: boolean;
  layoutVariant?: GroupMemberViewId;
  onLayoutChange?: (layout: GroupMemberViewId) => void;
}

export function GroupHeaderWrapper({
  children,
  showRoleSwitcher = false,
  testRole,
  onRoleChange,
  isAdminOrSteward = false,
  layoutVariant,
  onLayoutChange,
}: GroupHeaderWrapperProps) {
  const showControls = (showRoleSwitcher && onRoleChange) || onLayoutChange;

  return (
    <Box position="relative" display={'flex'} justifyContent={'center'}>
      {showControls && (
        <Box className="unified-role-switcher-wrapper"
          position="absolute"
          top={2}
          right={2}
          zIndex={100}
        >
          <HStack gap={1}>
            {onLayoutChange && layoutVariant && (
              <Box
                bg="theme.surface"
                backdropFilter="blur(8px)"
                borderRadius="md"
                p={1}
                boxShadow="sm"
              >
                <HStack gap={1}>
                  {GROUP_MEMBER_VIEW_DEFINITIONS.map((view) => (
                    <Button
                      key={view.id}
                      size="xs"
                      borderRadius="full"
                      variant={layoutVariant === view.id ? "solid" : "ghost"}
                      onClick={() => onLayoutChange(view.id)}
                      title={view.description}
                      px={2}
                    >
                      {view.label}
                    </Button>
                  ))}
                </HStack>
              </Box>
            )}
            {showRoleSwitcher && onRoleChange && (
              <UnifiedRoleSwitcher
                testRole={testRole}
                onRoleChange={onRoleChange}
                isAdminOrSteward={isAdminOrSteward}
              />
            )}
          </HStack>
        </Box>
      )}

      {/* Header content (varies by type - Admin/Member/Public) */}
      <Box className="whatho" w="full">{children}</Box>
    </Box>
  );
}
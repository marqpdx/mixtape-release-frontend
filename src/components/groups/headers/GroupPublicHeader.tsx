// src/components/groups/headers/GroupPublicHeader.tsx

"use client";

import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  HStack,
  AvatarGroup,
  Avatar,
} from "@chakra-ui/react";
import { GroupHeaderWrapper } from "../layout/GroupHeaderWrapper";

interface GroupPublicHeaderProps {
  group: any;
  isMember?: boolean;
  isAdminOrSteward?: boolean;
  testRole?: 'admin' | 'member' | 'public' | null;
  onRoleChange?: (role: 'admin' | 'member' | 'public') => void;
  onJoinGroup?: () => void;
}

export function GroupPublicHeader({
  group,
  isMember = false,
  isAdminOrSteward = false,
  testRole,
  onRoleChange,
  onJoinGroup,
}: GroupPublicHeaderProps) {
  const canJoin = group.visibility === 'public' && group.join_policy !== 'closed';

  const groupAvatarRaw = group.avatar ?? null;

  const groupAvatar =
    groupAvatarRaw && groupAvatarRaw.trim() !== ""
      ? groupAvatarRaw.trim()
      : undefined;

  return (
    <GroupHeaderWrapper
      showRoleSwitcher={isMember}
      testRole={testRole}
      onRoleChange={onRoleChange}
      isAdminOrSteward={isAdminOrSteward}
    >
      <Box
        position="relative"
        h="290px"
        bgImage={group.background_image ? `url(${group.background_image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}
        bgSize="cover"
        bgPos="center"
        borderRadius="lg"
        mb={4}
      >
        {/* Hero Content - Bottom */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          bg="linear-gradient(transparent, rgba(0,0,0,0.7))"
          p={6}
          borderBottomRadius="lg"
        >
          <HStack align="end" gap={4}>
            <AvatarGroup>
              <Avatar.Root size="xl" border="3px solid white">
                <Avatar.Image src={groupAvatar} />
                <Avatar.Fallback>{group.title?.charAt(0) || 'G'}</Avatar.Fallback>
              </Avatar.Root>
            </AvatarGroup>
            <Box flex="1">
              <Heading size="xl" color="white" mb={2}>
                {group.title}
              </Heading>
              <Text color="gray.200" fontSize="lg" mb={3}>
                {group.tagline || "Building community through shared purpose"}
              </Text>
              {!isMember && canJoin && (
                <HStack>
                  <Button
                    colorScheme="green"
                    size="lg"
                    onClick={onJoinGroup}
                  >
                    Join Group
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    color="white"
                    borderColor="white"
                    _hover={{ bg: 'whiteAlpha.200' }}
                  >
                    Follow
                  </Button>
                </HStack>
              )}
            </Box>
          </HStack>
        </Box>
      </Box>
    </GroupHeaderWrapper>
  );
}
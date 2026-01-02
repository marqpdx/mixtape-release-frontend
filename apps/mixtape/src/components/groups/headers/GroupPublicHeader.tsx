// src/components/groups/headers/GroupPublicHeader.tsx

"use client";

import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  AvatarGroup,
  Avatar,
} from "@chakra-ui/react";
import { GroupHeaderWrapper } from "../layout/GroupHeaderWrapper";

interface GroupPublicHeaderProps {
  group: {
    title?: string;
    visibility?: string;
    join_policy?: string;
    avatar?: string;
    background_image_url?: string;
    tagline?: string;
  };
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

  console.log("aaa GroupPublicHeader render:", { group, isMember, testRole });



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
      <Box className="lete"
        position="relative"
        h="290px"
        bgImage={group.background_image_url ? `url(${group.background_image_url})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}
        bgSize="cover"
        bgPos="center"
        borderRadius="lg"
        mb={4}
        minW={"100vw"}
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

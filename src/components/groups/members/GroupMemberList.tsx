// src/components/groups/GroupMemberList.tsx

"use client";

import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  SimpleGrid,
  Card,
  Badge,
  Flex,
  IconButton,
  Spinner,
  Avatar,
} from "@chakra-ui/react";
import { useState } from "react";
import { IconGrid3x3, IconList, IconMessage, IconCalendar } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { AvatarGroup } from "@chakra-ui/react";
import UniversalDataTable from "@components/common/UniversalDataTable";
import { getMemberDisplayName, Group, GroupMembership } from "@/types/groupTypes";

interface GroupMemberListProps {
  group: Group;
  members: GroupMembership[];
  isLoading?: boolean;
  error?: string | null;
  showPrivateInfo?: boolean;
  onMemberClick?: (membership: GroupMembership) => void;
  canEditMember?: (membership: GroupMembership) => boolean;
}

// Transform for UniversalDataTable
interface MemberTableItem extends GroupMembership {
  id: string;
  title: string;
  name: string;
  description: string;
  slug: string;
}

export function GroupMemberList({
  group,
  members = [],
  isLoading = false,
  error = null,
  showPrivateInfo = false,
  onMemberClick,
  canEditMember = () => false
}: GroupMemberListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textSecondary = useColorModeValue('gray.600', 'gray.300');

  const AVATAR_SIZE = "148px";

  // Helper to get display name (uses utility from groupTypes)
  const getDisplayName = (membership: GroupMembership): string => {
    return getMemberDisplayName(membership);
  };

  // Helper to get avatar
  const getAvatar = (membership: GroupMembership): string | undefined => {
    return membership.profile_image || undefined;
  };

  // Helper function to get role badge color
  const getRoleBadgeColor = (role: string): string => {
    switch (role.toLowerCase()) {
      case 'admin':
      case 'owner':
        return 'green';
      case 'moderator':
        return 'purple';
      default:
        return 'blue';
    }
  };

  // Transform members for UniversalDataTable
  const transformMemberForTable = (membership: GroupMembership): MemberTableItem => {
    return {
      ...membership,
      id: membership.member_id,
      title: getDisplayName(membership),
      name: getDisplayName(membership),
      description: '', // GroupMembership doesn't have bio
      slug: membership.username || membership.member_id,
    };
  };

  const handleMemberClick = (membership: GroupMembership) => {
    if (onMemberClick) {
      onMemberClick(membership);
    } else {
      console.log('Navigate to member:', membership.member_id);
    }
  };

  const GridView = () => (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap={4}>
      {members.map((membership) => {
        const displayName = getDisplayName(membership);
        const avatar = getAvatar(membership);

        return (
          <Card.Root
            key={membership.member_id}
            bg={cardBg}
            borderWidth="1px"
            borderColor={borderColor}
            _hover={{ shadow: 'md', transform: 'translateY(-2px)' }}
            transition="all 0.2s"
            cursor="pointer"
            onClick={() => handleMemberClick(membership)}
            overflow="hidden"
            position="relative"
            h="300px"
          >
            {avatar ? (
              <>
                {/* Background image */}
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  w="full"
                  h="full"
                  backgroundImage={`url(${avatar})`}
                  backgroundSize="cover"
                  backgroundPosition="center"
                  backgroundRepeat="no-repeat"
                />

                {/* Semi-transparent overlay */}
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  w="full"
                  h="full"
                  bg="blackAlpha.400"
                  background="linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)"
                />

                {/* Content overlay */}
                <Card.Body
                  position="relative"
                  zIndex={2}
                  p={4}
                  h="full"
                  display="flex"
                  flexDirection="column"
                  justifyContent="flex-end"
                  color="white"
                >
                  <VStack gap={2} align="start">
                    <VStack gap={1} align="start" w="full">
                      <Text fontWeight="bold" fontSize="lg" textShadow="0 1px 3px rgba(0,0,0,0.8)">
                        {displayName}
                      </Text>
                      <HStack gap={2}>
                        <Badge
                          // colorScheme={getRoleBadgeColor(membership.role)}
                          size="sm"
                          bg="whiteAlpha.800"
                          color="gray.800"
                        >
                          {membership.roles.join(", ")}
                        </Badge>

                        {membership.is_pending && (
                          <Badge colorScheme="orange" size="sm" bg="orange.500" color="white">
                            Pending
                          </Badge>
                        )}
                        {!membership.is_active && (
                          <Badge colorScheme="red" size="sm" bg="red.500" color="white">
                            Inactive
                          </Badge>
                        )}
                        {!membership.is_active_user && (
                          <Badge colorScheme="gray" size="sm" bg="gray.500" color="white">
                            User Inactive
                          </Badge>
                        )}
                      </HStack>
                    </VStack>

                    {/* Username */}
                    {membership.username && (
                      <Text fontSize="sm" fontFamily="mono" opacity={0.9} textShadow="0 1px 2px rgba(0,0,0,0.8)">
                        @{membership.username}
                      </Text>
                    )}
                  </VStack>
                </Card.Body>
              </>
            ) : (
              // Avatar-based card (fallback)
              <Card.Body p={4} h="full" display="flex" flexDirection="column" justifyContent="center">
                <VStack gap={3} align="center">
                  <AvatarGroup>
                    <Avatar.Root size="2xl">
                      <Avatar.Fallback bg="green.100" color="green.700">
                        {displayName.charAt(0).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                  </AvatarGroup>

                  <VStack gap={1} align="center">
                    <Text fontWeight="bold" fontSize="sm" textAlign="center" lineClamp={1}>
                      {displayName}
                    </Text>
                    <Badge
                      // colorScheme={getRoleBadgeColor(membership.role)}
                      size="sm"
                    >
                      {/* {membership.role} */}
                    </Badge>
                  </VStack>

                  {/* Status indicators */}
                  <HStack gap={1}>
                    {membership.is_pending && (
                      <Badge colorScheme="orange" size="xs">
                        Pending
                      </Badge>
                    )}
                    {!membership.is_active && (
                      <Badge colorScheme="red" size="xs">
                        Inactive
                      </Badge>
                    )}
                  </HStack>

                  {/* Username */}
                  {membership.username && (
                    <Text fontSize="xs" color="gray.400" fontFamily="mono">
                      @{membership.username}
                    </Text>
                  )}
                </VStack>
              </Card.Body>
            )}
          </Card.Root>
        );
      })}
    </SimpleGrid>
  );

  const TableView = () => {
    const tableMembers = members.map(transformMemberForTable);

    return (
      <UniversalDataTable<MemberTableItem>
        data={tableMembers}
        title=""
        showAvatar={true}
        onRowClick={(memberItem) => {
          const membership = members.find(m => m.member_id === memberItem.member_id);
          if (membership) {
            handleMemberClick(membership);
          }
        }}
        canEdit={canEditMember}
        canView={() => true}
        emptyStateMessage="No members found"
        emptyStateSubtitle="This group doesn't have any members yet"

        renderAvatar={(memberItem) => {
          const membership = members.find(m => m.member_id === memberItem.member_id);
          if (!membership) return null;

          let avatar_pre = getAvatar(membership);
          const avatar = avatar_pre === "" ? undefined : avatar_pre;

          const displayName = getDisplayName(membership);

          return (
            <Box
              flexShrink={0}
              p={1}
              w={AVATAR_SIZE}
              h={AVATAR_SIZE}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {avatar ? (
                <Box
                  w="full"
                  h="full"
                  borderRadius="3xl"
                  overflow="hidden"
                  border="2px solid"
                  borderColor="green.200"
                  bg="white"
                  shadow="sm"
                >
                  <img
                    src={avatar}
                    alt={`${displayName} profile`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </Box>
              ) : (
                <AvatarGroup>
                  <Avatar.Root size="2xl">
                    <Avatar.Fallback bg="green.100" color="green.700" fontSize="2xl">
                      {displayName.charAt(0).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                </AvatarGroup>
              )}
            </Box>
          );
        }}

        renderTitle={(memberItem) => {
          const membership = members.find(m => m.member_id === memberItem.member_id);
          if (!membership) return null;

          const displayName = getDisplayName(membership);

          return (
            <VStack align="start" gap={1}>
              <HStack justify="space-between" w="full" wrap="wrap" gap={2}>
                <VStack align="start" gap={0} flex={1} minW={0}>
                  <Text fontWeight="semibold" fontSize="md" lineClamp={1}>
                    {displayName}
                  </Text>
                  {membership.username && (
                    <Text fontSize="xs" color="gray.400" fontFamily="mono">
                      @{membership.username}
                    </Text>
                  )}
                </VStack>

                <HStack gap={1} flexShrink={0}>
                  <Badge
                    // colorScheme={getRoleBadgeColor(membership.role)}
                    size="sm"
                  >
                    {membership.roles}
                  </Badge>

                  {membership.is_pending && (
                    <Badge colorScheme="orange" size="sm">
                      Pending
                    </Badge>
                  )}

                  {!membership.is_active && (
                    <Badge colorScheme="red" size="sm">
                      Inactive
                    </Badge>
                  )}
                </HStack>
              </HStack>
            </VStack>
          );
        }}

        renderDescription={(memberItem) => {
          const membership = members.find(m => m.member_id === memberItem.member_id);
          if (!membership) return null;

          return (
            <VStack align="start" gap={2}>
              {membership.email && showPrivateInfo && (
                <HStack fontSize="xs" color="gray.500">
                  <IconMessage size={12} />
                  <Text>{membership.email}</Text>
                </HStack>
              )}
            </VStack>
          );
        }}

        renderMetadata={(memberItem) => {
          const membership = members.find(m => m.member_id === memberItem.member_id);
          if (!membership) return null;

          return (
            <VStack align="start" gap={1}>
              <HStack fontSize="xs" color="gray.400">
                <IconCalendar size={12} />
                <Text>Joined {new Date(membership.date_joined).toLocaleDateString()}</Text>
              </HStack>

              {showPrivateInfo && membership.invited_by_username && (
                <Text fontSize="xs" color="gray.400">
                  Invited by @{membership.invited_by_username}
                </Text>
              )}
            </VStack>
          );
        }}
      />
    );
  };

  return (
    <Box>
      {/* Header with view toggle */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" gap={1}>
          <Heading size="md">Group Members</Heading>
          <Text fontSize="sm" color={textSecondary}>
            {isLoading ? "Loading..." : `${members.length} ${members.length === 1 ? 'member' : 'members'}`}
          </Text>
        </VStack>

        <HStack>
          <IconButton
            aria-label="Grid view"
            size="sm"
            variant={viewMode === 'grid' ? 'solid' : 'ghost'}
            colorScheme={viewMode === 'grid' ? 'green' : 'gray'}
            onClick={() => setViewMode('grid')}
            disabled={isLoading}
          >
            <IconGrid3x3 size={16} />
          </IconButton>

          <IconButton
            aria-label="Table view"
            size="sm"
            variant={viewMode === 'table' ? 'solid' : 'ghost'}
            colorScheme={viewMode === 'table' ? 'green' : 'gray'}
            onClick={() => setViewMode('table')}
            disabled={isLoading}
          >
            <IconList size={16} />
          </IconButton>
        </HStack>
      </Flex>

      {/* Loading State */}
      {isLoading && (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="300px"
          flexDirection="column"
          gap={4}
        >
          <Spinner size="xl" color="green.500" />
          <Text color="gray.500">Loading members...</Text>
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Box
          textAlign="center"
          py={10}
          border="1px solid"
          borderColor={borderColor}
          rounded="lg"
        >
          <Text color="red.500" fontSize="lg" fontWeight="medium">
            Failed to load members
          </Text>
          <Text color="gray.500" mt={2}>
            {error}
          </Text>
        </Box>
      )}

      {/* Empty State */}
      {!isLoading && !error && members.length === 0 && (
        <Box
          textAlign="center"
          py={16}
          border="1px solid"
          borderColor={borderColor}
          rounded="lg"
          bg={cardBg}
        >
          <Text fontSize="lg" fontWeight="medium" color={textSecondary} mb={2}>
            No members found
          </Text>
          <Text color="gray.500">
            This group doesn't have any members yet
          </Text>
        </Box>
      )}

      {/* Content */}
      {!isLoading && !error && members.length > 0 && (
        <>
          {viewMode === 'grid' ? <GridView /> : <TableView />}
        </>
      )}
    </Box>
  );
}
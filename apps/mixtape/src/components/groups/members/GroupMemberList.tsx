// apps/mixtape/src/components/groups/GroupMemberList.tsx

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
  Button,
  Link,
  IconButton,
  Spinner,
  Avatar,
  Input,
} from "@chakra-ui/react";
import { MouseEvent, useEffect, useMemo, useState, useCallback } from "react";
import { useBackNavigableDetail } from "@/hooks/useBackNavigableDetail";
import { GroupMemberProfilePanel } from "./GroupMemberProfilePanel";
import Image from "next/image";
import {
  IconGrid3x3,
  IconList,
  IconMessage,
  IconCalendar,
  IconUserMinus,
  IconPencil,
  IconMapPin,
  IconExternalLink,
  IconRefresh,
} from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { AvatarGroup } from "@chakra-ui/react";
import UniversalDataTable from "@components/common/UniversalDataTable";
import { getMemberDisplayName, Group, GroupMembership } from "@mixtape/core/types/groupTypes";
import * as groupApi from "@mixtape/api/clients/group/groupApi";
import { useQueryClient } from "@tanstack/react-query";
import { memberQueryKeys } from "@mixtape/api/hooks/useMembers";
import { toaster } from "@mixtape/core/lib/toaster";
import { useAuth } from "@/lib/auth/AuthContext";
import { useProfileDrawer } from "@/features/profile-revamp/stores/profileDrawerStore";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface GroupMemberListProps {
  group: Group;
  members: GroupMembership[];
  isLoading?: boolean;
  error?: string | null;
  showPrivateInfo?: boolean;
  onMemberClick?: (membership: GroupMembership) => void;
  canEditMember?: (membership: GroupMembership) => boolean;
  onRefresh?: () => void;
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
  canEditMember = () => false,
  onRefresh,
}: GroupMemberListProps) {
  const { user: identity } = useAuth();
  const queryClient = useQueryClient();
  const openProfileDrawer = useProfileDrawer(s => s.open);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [nameFilter, setNameFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<GroupMembership | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textSecondary = useColorModeValue('gray.600', 'gray.300');
  const inputBg = useColorModeValue('white', 'gray.700');
  const AVATAR_SIZE = 148;
  const viewModeStorageKey = `group_members_view_mode:${group.slug}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(viewModeStorageKey);
    if (saved === "grid" || saved === "table") {
      setViewMode(saved);
    }
  }, [viewModeStorageKey]);

  const updateViewMode = (mode: "grid" | "table") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(viewModeStorageKey, mode);
    }
  };

  // Filtered members, sorted by username a→z
  const filteredMembers = useMemo(() => {
    let result = members;
    if (nameFilter.trim()) {
      const q = nameFilter.trim().toLowerCase();
      result = result.filter((m) => {
        const name = getMemberDisplayName(m).toLowerCase();
        const username = (m.username || "").toLowerCase();
        return name.includes(q) || username.includes(q);
      });
    }
    return [...result].sort((a, b) =>
      (a.username || "").toLowerCase().localeCompare((b.username || "").toLowerCase())
    );
  }, [members, nameFilter]);

  // Helper to get display name (uses utility from groupTypes)
  const getDisplayName = (membership: GroupMembership): string => {
    return getMemberDisplayName(membership);
  };

  // Helper to get avatar
  const getAvatar = (membership: GroupMembership): string | undefined => {
    return membership.profile_image || undefined;
  };

  // Helper function to get role badge color
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

  const detailNav = useBackNavigableDetail({
    isOpen: selectedIndex !== null,
    onClose: () => setSelectedIndex(null),
    tagKey: "memberPanel",
  });

  const handleMemberClick = useCallback((membership: GroupMembership) => {
    const idx = filteredMembers.findIndex((m) => m.member_id === membership.member_id);
    if (idx !== -1) {
      detailNav.enter(() => setSelectedIndex(idx));
    } else {
      onMemberClick?.(membership);
    }
  }, [filteredMembers, onMemberClick, detailNav]);

  const handleReturn = useCallback(() => {
    detailNav.exit();
  }, [detailNav]);

  const handleViewComplete = useCallback((username: string) => {
    openProfileDrawer(username);
  }, [openProfileDrawer]);

  // Arrow keys step between members while the panel is open (Escape/back handled by useBackNavigableDetail)
  useEffect(() => {
    if (selectedIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && selectedIndex > 0) setSelectedIndex((i) => (i ?? 0) - 1);
      if (e.key === "ArrowRight" && selectedIndex < filteredMembers.length - 1)
        setSelectedIndex((i) => (i ?? 0) + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedIndex, filteredMembers.length, handleReturn]);

  const handleRemoveMember = (membership: GroupMembership) => {
    if (removingMemberId === membership.member_id) return;
    setConfirmTarget(membership);
  };

  const executeRemove = async () => {
    if (!confirmTarget) return;
    const membership = confirmTarget;
    const displayName = getDisplayName(membership);
    setConfirmTarget(null);
    try {
      setRemovingMemberId(membership.member_id);
      await groupApi.removeGroupMember(group.slug, membership.member_id);
      await queryClient.invalidateQueries({ queryKey: memberQueryKeys.lists() });
      onRefresh?.();
      toaster.create({ title: `${displayName} was removed from ${group.title}.`, type: "success" });
    } catch (err) {
      console.error("Failed to remove member:", err);
      toaster.create({ title: `Could not remove ${displayName}.`, type: "error" });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const canEditOwnProfileImage = (membership: GroupMembership) =>
    !getAvatar(membership) &&
    !!membership.username &&
    membership.username === identity?.username;

  const goToEditProfile = (event: MouseEvent, membership: GroupMembership) => {
    event.stopPropagation();
    if (typeof window !== "undefined" && membership.username === identity?.username) {
      window.location.href = "/dashboard?section=edit-profile";
    }
  };

  const GridView = () => (
    <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} gap={4}>
      {filteredMembers.map((membership) => {
        const displayName = getDisplayName(membership);
        const avatar = getAvatar(membership);
        const canRemove = canEditMember(membership);
        const isRemoving = removingMemberId === membership.member_id;

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
            {canRemove && (
              <IconButton
                aria-label="Remove member"
                size="sm"
                variant="solid"
                colorScheme="red"
                position="absolute"
                top={3}
                right={3}
                zIndex={3}
                loading={isRemoving}
                disabled={isRemoving}
                onClick={(event) => {
                  event.stopPropagation();
                  handleRemoveMember(membership);
                }}
              >
                <IconUserMinus size={16} />
              </IconButton>
            )}
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
                  <VStack gap={2} align="start" w="full">
                    <VStack gap={0.5} align="start" w="full">
                      <Text fontWeight="bold" fontSize="lg" textShadow="0 1px 3px rgba(0,0,0,0.8)">
                        {displayName}
                      </Text>
                      {membership.username && (
                        <Text fontSize="xs" fontFamily="mono" opacity={0.8} textShadow="0 1px 2px rgba(0,0,0,0.8)">
                          @{membership.username}
                        </Text>
                      )}
                    </VStack>

                    {membership.quick_intro && (
                      <Text fontSize="xs" opacity={0.9} textShadow="0 1px 2px rgba(0,0,0,0.8)" lineClamp={3}>
                        {membership.quick_intro}
                      </Text>
                    )}

                    <HStack gap={3} w="full" justify="space-between" mt="auto">
                      {membership.location ? (
                        <HStack gap={1} opacity={0.8}>
                          <IconMapPin size={11} />
                          <Text fontSize="xs" textShadow="0 1px 2px rgba(0,0,0,0.8)">{membership.location}</Text>
                        </HStack>
                      ) : <Box />}
                      {membership.quick_link && (
                        <Link
                          href={membership.quick_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          opacity={0.8}
                          _hover={{ opacity: 1 }}
                        >
                          <IconExternalLink size={14} />
                        </Link>
                      )}
                    </HStack>

                    {canRemove && (
                      <Button
                        size="xs"
                        colorPalette="red"
                        variant="solid"
                        loading={isRemoving}
                        disabled={isRemoving}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveMember(membership);
                        }}
                      >
                        Remove from group
                      </Button>
                    )}
                  </VStack>
                </Card.Body>
              </>
            ) : (
              // Avatar-based card (fallback)
              <Card.Body p={4} h="full" display="flex" flexDirection="column" justifyContent="center" bg={cardBg}>
                <VStack gap={3} align="center">
                  <AvatarGroup>
                    <Avatar.Root size="2xl">
                      <Avatar.Fallback>
                        {displayName.charAt(0).toUpperCase()}
                      </Avatar.Fallback>
                    </Avatar.Root>
                  </AvatarGroup>

                  <VStack gap={1} align="center">
                    <Text fontWeight="bold" fontSize="sm" textAlign="center" lineClamp={1}>
                      {displayName}
                    </Text>
                    {membership.username && (
                      <Text fontSize="xs" color={textSecondary} fontFamily="mono">
                        @{membership.username}
                      </Text>
                    )}
                  </VStack>

                  {membership.quick_intro && (
                    <Text fontSize="xs" color={textSecondary} textAlign="center" lineClamp={3} px={1}>
                      {membership.quick_intro}
                    </Text>
                  )}

                  {membership.location && (
                    <HStack gap={1} color={textSecondary}>
                      <IconMapPin size={11} />
                      <Text fontSize="xs">{membership.location}</Text>
                    </HStack>
                  )}

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

                  {canRemove && (
                    <Button
                      size="xs"
                      colorPalette="red"
                      variant="outline"
                      loading={isRemoving}
                      disabled={isRemoving}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveMember(membership);
                      }}
                    >
                      Remove from group
                    </Button>
                  )}
                </VStack>
                {membership.quick_link && (
                  <Link
                    href={membership.quick_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    position="absolute"
                    right={3}
                    bottom={3}
                    color={textSecondary}
                    _hover={{ color: "blue.400" }}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  >
                    <IconExternalLink size={14} />
                  </Link>
                )}
                {canEditOwnProfileImage(membership) && (
                  <IconButton
                    aria-label="Edit profile"
                    size="xs"
                    variant="solid"
                    colorScheme="blue"
                    position="absolute"
                    right={3}
                    bottom={3}
                    onClick={(event) => goToEditProfile(event, membership)}
                  >
                    <IconPencil size={14} />
                  </IconButton>
                )}
              </Card.Body>
            )}
          </Card.Root>
        );
      })}
    </SimpleGrid>
  );

  const TableView = () => {
    const tableMembers = filteredMembers.map(transformMemberForTable);

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
            actions={[
              {
                label: "Remove member",
                icon: <IconUserMinus size={16} />,
                colorScheme: "red",
                variant: "ghost",
                showIf: (item) => {
                  const membership = members.find(m => m.member_id === item.id);
                  return membership ? canEditMember(membership) : false;
                },
                onClick: (item) => {
                  const membership = members.find(m => m.member_id === item.id);
                  if (membership) {
                    handleRemoveMember(membership);
                  }
                },
              },
            ]}
            emptyStateMessage="No members found"
            emptyStateSubtitle="This group doesn't have any members yet"

        renderAvatar={(memberItem) => {
          const membership = members.find(m => m.member_id === memberItem.member_id);
          if (!membership) return null;

          const avatar_pre = getAvatar(membership);
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
                  <Image
                    src={avatar}
                    alt={`${displayName} profile`}
                    width={AVATAR_SIZE}
                    height={AVATAR_SIZE}
                    sizes={`${AVATAR_SIZE}px`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              ) : (
                <AvatarGroup>
                  <Avatar.Root size="2xl">
                    <Avatar.Fallback fontSize="2xl">
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
                    {(membership.roles || []).join(", ")}
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
              {membership.right_now && (
                <Text fontSize="xs" color="gray.500" fontStyle="italic" lineClamp={2}>
                  {membership.right_now}
                </Text>
              )}

              {showPrivateInfo && (
                <HStack fontSize="xs" color="gray.400">
                  <IconCalendar size={12} />
                  <Text>Joined {new Date(membership.date_joined).toLocaleDateString()}</Text>
                </HStack>
              )}

              {showPrivateInfo && membership.invited_by_username && (
                <Text fontSize="xs" color="gray.400">
                  Invited by @{membership.invited_by_username}
                </Text>
              )}

              {canEditOwnProfileImage(membership) && (
                <Button
                  size="xs"
                  variant="outline"
                  colorScheme="blue"
                  onClick={(event) => goToEditProfile(event, membership)}
                >
                  Add Profile Image
                </Button>
              )}

              {canEditMember(membership) && (
                <Button
                  size="xs"
                  colorPalette="red"
                  variant="outline"
                  loading={removingMemberId === membership.member_id}
                  disabled={removingMemberId === membership.member_id}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemoveMember(membership);
                  }}
                >
                  Remove from group
                </Button>
              )}
            </VStack>
          );
        }}
      />
    );
  };

  const selectedMember = selectedIndex !== null ? filteredMembers[selectedIndex] : null;

  return (
    <Box position="relative">
      <ConfirmDialog
        open={!!confirmTarget}
        onClose={() => setConfirmTarget(null)}
        onConfirm={executeRemove}
        title="Remove member?"
        message={confirmTarget ? `Remove ${getDisplayName(confirmTarget)} from ${group.title}? This cannot be undone.` : undefined}
        confirmLabel="Remove"
        isLoading={!!removingMemberId}
      />

      {/* In-page member profile panel */}
      <Box
        position={selectedMember ? "relative" : "absolute"}
        top={0}
        left={0}
        right={0}
        opacity={selectedMember ? 1 : 0}
        pointerEvents={selectedMember ? "auto" : "none"}
        transition="opacity 0.15s ease"
        zIndex={selectedMember ? 1 : 0}
        aria-hidden={!selectedMember}
      >
        {selectedMember?.username && (
          <GroupMemberProfilePanel
            username={selectedMember.username}
            displayName={selectedMember.display_name || selectedMember.username || ""}
            avatarUrl={selectedMember.profile_image || undefined}
            onReturn={handleReturn}
            onPrev={() => setSelectedIndex((i) => Math.max(0, (i ?? 0) - 1))}
            onNext={() => setSelectedIndex((i) => Math.min(filteredMembers.length - 1, (i ?? 0) + 1))}
            hasPrev={selectedIndex !== null && selectedIndex > 0}
            hasNext={selectedIndex !== null && selectedIndex < filteredMembers.length - 1}
            onViewComplete={() => handleViewComplete(selectedMember.username!)}
          />
        )}
      </Box>

      {/* Member list — fades out when a profile is open */}
      <Box
        opacity={selectedMember ? 0 : 1}
        pointerEvents={selectedMember ? "none" : "auto"}
        transition="opacity 0.15s ease"
        aria-hidden={!!selectedMember}
      >
      {/* Header with view toggle */}
      <Flex justify="space-between" align="center" mb={4}>
        <VStack align="start" gap={1}>
          <Heading size="md">Group Members</Heading>
          <Text fontSize="sm" color={textSecondary}>
            {isLoading ? "Loading..." : `${filteredMembers.length} of ${members.length} ${members.length === 1 ? 'member' : 'members'}`}
          </Text>
        </VStack>

        <HStack>
          {onRefresh && (
            <IconButton
              aria-label="Refresh members"
              size="sm"
              variant="ghost"
              colorScheme="gray"
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await Promise.resolve(onRefresh());
                } finally {
                  setIsRefreshing(false);
                }
              }}
              loading={isRefreshing}
            >
              <IconRefresh size={16} />
            </IconButton>
          )}

          <IconButton
            aria-label="Grid view"
            size="sm"
            variant={viewMode === 'grid' ? 'solid' : 'ghost'}
            colorScheme={viewMode === 'grid' ? 'green' : 'gray'}
            onClick={() => updateViewMode("grid")}
            disabled={isLoading}
          >
            <IconGrid3x3 size={16} />
          </IconButton>

          <IconButton
            aria-label="Table view"
            size="sm"
            variant={viewMode === 'table' ? 'solid' : 'ghost'}
            colorScheme={viewMode === 'table' ? 'green' : 'gray'}
            onClick={() => updateViewMode("table")}
            disabled={isLoading}
          >
            <IconList size={16} />
          </IconButton>
        </HStack>
      </Flex>

      {/* Filters */}
      {!isLoading && members.length > 0 && (
        <HStack mb={4} gap={3}>
          <Box position="relative" flex={1} maxW="300px">
            <Input
              placeholder="Search by name..."
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              size="sm"
              bg={inputBg}
            />
          </Box>
          {/* Roles filter hidden until re-enabled */}
        </HStack>
      )}

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
      {!isLoading && !error && filteredMembers.length === 0 && (
        <Box
          textAlign="center"
          py={16}
          border="1px solid"
          borderColor={borderColor}
          rounded="lg"
          bg={cardBg}
        >
          <Text fontSize="lg" fontWeight="medium" color={textSecondary} mb={2}>
            {nameFilter ? "No matching members" : "No members found"}
          </Text>
          <Text color={textSecondary}>
            {nameFilter ? "Try adjusting your filters" : "This group doesn't have any members yet"}
          </Text>
        </Box>
      )}

      {/* Content */}
      {!isLoading && !error && filteredMembers.length > 0 && (
        <>
          {viewMode === 'grid' ? <GridView /> : <TableView />}
        </>
      )}
      </Box>{/* end member list fade box */}
    </Box>
  );
}

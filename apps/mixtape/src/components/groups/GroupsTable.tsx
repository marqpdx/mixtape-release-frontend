// apps/mixtape/src/components/groups/GroupsTable.tsx

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Text, HStack, Box, Avatar, Image, Button, VStack, IconButton } from "@chakra-ui/react";
import { Icons } from "@components/icons/IconMap";
import UniversalDataTable from "@components/common/UniversalDataTable";
import { AvatarGroup, CollapsibleRoot, CollapsibleTrigger, CollapsibleContent } from "@chakra-ui/react";
import { Group } from "@mixtape/core/types/groupTypes";
import { LuLayoutList, LuFolderTree, LuChevronDown, LuChevronUp } from "react-icons/lu";

interface GroupsTableProps {
  groups: Group[];
  isLoading?: boolean;
  error?: Error | null;
  showCreateButton?: boolean;
  setActiveSection?: (section: string) => void;
  onGroupClick?: (group: Group) => void;
  canEditGroup?: (group: Group) => boolean;
  emptyStateMessage?: string;
}

type ViewMode = 'hierarchical' | 'flat';

interface GroupHierarchy {
  parentGroups: Group[];
  memberCircles: Group[];
  groupCirclesMap: Map<string, Group[]>; // parent ID -> child circles
  orphanCircles: Group[]; // circles without a valid parent
}

export default function GroupsTable({
  groups = [],
  isLoading = false,
  error = null,
  showCreateButton = false,
  onGroupClick,
  setActiveSection,
  canEditGroup = () => true,
  emptyStateMessage = "No groups found. Create your first group to get started.",
}: GroupsTableProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchical');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Organize groups into hierarchy
  const hierarchy = useMemo<GroupHierarchy>(() => {
    const parentGroups: Group[] = [];
    const memberCircles: Group[] = [];
    const groupCirclesMap = new Map<string, Group[]>();
    const orphanCircles: Group[] = [];

    groups.forEach(group => {
      if (group.group_type === 'circle') {
        // This is a circle - categorize by sponsor
        if (!group.sponsor_group) {
          orphanCircles.push(group);
        } else if (group.sponsor_group.type === 'member') {
          memberCircles.push(group);
        } else if (group.sponsor_group.id) {
          // Group-sponsored circle
          const parentId = group.sponsor_group.id;
          if (!groupCirclesMap.has(parentId)) {
            groupCirclesMap.set(parentId, []);
          }
          groupCirclesMap.get(parentId)!.push(group);
        }
      } else {
        // This is a parent group (community, coalition, etc)
        parentGroups.push(group);
      }
    });

    return { parentGroups, memberCircles, groupCirclesMap, orphanCircles };
  }, [groups]);

  // Flat view: all groups sorted by created_at
  const flatGroups = useMemo(() => {
    return [...groups].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [groups]);

  const handleGroupClick = (group: Group) => {
    if (onGroupClick) {
      onGroupClick(group);
    } else {
      router.push(`/groups/${group.slug}`);
    }
  };

  const handleCreateClick = () => {
    if (setActiveSection) {
      setActiveSection('create-group');
    } else {
      router.push("/groups/create");
    }
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Shared renderers
  const renderAvatar = (group: Group) => {
    const groupIcons = Icons.group as Record<string, any>;
    const GroupIcon = groupIcons[group.group_type];
    const groupProfileImageRaw = group.profile_image ?? null;
    const groupProfileImage =
      groupProfileImageRaw && groupProfileImageRaw.trim() !== ""
        ? groupProfileImageRaw.trim()
        : undefined;
    return (
      <Box flexShrink={0}>
        <AvatarGroup>
          <Avatar.Root size="lg">
            <Avatar.Image
              src={groupProfileImage}
              alt={`${group.title} profile`}
            />
            <Avatar.Fallback bg="green.100" color="green.700">
              {GroupIcon ? (
                <GroupIcon size={24} />
              ) : (
                group.title.charAt(0).toUpperCase()
              )}
            </Avatar.Fallback>
          </Avatar.Root>
        </AvatarGroup>
      </Box>
    );
  };

  const renderTitle = (group: Group) => (
    <HStack justify="space-between" w="full">
      <Text
        fontWeight="semibold"
        fontSize="md"
        color="gray.900"
        _dark={{ color: "white" }}
        _hover={{ color: "green.600" }}
        transition="color 0.2s"
        lineClamp={1}
        flex={1}
      >
        {group.title}
      </Text>
      <Text
        fontSize="xs"
        color="gray.500"
        textTransform="capitalize"
        bg="gray.100"
        _dark={{ bg: "gray.700" }}
        px={2}
        py={1}
        rounded="full"
        flexShrink={0}
        ml={2}
      >
        {group.group_type}
      </Text>
    </HStack>
  );

  const renderDescription = (group: Group) => (
    <Text
      fontSize="sm"
      color="gray.600"
      _dark={{ color: "gray.300" }}
      lineClamp={2}
      wordBreak="break-word"
    >
      {group.description || "No description available"}
    </Text>
  );

  const renderMetadata = (group: Group) => (
    <HStack gap={4} mt={1}>
      <Text fontSize="xs" color="gray.400">
        Created {new Date(group.created_at).toLocaleDateString()}
      </Text>
      {group.member_count !== undefined && (
        <Text fontSize="xs" color="gray.400">
          {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
        </Text>
      )}
    </HStack>
  );

  // Loading state
  if (isLoading) {
    return (
      <UniversalDataTable<Group>
        data={[]}
        title="Groups"
        showAvatar={true}
        showCreateButton={showCreateButton}
        onCreateClick={handleCreateClick}
        createButtonLabel="Create Group"
        emptyStateMessage="Loading groups..."
        emptyStateSubtitle="Please wait while we fetch your groups"
      />
    );
  }

  // Error state
  if (error) {
    return (
      <UniversalDataTable<Group>
        data={[]}
        title="Groups"
        showAvatar={true}
        showCreateButton={showCreateButton}
        onCreateClick={handleCreateClick}
        createButtonLabel="Create Group"
        emptyStateMessage="Failed to load groups"
        emptyStateSubtitle={error.message}
      />
    );
  }

  // Flat view - simple list
  if (viewMode === 'flat') {
    return (
      <Box>
        <Image src="/images/groups-header.png" alt="Groups Header" mb={4} />
        <HStack justify="space-between" mb={4}>
          <Text fontSize="2xl" fontWeight="bold">Groups</Text>
          <HStack gap={2}>
            <Button
              size="sm"
              variant="solid"
              onClick={() => setViewMode('flat')}
            >
              <LuLayoutList />
              Flat
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setViewMode('hierarchical')}
            >
              <LuFolderTree />
              Hierarchical
            </Button>
          </HStack>
        </HStack>
        <UniversalDataTable<Group>
          data={flatGroups}
          title=""
          showAvatar={true}
          onRowClick={handleGroupClick}
          showCreateButton={showCreateButton}
          onCreateClick={handleCreateClick}
          createButtonLabel="Create Group"
          canEdit={canEditGroup}
          canView={() => true}
          emptyStateMessage="No groups found"
          emptyStateSubtitle="Create your first group to get started"
          renderAvatar={renderAvatar}
          renderTitle={renderTitle}
          renderDescription={renderDescription}
          renderMetadata={renderMetadata}
        />
      </Box>
    );
  }

  // Hierarchical view
  return (
    <Box>
      <Image src="/images/groups-header.png" alt="Groups Header" mb={4} />
      <HStack justify="space-between" mb={4}>
        <Text fontSize="2xl" fontWeight="bold">Groups</Text>
        <HStack gap={2}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewMode('flat')}
          >
            <LuLayoutList />
            Flat
          </Button>
          <Button
            size="sm"
            variant="solid"
            onClick={() => setViewMode('hierarchical')}
          >
            <LuFolderTree />
            Hierarchical
          </Button>
        </HStack>
      </HStack>

      <VStack align="stretch" gap={6}>
        {/* Member-sponsored circles section */}
        {hierarchy.memberCircles.length > 0 && (
          <CollapsibleRoot defaultOpen>
            <Box
              borderWidth="1px"
              borderRadius="lg"
              p={4}
              bg="blue.50"
              _dark={{ bg: "blue.900" }}
            >
              <CollapsibleTrigger asChild>
                <HStack justify="space-between" cursor="pointer" _hover={{ bg: "blue.100", _dark: { bg: "blue.800" } }} p={2} borderRadius="md">
                  <HStack>
                    <Avatar.Root size="lg">
                      <Avatar.Fallback bg="blue.200" color="blue.700">
                        M
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="bold" fontSize="lg">
                        Member's Groups
                      </Text>
                      <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>
                        {hierarchy.memberCircles.length} {hierarchy.memberCircles.length === 1 ? 'circle' : 'circles'}
                      </Text>
                    </VStack>
                  </HStack>
                </HStack>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Box mt={4} pl={4}>
                  {hierarchy.memberCircles.map(circle => (
                    <Box
                      key={circle.id}
                      py={2}
                      px={3}
                      mb={2}
                      borderWidth="1px"
                      borderRadius="md"
                      bg="white"
                      _dark={{ bg: "gray.800" }}
                      cursor="pointer"
                      onClick={() => handleGroupClick(circle)}
                      _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                    >
                      <HStack align="start">
                        {renderAvatar(circle)}
                        <VStack align="start" flex={1} gap={1}>
                          {renderTitle(circle)}
                          {renderDescription(circle)}
                          {renderMetadata(circle)}
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </Box>
              </CollapsibleContent>
            </Box>
          </CollapsibleRoot>
        )}

        {/* Parent groups with their circles */}
        {hierarchy.parentGroups.map(parentGroup => {
          const childCircles = hierarchy.groupCirclesMap.get(parentGroup.id) || [];
          const hasChildren = childCircles.length > 0;
          const isExpanded = expandedGroups.has(parentGroup.id);

          return (
            <Box key={parentGroup.id}>
              {hasChildren ? (
                <Box
                  borderWidth="1px"
                  borderRadius="lg"
                  p={4}
                  bg="white"
                  _dark={{ bg: "gray.800" }}
                >
                  <HStack
                    align="start"
                    gap={2}
                    position="relative"
                  >
                    {/* Clickable area for navigation */}
                    <HStack
                      flex={1}
                      cursor="pointer"
                      onClick={() => handleGroupClick(parentGroup)}
                      _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                      p={2}
                      borderRadius="md"
                      mr={10}
                    >
                      {renderAvatar(parentGroup)}
                      <VStack align="start" flex={1} gap={1}>
                        {renderTitle(parentGroup)}
                        {renderDescription(parentGroup)}
                        <HStack justify="space-between" w="full">
                          {renderMetadata(parentGroup)}
                          <Text fontSize="xs" color="blue.500" fontWeight="medium">
                            {childCircles.length} {childCircles.length === 1 ? 'circle' : 'circles'}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>

                    {/* Chevron button for expand/collapse */}
                    <IconButton
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                      size="sm"
                      variant="ghost"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        toggleGroupExpansion(parentGroup.id);
                      }}
                      position="absolute"
                      right={0}
                      top={2}
                    >
                      {isExpanded ? <LuChevronUp /> : <LuChevronDown />}
                    </IconButton>
                  </HStack>

                  {/* Child circles - shown when expanded */}
                  {isExpanded && (
                    <Box mt={4} pl={4}>
                      {childCircles.map(circle => (
                        <Box
                          key={circle.id}
                          py={2}
                          px={3}
                          mb={2}
                          borderWidth="1px"
                          borderRadius="md"
                          bg="gray.50"
                          _dark={{ bg: "gray.700" }}
                          cursor="pointer"
                          onClick={() => handleGroupClick(circle)}
                          _hover={{ bg: "gray.100", _dark: { bg: "gray.600" } }}
                        >
                          <HStack align="start">
                            {renderAvatar(circle)}
                            <VStack align="start" flex={1} gap={1}>
                              {renderTitle(circle)}
                              {renderDescription(circle)}
                              {renderMetadata(circle)}
                            </VStack>
                          </HStack>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  borderWidth="1px"
                  borderRadius="lg"
                  p={4}
                  bg="white"
                  _dark={{ bg: "gray.800" }}
                  cursor="pointer"
                  onClick={() => handleGroupClick(parentGroup)}
                  _hover={{ bg: "gray.50", _dark: { bg: "gray.700" } }}
                >
                  <HStack align="start">
                    {renderAvatar(parentGroup)}
                    <VStack align="start" flex={1} gap={1}>
                      {renderTitle(parentGroup)}
                      {renderDescription(parentGroup)}
                      {renderMetadata(parentGroup)}
                    </VStack>
                  </HStack>
                </Box>
              )}
            </Box>
          );
        })}

        {/* Orphan circles (shouldn't exist, but handle gracefully) */}
        {hierarchy.orphanCircles.length > 0 && (
          <Box>
            <Text fontSize="sm" color="red.500" mb={2}>
              Circles without a parent (data issue):
            </Text>
            {hierarchy.orphanCircles.map(circle => (
              <Box
                key={circle.id}
                p={3}
                mb={2}
                borderWidth="1px"
                borderRadius="md"
                bg="red.50"
                _dark={{ bg: "red.900" }}
                cursor="pointer"
                onClick={() => handleGroupClick(circle)}
              >
                <HStack align="start">
                  {renderAvatar(circle)}
                  <VStack align="start" flex={1} gap={1}>
                    {renderTitle(circle)}
                    {renderDescription(circle)}
                    {renderMetadata(circle)}
                  </VStack>
                </HStack>
              </Box>
            ))}
          </Box>
        )}

        {/* Create button */}
        {showCreateButton && (
          <Button
            onClick={handleCreateClick}
            colorScheme="green"
            size="lg"
            alignSelf="center"
          >
            Create Group
          </Button>
        )}

        {/* Empty state */}
        {groups.length === 0 && (
          <Box textAlign="center" py={10}>
            <Text fontSize="lg" fontWeight="medium" mb={2}>
              {emptyStateMessage}
            </Text>
            <Text fontSize="sm" color="gray.500">
              Create your first group to get started
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}

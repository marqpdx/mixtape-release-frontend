// apps/mixtape/src/components/groups/GroupsTable.tsx

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Text, HStack, Box, Avatar, Image, Button, VStack, IconButton, Menu, Portal } from "@chakra-ui/react";
import type { ComponentType } from "react";
import { Icons } from "@components/icons/IconMap";
import UniversalDataTable from "@components/common/UniversalDataTable";
import { AvatarGroup, CollapsibleRoot, CollapsibleTrigger, CollapsibleContent } from "@chakra-ui/react";
import { Group } from "@mixtape/core/types/groupTypes";
import type { GroupPulse } from "@mixtape/core/types/activityTypes";
import { getBestEmblemUrl } from "@mixtape/core/types/emblemTypes";
import { useGroupPulse } from "@mixtape/api/hooks/activity/useActivity";
import { LuLayoutList, LuFolderTree, LuChevronDown, LuChevronUp } from "react-icons/lu";
import { IconChevronDown as TablerChevronDown } from "@tabler/icons-react";

/**
 * PulseIndicators — temporary thin renderer for group activity dots.
 * Designed to be swapped for <IndicatorRings> when that component is built.
 */
const PULSE_INDICATORS = [
  { key: "livewire", color: "#3b82f6", label: "Chat" },        // blue
  { key: "threadworks", color: "#8b5cf6", label: "Discussions" }, // purple
  { key: "writing", color: "#f59e0b", label: "Writing" },       // amber
  { key: "earthlab", color: "#22c55e", label: "Courses" },      // green
  { key: "members", color: "#ec4899", label: "Members" },       // pink
] as const;

function PulseIndicators({ pulse }: { pulse?: GroupPulse }) {
  if (!pulse) return null;
  const active = PULSE_INDICATORS.filter(i => pulse[i.key]);
  if (active.length === 0) return null;
  return (
    <HStack gap={1} mt={1}>
      {active.map(i => (
        <Box
          key={i.key}
          w="6px"
          h="6px"
          borderRadius="full"
          bg={i.color}
          title={i.label}
        />
      ))}
    </HStack>
  );
}

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
type SortKey = 'name' | 'created' | 'activity';

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
  const { pulseData } = useGroupPulse();
  const [viewMode, setViewMode] = useState<ViewMode>('hierarchical');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>('created');

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("groups_sort_key") as SortKey | null;
    if (saved === "name" || saved === "created" || saved === "activity") {
      setSortKey(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("groups_sort_key", sortKey);
  }, [sortKey]);

  const sortGroups = useMemo(
    () => (items: Group[]) => {
      const sorted = [...items];
      sorted.sort((a, b) => {
        if (sortKey === 'name') {
          return a.title.localeCompare(b.title);
        }

        if (sortKey === 'created') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }

        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
      return sorted;
    },
    [sortKey]
  );

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

    const sortedParentGroups = sortGroups(parentGroups);
    const sortedMemberCircles = sortGroups(memberCircles);
    const sortedOrphanCircles = sortGroups(orphanCircles);
    const sortedGroupCirclesMap = new Map<string, Group[]>();

    groupCirclesMap.forEach((circles, parentId) => {
      sortedGroupCirclesMap.set(parentId, sortGroups(circles));
    });

    return {
      parentGroups: sortedParentGroups,
      memberCircles: sortedMemberCircles,
      groupCirclesMap: sortedGroupCirclesMap,
      orphanCircles: sortedOrphanCircles,
    };
  }, [groups, sortGroups]);

  // Flat view: all groups sorted by created_at
  const flatGroups = useMemo(() => sortGroups(groups), [groups, sortGroups]);

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
    const groupIcons = Icons.group as Record<string, unknown>;
    const GroupIcon = groupIcons[group.group_type] as ComponentType<{ size?: number }> | undefined;
    const emblemUrl = getBestEmblemUrl(group.emblem ?? null, 96);
    const groupProfileImageRaw = group.profile_image_url ?? group.profile_image ?? null;
    const groupProfileImage =
      groupProfileImageRaw && groupProfileImageRaw.trim() !== ""
        ? groupProfileImageRaw.trim()
        : undefined;
    const avatarSrc = emblemUrl || groupProfileImage;
    return (
      <Box flexShrink={0}>
        <AvatarGroup>
          <Avatar.Root size="lg">
            <Avatar.Image
              src={avatarSrc}
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
      <PulseIndicators pulse={pulseData[group.id]} />
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
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button size="sm" variant="outline">
                  Sort: {sortKey === 'name' ? 'Name' : sortKey === 'created' ? 'Date Formed' : 'Last Activity'}
                  <TablerChevronDown size={16} />
                </Button>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content>
                    <Menu.Item value="activity" onClick={() => setSortKey('activity')}>
                      Last Activity
                    </Menu.Item>
                    <Menu.Item value="created" onClick={() => setSortKey('created')}>
                      Date Formed
                    </Menu.Item>
                    <Menu.Item value="name" onClick={() => setSortKey('name')}>
                      Name (A–Z)
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
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
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button size="sm" variant="outline">
                Sort: {sortKey === 'name' ? 'Name' : sortKey === 'created' ? 'Date Formed' : 'Last Activity'}
                <TablerChevronDown size={16} />
              </Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="activity" onClick={() => setSortKey('activity')}>
                    Last Activity
                  </Menu.Item>
                  <Menu.Item value="created" onClick={() => setSortKey('created')}>
                    Date Formed
                  </Menu.Item>
                  <Menu.Item value="name" onClick={() => setSortKey('name')}>
                    Name (A–Z)
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
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
                      p={0}
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

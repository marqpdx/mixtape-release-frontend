// src/components/groups/GroupsTable.tsx

"use client";

import { useRouter } from "next/navigation";
import { Text, HStack, Box, Avatar } from "@chakra-ui/react";
import { Icons } from "@components/icons/IconMap";
import UniversalDataTable from "@components/common/UniversalDataTable";
import { AvatarGroup } from "@chakra-ui/react";
import { Group } from "@/types/groupTypes";

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

export default function GroupsTable({
  groups = [],
  isLoading = false,
  error = null,
  showCreateButton = false,
  onGroupClick,
  setActiveSection,
  canEditGroup = () => true, // Default: assume user can edit
  emptyStateMessage = "No groups found. Create your first group to get started.",
}: GroupsTableProps) {
  const router = useRouter();

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

  return (
    <UniversalDataTable<Group>
      data={groups}
      title="Groups"
      showAvatar={true}
      onRowClick={handleGroupClick}
      showCreateButton={showCreateButton}
      onCreateClick={handleCreateClick}
      createButtonLabel="Create Group"
      canEdit={canEditGroup}
      canView={() => true}
      emptyStateMessage="No groups found"
      emptyStateSubtitle="Create your first group to get started"

      // Custom renderers
      renderAvatar={(group) => {
        // Type-safe icon lookup with fallback
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
      }}

      renderTitle={(group) => (
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
      )}

      renderDescription={(group) => (
        <Text
          fontSize="sm"
          color="gray.600"
          _dark={{ color: "gray.300" }}
          lineClamp={2}
          wordBreak="break-word"
        >
          {group.description || "No description available"}
        </Text>
      )}

      renderMetadata={(group) => (
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
      )}
    />
  );
}
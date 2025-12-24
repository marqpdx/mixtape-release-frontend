"use client";

import { useRouter } from "next/navigation";
import { Box, HStack, Text, Avatar, AvatarGroup } from "@chakra-ui/react";
import UniversalDataTable from "@/components/common/UniversalDataTable";
import { Icons } from "@/components/icons/IconMap";
import type { Group } from "@/types/groupTypes";

type GroupsListProps = {
  title: string;
  groups: Group[];
  isLoading?: boolean;
  error?: Error | null;

  emptyStateMessage?: string;
  emptyStateSubtitle?: string;

  // create button
  showCreateButton?: boolean;
  createButtonLabel?: string;
  onCreateClick?: () => void;

  // row click
  onRowClick?: (group: Group) => void;

  // permissions
  canEditGroup?: (group: Group) => boolean;
};

export default function GroupsList({
  title,
  groups,
  isLoading = false,
  error = null,
  emptyStateMessage = "No items found",
  emptyStateSubtitle = "Nothing to show yet.",
  showCreateButton = false,
  createButtonLabel = "Create",
  onCreateClick,
  onRowClick,
  canEditGroup = () => true,
}: GroupsListProps) {
  const router = useRouter();

  const handleRowClick = (group: Group) => {
    if (onRowClick) return onRowClick(group);
    router.push(`/groups/${group.slug}`);
  };

  // Loading
  if (isLoading) {
    return (
      <UniversalDataTable<Group>
        data={[]}
        title={title}
        showAvatar
        showCreateButton={showCreateButton}
        onCreateClick={onCreateClick}
        createButtonLabel={createButtonLabel}
        emptyStateMessage="Loading…"
        emptyStateSubtitle="Fetching items"
      />
    );
  }

  // Error
  if (error) {
    return (
      <UniversalDataTable<Group>
        data={[]}
        title={title}
        showAvatar
        showCreateButton={showCreateButton}
        onCreateClick={onCreateClick}
        createButtonLabel={createButtonLabel}
        emptyStateMessage="Failed to load"
        emptyStateSubtitle={error.message}
      />
    );
  }

  return (
    <UniversalDataTable<Group>
      data={groups}
      title={title}
      showAvatar
      onRowClick={handleRowClick}
      showCreateButton={showCreateButton}
      onCreateClick={onCreateClick}
      createButtonLabel={createButtonLabel}
      canEdit={canEditGroup}
      canView={() => true}
      emptyStateMessage={emptyStateMessage}
      emptyStateSubtitle={emptyStateSubtitle}
      renderAvatar={(group) => {
        const groupIcons = Icons.group as Record<string, any>;
        const GroupIcon = groupIcons[group.group_type];

        const imgRaw = group.profile_image_url ?? group.profile_image ?? null;
        const img =
          imgRaw && typeof imgRaw === "string" && imgRaw.trim() !== ""
            ? imgRaw.trim()
            : undefined;

        return (
          <Box flexShrink={0}>
            <AvatarGroup>
              <Avatar.Root size="lg">
                <Avatar.Image src={img} alt={`${group.title} profile`} />
                <Avatar.Fallback bg="green.100" color="green.700">
                  {GroupIcon ? <GroupIcon size={24} /> : group.title.charAt(0).toUpperCase()}
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
        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }} lineClamp={2}>
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
              {group.member_count} {group.member_count === 1 ? "member" : "members"}
            </Text>
          )}
        </HStack>
      )}
    />
  );
}

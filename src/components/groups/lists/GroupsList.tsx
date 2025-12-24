// src/components/groups/lists/GroupsList.tsx

"use client";

import { useRouter } from "next/navigation";
import { Avatar, Box, HStack, Text } from "@chakra-ui/react";
import UniversalDataTable from "@/components/common/UniversalDataTable";
import type { Group } from "@/types/groupTypes";
import { Icons } from "@/components/icons/IconMap";

export interface GroupsListProps {
  title?: string;

  groups: Group[];
  isLoading?: boolean;
  error?: Error | null;

  canEditGroup?: (group: Group) => boolean;

  // Row behavior
  getRowHref?: (group: Group) => string;
  onRowClick?: (group: Group) => void;

  // Create button
  showCreateButton?: boolean;
  createButtonLabel?: string;
  onCreateClick?: () => void;

  // Permissions gating (optional)
  canEdit?: (group: Group) => boolean;
  canView?: (group: Group) => boolean;

  // Empty states
  emptyStateMessage?: string;
  emptyStateSubtitle?: string;

  // Optional customizers
  renderAvatar?: (group: Group) => React.ReactNode;
  renderTitle?: (group: Group) => React.ReactNode;
  renderDescription?: (group: Group) => React.ReactNode;
  renderMetadata?: (group: Group) => React.ReactNode;

  // Badge in title row
  badgeText?: (group: Group) => string | null;
}

function DefaultAvatar({ group }: { group: Group }) {
  const groupIcons = (Icons.group ?? {}) as Record<string, any>;
  const GroupIcon = groupIcons[group.group_type];

  const raw = (group as any).profile_image_url ?? (group as any).profile_image ?? null;
  const src = raw && String(raw).trim() !== "" ? String(raw).trim() : undefined;

  return (
    <Box flexShrink={0}>
      <Avatar.Root size="lg">
        <Avatar.Image src={src} alt={`${group.title} profile`} />
        <Avatar.Fallback bg="green.100" color="green.700">
          {GroupIcon ? <GroupIcon size={24} /> : group.title?.charAt(0)?.toUpperCase()}
        </Avatar.Fallback>
      </Avatar.Root>
    </Box>
  );
}

function DefaultTitle({
  group,
  badge,
}: {
  group: Group;
  badge: string | null;
}) {
  return (
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

      {badge && (
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
          {badge}
        </Text>
      )}
    </HStack>
  );
}

function DefaultDescription({ group }: { group: Group }) {
  return (
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
}

function DefaultMetadata({ group }: { group: Group }) {
  const createdAt = (group as any).created_at;
  const memberCount = (group as any).member_count;

  return (
    <HStack gap={4} mt={1}>
      {createdAt && (
        <Text fontSize="xs" color="gray.400">
          Created {new Date(createdAt).toLocaleDateString()}
        </Text>
      )}
      {typeof memberCount === "number" && (
        <Text fontSize="xs" color="gray.400">
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </Text>
      )}
    </HStack>
  );
}

export default function GroupsList({
  title = "Groups",
  groups,
  isLoading = false,
  error = null,

  getRowHref,
  onRowClick,

  showCreateButton = false,
  createButtonLabel = "Create Group",
  onCreateClick,

  canEdit = () => true,
  canView = () => true,

  emptyStateMessage = "No groups found",
  emptyStateSubtitle = "Create your first group to get started.",

  renderAvatar,
  renderTitle,
  renderDescription,
  renderMetadata,

  badgeText = (g) => g.group_type ?? null,
  canEditGroup = () => true,

}: GroupsListProps) {
  const router = useRouter();

  const handleRowClick = (group: Group) => {
    if (onRowClick) return onRowClick(group);
    if (getRowHref) return router.push(getRowHref(group));
    router.push(`/groups/${group.slug}`);
  };

  const handleCreate = () => {
    if (onCreateClick) return onCreateClick();
    router.push("/groups/create");
  };

  // Loading
  if (isLoading) {
    return (
      <UniversalDataTable<Group>
        data={[]}
        title={title}
        showAvatar
        showCreateButton={showCreateButton}
        onCreateClick={handleCreate}
        createButtonLabel={createButtonLabel}
        emptyStateMessage="Loading..."
        emptyStateSubtitle="Please wait while we fetch content."
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
        onCreateClick={handleCreate}
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
      onCreateClick={handleCreate}
      createButtonLabel={createButtonLabel}
      canEdit={canEdit}
      canView={canView}
      emptyStateMessage={emptyStateMessage}
      emptyStateSubtitle={emptyStateSubtitle}
      renderAvatar={(g) => (renderAvatar ? renderAvatar(g) : <DefaultAvatar group={g} />)}
      renderTitle={(g) =>
        renderTitle ? renderTitle(g) : <DefaultTitle group={g} badge={badgeText(g)} />
      }
      renderDescription={(g) => (renderDescription ? renderDescription(g) : <DefaultDescription group={g} />)}
      renderMetadata={(g) => (renderMetadata ? renderMetadata(g) : <DefaultMetadata group={g} />)}
    />
  );
}

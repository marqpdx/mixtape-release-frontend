// src/components/groups/dispatch/GroupDispatchWrapper.tsx

"use client";

import { Box } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import GroupDispatchMainWorkArea from "./GroupDispatchMainWorkArea";

interface GroupPermissions {
  canCreatePost: boolean;
  canManagePosts: boolean;
  canEditGroup: boolean;
  canManageMembers: boolean;
}

interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  permissions: GroupPermissions;
}

interface GroupDispatchWrapperProps {
  groupSlug: string;
  groupId?: string;
  groupName?: string;
  setActiveSection: (section: string, params?: Record<string, string>) => void;
  onPublished?: (doc: any) => void;
}

export default function GroupDispatchWrapper({
  groupSlug,
  groupId,
  groupName,
  setActiveSection,
  onPublished,
}: GroupDispatchWrapperProps) {
  // Fetch group data and permissions if not provided
  const {
    data: group,
    isLoading,
    error,
  } = useQuery<Group>({
    queryKey: ["group", groupSlug],
    queryFn: () =>
      axiosInstance.get(`/api/groups/${groupSlug}`).then((res) => res.data),
    enabled: !groupName, // Only fetch if we don't already have group info
  });

  // Use provided data or fetched data
  const displayName = groupName || group?.name;
  const effectiveGroupId = groupId || group?.id;
  const canCreateDispatch = group?.permissions?.canCreatePost ?? true;
  const canManageDispatch = group?.permissions?.canManagePosts ?? false;

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        Loading...
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={8} color="red.500">
        Error loading group information
      </Box>
    );
  }

  return (
    <GroupDispatchMainWorkArea
      groupSlug={groupSlug}
      groupId={effectiveGroupId}
      groupName={displayName}
      canCreateDispatch={canCreateDispatch}
      canManageDispatch={canManageDispatch}
      setActiveSection={setActiveSection}
    />
  );
}

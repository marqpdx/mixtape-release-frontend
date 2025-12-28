// src/components/groups/writing/GroupWritingWrapper.tsx

"use client";

import { Box } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";
import GroupWritingMainWorkArea from "./GroupWritingMainWorkArea";

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

interface GroupWritingWrapperProps {
  groupSlug: string;
  groupId?: string;
  groupTitle?: string;
  setActiveSection: (section: string, params?: Record<string, string>) => void;
  onPublished?: (piece: any) => void;
}

export default function GroupWritingWrapper({
  groupSlug,
  groupId,
  groupTitle,
  setActiveSection,
  onPublished,
}: GroupWritingWrapperProps) {
  // Fetch group data and permissions if not provided
  const {
    data: group,
    isLoading,
    error,
  } = useQuery<Group>({
    queryKey: ["group", groupSlug],
    queryFn: () =>
      axiosInstance.get(`/api/groups/${groupSlug}`).then((res) => res.data),
    enabled: !groupTitle, // Only fetch if we don't already have group info
  });

  // Use provided data or fetched data
  const displayName = groupTitle || group?.name;
  const canCreatePost = group?.permissions?.canCreatePost ?? true;
  const canManagePosts = group?.permissions?.canManagePosts ?? false;

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
    <GroupWritingMainWorkArea
      groupSlug={groupSlug}
      // groupId={groupId}
      groupTitle={displayName}
      canCreatePost={canCreatePost}
      canManagePosts={canManagePosts}
      setActiveSection={setActiveSection}
    />
  );
}
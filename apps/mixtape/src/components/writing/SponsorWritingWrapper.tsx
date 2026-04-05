// apps/mixtape/src/components/writing/SponsorWritingWrapper.tsx

"use client";

import { Box } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import WritingListWrapper from "@components/writing/WritingListWrapper";
import { useRouter } from "next/navigation";

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

interface SponsorConfig {
  type: "group" | "member";
  id?: string;
  slug: string;
  displayName?: string;
}

interface SponsorWritingWrapperProps {
  sponsor: SponsorConfig;
  setActiveSection: (section: string, params?: Record<string, string>) => void;
  canCreatePost?: boolean;
  canManagePosts?: boolean;
}

export default function SponsorWritingWrapper({
  sponsor,
  setActiveSection,
  canCreatePost,
  canManagePosts,
}: SponsorWritingWrapperProps) {
  const router = useRouter();
  const shouldFetchGroup = sponsor.type === "group" && !sponsor.displayName;

  const {
    data: group,
    isLoading,
    error,
  } = useQuery<Group>({
    queryKey: ["group", sponsor.slug],
    queryFn: () => axiosInstance.get(`/api/groups/${sponsor.slug}`).then((res) => res.data),
    enabled: shouldFetchGroup,
  });

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
        Error loading sponsor information
      </Box>
    );
  }

  const displayName = sponsor.displayName || group?.name;
  const resolvedCreatePost = canCreatePost ?? group?.permissions?.canCreatePost ?? true;
  const resolvedManagePosts = canManagePosts ?? group?.permissions?.canManagePosts ?? false;

  return (
    <WritingListWrapper
      sponsor={{
        type: sponsor.type,
        id: sponsor.id,
        slug: sponsor.slug,
        displayName,
      }}
      canCreatePost={resolvedCreatePost}
      canManagePosts={resolvedManagePosts}
      onNavigateToEditor={(pieceId) => {
        if (pieceId) {
          setActiveSection("write", { piece: pieceId });
        } else {
          setActiveSection("write");
        }
      }}
      onNavigateToDetail={({ id, slug }) => {
        if (sponsor.type === "group") {
          router.replace(`/groups/${sponsor.slug}/writing/${slug}`);
        } else {
          setActiveSection("write", { piece: id });
        }
      }}
    />
  );
}

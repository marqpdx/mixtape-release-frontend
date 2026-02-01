// src/components/groups/writing/GroupWritingMainWorkArea.tsx
/**
 * DEPRECATED: Use WritingListWrapper instead
 * This is a thin wrapper for backward compatibility
 */

"use client";

import WritingListWrapper from "@components/writing/WritingListWrapper";
import { useRouter } from "next/navigation";

interface GroupWritingMainWorkAreaProps {
  groupSlug: string;
  groupTitle?: string;
  canCreatePost?: boolean;
  canManagePosts?: boolean;
  setActiveSection: (section: string, params?: Record<string, string>) => void;
}

/**
 * Backward-compatible wrapper for group writing list view
 * @deprecated Use WritingListWrapper directly with sponsor config
 */
export default function GroupWritingMainWorkArea({
  groupSlug,
  groupTitle,
  canCreatePost = true,
  canManagePosts = false,
  setActiveSection,
}: GroupWritingMainWorkAreaProps) {
  const router = useRouter();

  return (
    <WritingListWrapper
      sponsor={{
        type: 'group',
        slug: groupSlug,
        displayName: groupTitle,
      }}
      canCreatePost={canCreatePost}
      canManagePosts={canManagePosts}
      onNavigateToEditor={(pieceId) => {
        if (pieceId) {
          setActiveSection("write", { piece: pieceId });
        } else {
          setActiveSection("write");
        }
      }}
      onNavigateToDetail={({ slug }) => {
        router.replace(`/groups/${groupSlug}/writing/${slug}`);
      }}
    />
  );
}

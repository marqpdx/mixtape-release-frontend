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
  groupName?: string;
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
  groupName,
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
        displayName: groupName,
      }}
      canCreatePost={canCreatePost}
      canManagePosts={canManagePosts}
      onNavigateToEditor={(pieceId) => {
        console.log("000 Navigating to editor for piece ID:", pieceId);
        if (pieceId) {
          setActiveSection("do-writing", { piece: pieceId });
        } else {
          setActiveSection("do-writing");
        }
      }}
      onNavigateToDetail={(pieceSlug) => {
        router.replace(`/groups/${groupSlug}/writing/${pieceSlug}`);
      }}
    />
  );
}

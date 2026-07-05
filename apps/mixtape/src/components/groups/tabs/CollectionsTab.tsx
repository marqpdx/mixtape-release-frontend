// apps/mixtape/src/components/groups/tabs/CollectionsTab.tsx

"use client";

import type { ReactNode } from "react";
import { Box } from "@chakra-ui/react";
import { canUserModerateGroup, type Group } from "@mixtape/core/types/groupTypes";
import { CollectionsExplorer } from "@/components/collections";

interface CollectionsTabProps {
  group: Group;
  // Kept for interface compatibility — Explorer manages its own nav state
  selectedCollectionId?: string | null;
  onSelectedCollectionIdChange?: (collectionId: string | null) => void;
  detailBackNav?: ReactNode;
}

export function CollectionsTab({ group, selectedCollectionId }: CollectionsTabProps) {
  const isAdmin = canUserModerateGroup(group);

  return (
    <Box className="cex-tab-root">
      <CollectionsExplorer
        sponsor={{
          type: "group",
          id: group.id,
          slug: group.slug,
          displayName: group.title,
        }}
        initialCollectionId={selectedCollectionId}
        isAdmin={isAdmin}
      />
    </Box>
  );
}

// apps/mixtape/src/components/groups/tabs/CollectionsTab.tsx

"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Box } from "@chakra-ui/react";
import type { Group } from "@mixtape/core/types/groupTypes";
import { canUserModerateGroup } from "@mixtape/core/types/groupTypes";
import { CollectionsWorkArea, CollectionDetailWorkArea } from "@/components/collections";

interface CollectionsTabProps {
  group: Group;
  selectedCollectionId?: string | null;
  onSelectedCollectionIdChange?: (collectionId: string | null) => void;
  detailBackNav?: ReactNode;
}

export function CollectionsTab({
  group,
  selectedCollectionId: controlledSelectedCollectionId,
  onSelectedCollectionIdChange,
  detailBackNav,
}: CollectionsTabProps) {
  const [internalSelectedCollectionId, setInternalSelectedCollectionId] = useState<string | null>(null);
  const isAdminOrSteward = canUserModerateGroup(group);
  const selectedCollectionId =
    controlledSelectedCollectionId !== undefined ? controlledSelectedCollectionId : internalSelectedCollectionId;

  const setSelectedCollectionId = (collectionId: string | null) => {
    if (controlledSelectedCollectionId === undefined) {
      setInternalSelectedCollectionId(collectionId);
    }
    onSelectedCollectionIdChange?.(collectionId);
  };

  return (
    <Box position="relative">
      {/* Detail panel — fades in when a collection is selected */}
      <Box
        position={selectedCollectionId ? "relative" : "absolute"}
        top={0}
        left={0}
        right={0}
        opacity={selectedCollectionId ? 1 : 0}
        pointerEvents={selectedCollectionId ? "auto" : "none"}
        transition="opacity 0.15s ease"
        zIndex={selectedCollectionId ? 1 : 0}
        aria-hidden={!selectedCollectionId}
      >
        {selectedCollectionId && (
          <CollectionDetailWorkArea
            collectionId={selectedCollectionId}
            onBack={() => setSelectedCollectionId(null)}
            canEdit={isAdminOrSteward}
            backNav={detailBackNav}
          />
        )}
      </Box>

      {/* Collection list — fades out when a detail is open */}
      <Box
        opacity={selectedCollectionId ? 0 : 1}
        pointerEvents={selectedCollectionId ? "none" : "auto"}
        transition="opacity 0.15s ease"
        aria-hidden={!!selectedCollectionId}
      >
        <CollectionsWorkArea
          sponsor={{
            type: "group",
            id: group.id,
            slug: group.slug,
            displayName: group.title,
          }}
          onNavigateToCollection={setSelectedCollectionId}
        />
      </Box>
    </Box>
  );
}

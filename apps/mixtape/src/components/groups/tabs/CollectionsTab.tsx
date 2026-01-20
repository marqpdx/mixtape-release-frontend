// apps/mixtape/src/components/groups/tabs/CollectionsTab.tsx

"use client";

import type { Group } from "@mixtape/core/types/groupTypes";
import { CollectionsWorkArea } from "@/components/collections";

export function CollectionsTab({ group }: { group: Group }) {
  return (
    <CollectionsWorkArea
      sponsor={{
        type: "group",
        id: group.id,
        slug: group.slug,
        displayName: group.title,
      }}
    />
  );
}

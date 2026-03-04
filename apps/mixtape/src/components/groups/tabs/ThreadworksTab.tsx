// apps/mixtape/src/components/groups/tabs/ThreadworksTab.tsx

"use client";

import type { Group } from "@mixtape/core/types/groupTypes";
import ThreadworksWorkArea from "@/components/threadworks/ThreadworksWorkArea";

interface ThreadworksTabProps {
  group: Group;
}

export function ThreadworksTab({ group }: ThreadworksTabProps) {
  return (
    <ThreadworksWorkArea
      section="threadworks-landing"
      groupSlug={group.slug}
      setActiveSection={() => {}}
    />
  );
}

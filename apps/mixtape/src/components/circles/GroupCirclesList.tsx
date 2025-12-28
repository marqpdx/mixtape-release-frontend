"use client";

import GroupsList from "@/components/groups/list/GroupsList";
import { useGroupCircles } from "@mixtape/api/hooks/groups/useGroups";
import type { Group } from "@mixtape/core/types/groupTypes";

type GroupCirclesListProps = {
  sponsorGroupSlug: string;

  // if you’re in a WorkArea, use this to switch sections
  setActiveSection?: (section: string, params?: Record<string, string>) => void;

  // optional override behavior
  onCircleClick?: (circle: Group) => void;
};

export default function GroupCirclesList({
  sponsorGroupSlug,
  setActiveSection,
  onCircleClick,
}: GroupCirclesListProps) {
  const { circles, isLoading, error } = useGroupCircles(sponsorGroupSlug, {
    // you can also omit this if endpoint is already circles-only
    group_type: "circle",
    ordering: "-created_at",
  });

  return (
    <GroupsList
      title="Circles"
      groups={circles}
      isLoading={isLoading}
      error={error}
      emptyStateMessage="No circles yet"
      emptyStateSubtitle="Create your first circle to get started."
      showCreateButton
      createButtonLabel="Create Circle"
      onCreateClick={() => {
        if (setActiveSection) {
          setActiveSection("circles-create");
        }
      }}
      onRowClick={(circle) => {
        if (onCircleClick) return onCircleClick(circle);
        // default behavior: go to the circle page
        window.location.href = `/groups/${circle.slug}`;
      }}
    />
  );
}

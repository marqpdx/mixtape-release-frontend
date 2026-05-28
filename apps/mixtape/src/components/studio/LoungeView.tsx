"use client";

import { Box, Skeleton, Text, VStack } from "@chakra-ui/react";
import { usePersonalStudio, usePersonalGroups } from "@mixtape/api/hooks/studio";
import { BerylPromptCard } from "./BerylPromptCard";
import { PersonalCard } from "./PersonalCard";
import { GroupContextCard } from "./GroupContextCard";
import { WritingContextCard } from "./WritingContextCard";
import type { StudioActivityItem } from "@mixtape/api/clients/studio/studioApi";

function groupActivityBySlug(
  items: StudioActivityItem[],
): Record<string, StudioActivityItem[]> {
  const map: Record<string, StudioActivityItem[]> = {};
  for (const item of items) {
    const slug = item.group_slug;
    if (!slug) continue;
    if (!map[slug]) map[slug] = [];
    map[slug].push(item);
  }
  return map;
}

export function LoungeView() {
  const { data: personal, isLoading: loadingPersonal, error: personalError } = usePersonalStudio();
  const { data: groups, isLoading: loadingGroups, error: groupsError } = usePersonalGroups();

  if (loadingPersonal || loadingGroups) {
    return (
      <VStack gap={4} align="stretch">
        <Skeleton height="80px" borderRadius="lg" />
        <Skeleton height="64px" borderRadius="lg" />
        <Skeleton height="120px" borderRadius="lg" />
        <Skeleton height="120px" borderRadius="lg" />
      </VStack>
    );
  }

  if (personalError || groupsError) {
    return <Text fontSize="sm" color="red.400">Failed to load Studio.</Text>;
  }

  const activityByGroup = groupActivityBySlug(personal?.activity ?? []);

  // Sort groups by activity count (salience proxy) — groups with more activity rank first
  const sortedGroups = [...(groups ?? [])].sort((a, b) => {
    const aCount = activityByGroup[a.slug]?.length ?? 0;
    const bCount = activityByGroup[b.slug]?.length ?? 0;
    return bCount - aCount;
  });

  // Writing context card: show when any in-progress pieces exist
  const inProgressPieces = (personal?.my_content ?? []).filter(
    (p) => p.status === "in_progress",
  );

  return (
    <Box>
      {/* Position 1 — Beryl prompt (conditional) */}
      {personal?.beryl_prompt && (
        <BerylPromptCard prompt={personal.beryl_prompt} />
      )}

      {/* Position 2 — Personal card (always present) */}
      <PersonalCard />

      {/* Position 3 — Group context cards */}
      {sortedGroups.map((group) => (
        <GroupContextCard
          key={group.slug}
          group={group}
          digestItems={activityByGroup[group.slug] ?? []}
        />
      ))}

      {/* Position 4 — Writing context card (conditional) */}
      {inProgressPieces.length > 0 && (
        <WritingContextCard pieces={inProgressPieces} />
      )}
    </Box>
  );
}

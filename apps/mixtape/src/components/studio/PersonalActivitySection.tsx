"use client";

import { Box, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { usePersonalStudio } from "@mixtape/api/hooks/studio";
import type { StudioActivityItem } from "@mixtape/api/clients/studio/studioApi";

function ActivityRow({ item }: { item: StudioActivityItem }) {
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const relativeTime = (ts: string | null) => {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <HStack
      justify="space-between"
      py={2}
      borderBottom="1px solid"
      borderColor={borderColor}
      _last={{ border: "none" }}
    >
      <VStack align="start" gap={0} flex={1} minW={0}>
        <Text fontSize="sm" fontWeight="medium" noOfLines={1}>{item.verb}</Text>
        {item.summary && (
          <Text fontSize="xs" color="gray.500" noOfLines={1}>{item.summary}</Text>
        )}
      </VStack>
      <Text fontSize="xs" color="gray.400" flexShrink={0} ml={2}>
        {relativeTime(item.timestamp)}
      </Text>
    </HStack>
  );
}

export function PersonalActivitySection() {
  const { data, isLoading, error } = usePersonalStudio();

  if (isLoading) {
    return (
      <VStack gap={3} align="stretch">
        <Skeleton height="36px" borderRadius="md" />
        <Skeleton height="36px" borderRadius="md" />
        <Skeleton height="36px" borderRadius="md" />
        <Skeleton height="36px" borderRadius="md" />
      </VStack>
    );
  }

  if (error) {
    return <Text fontSize="sm" color="red.400">Failed to load activity.</Text>;
  }

  const activity = data?.activity ?? [];

  if (activity.length === 0) {
    return <Text fontSize="sm" color="gray.400">No recent activity.</Text>;
  }

  return (
    <VStack gap={0} align="stretch">
      {activity.map((item) => (
        <ActivityRow key={item.id} item={item} />
      ))}
    </VStack>
  );
}

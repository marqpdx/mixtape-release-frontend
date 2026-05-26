"use client";

import { Box, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { usePersonalStudio } from "@mixtape/api/hooks/studio";
import type { StudioContentItem } from "@mixtape/api/clients/studio/studioApi";

function ContentRow({ item }: { item: StudioContentItem }) {
  const borderColor = useColorModeValue("gray.100", "gray.700");
  const statusColor: Record<string, string> = {
    draft: "gray.400",
    published: "green.400",
    archived: "orange.400",
  };

  return (
    <HStack
      justify="space-between"
      py={2}
      borderBottom="1px solid"
      borderColor={borderColor}
      _last={{ border: "none" }}
    >
      <Text fontSize="sm" fontWeight="medium" noOfLines={1} flex={1} minW={0}>
        {item.title}
      </Text>
      <Text
        fontSize="xs"
        color={statusColor[item.status] ?? "gray.400"}
        textTransform="capitalize"
        flexShrink={0}
        ml={2}
      >
        {item.status}
      </Text>
    </HStack>
  );
}

export function PersonalStudioFeed() {
  const { data, isLoading, error } = usePersonalStudio();

  if (isLoading) {
    return (
      <VStack gap={3} align="stretch">
        <Skeleton height="36px" borderRadius="md" />
        <Skeleton height="36px" borderRadius="md" />
      </VStack>
    );
  }

  if (error) {
    return <Text fontSize="sm" color="red.400">Failed to load content.</Text>;
  }

  const content = data?.my_content ?? [];

  if (content.length === 0) {
    return <Text fontSize="sm" color="gray.400">No writing pieces yet.</Text>;
  }

  return (
    <VStack gap={0} align="stretch">
      {content.map((item) => (
        <ContentRow key={item.id} item={item} />
      ))}
    </VStack>
  );
}

"use client";

import { Box, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { usePersonalGroups } from "@mixtape/api/hooks/studio";
import type { PersonalGroupItem } from "@mixtape/api/clients/studio/studioApi";
import { useRouter } from "next/navigation";

function GroupRow({ item }: { item: PersonalGroupItem }) {
  const router = useRouter();
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const badgeBg = useColorModeValue("gray.100", "gray.600");

  return (
    <HStack
      justify="space-between"
      px={3}
      py={2}
      borderRadius="md"
      cursor="pointer"
      _hover={{ bg: hoverBg }}
      onClick={() => router.push(`/studio/${item.slug}`)}
    >
      <VStack align="start" gap={0}>
        <Text fontWeight="medium" fontSize="sm">{item.name}</Text>
        <Text fontSize="xs" color="gray.500" textTransform="capitalize">{item.role}</Text>
      </VStack>
      {item.unread_count > 0 && (
        <Box bg={badgeBg} px={2} py={0.5} borderRadius="full">
          <Text fontSize="xs" fontWeight="semibold">{item.unread_count}</Text>
        </Box>
      )}
    </HStack>
  );
}

export function MyGroupsList() {
  const { data, isLoading, error } = usePersonalGroups();

  if (isLoading) {
    return (
      <VStack gap={3} align="stretch">
        <Skeleton height="48px" borderRadius="md" />
        <Skeleton height="48px" borderRadius="md" />
        <Skeleton height="48px" borderRadius="md" />
      </VStack>
    );
  }

  if (error) {
    return <Text fontSize="sm" color="red.400">Failed to load groups.</Text>;
  }

  if (!data || data.length === 0) {
    return <Text fontSize="sm" color="gray.400">No groups yet.</Text>;
  }

  return (
    <VStack gap={1} align="stretch">
      {data.map((item) => (
        <GroupRow key={item.slug} item={item} />
      ))}
    </VStack>
  );
}

"use client";

import { HStack, Text, VStack, Skeleton, Badge } from "@chakra-ui/react";
import Link from "next/link";
import { useColorModeValue } from "@components/ui/color-mode";
import { useReentry } from "@hooks/console/useConsole";

export function ReentryPanel() {
  const { data, isLoading } = useReentry();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const hoverBg = useColorModeValue("gray.50", "gray.750");

  if (isLoading) {
    return (
      <VStack gap={2} align="stretch">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} h="52px" borderRadius="md" />
        ))}
      </VStack>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Text fontSize="sm" color={mutedColor}>
        Nothing recent yet. Start writing or reading to build your re-entry trail.
      </Text>
    );
  }

  return (
    <VStack gap={2} align="stretch">
      {items.map((item) => {
        const href =
          item.kind === "draft"
            ? `/writing/${item.slug}/atelier`
            : `/writing/${item.slug}`;
        return (
          <Link key={item.id} href={href}>
            <HStack
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="md"
              px={4}
              py={3}
              _hover={{ bg: hoverBg }}
              cursor="pointer"
              justify="space-between"
            >
              <Text fontSize="sm" fontWeight="medium" noOfLines={1} flex={1}>
                {item.title || "(untitled)"}
              </Text>
              <Badge
                size="sm"
                colorPalette={item.kind === "draft" ? "orange" : "blue"}
                variant="subtle"
              >
                {item.kind === "draft" ? "draft" : "read"}
              </Badge>
            </HStack>
          </Link>
        );
      })}
    </VStack>
  );
}

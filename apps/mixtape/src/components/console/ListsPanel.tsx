"use client";

import { Badge, Box, HStack, Skeleton, Text, VStack } from "@chakra-ui/react";
import Link from "next/link";
import { useColorModeValue } from "@components/ui/color-mode";
import { useLists } from "@hooks/lists/useLists";

export function ListsPanel() {
  const { lists, isLoading } = useLists();
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.750");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  if (isLoading) {
    return (
      <VStack gap={2} align="stretch">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} h="52px" borderRadius="md" />
        ))}
      </VStack>
    );
  }

  if (lists.length === 0) {
    return (
      <Text fontSize="sm" color={mutedColor}>
        No lists yet. Promote some needs to create one.
      </Text>
    );
  }

  return (
    <VStack gap={2} align="stretch">
      {lists.slice(0, 10).map((list) => (
        <Link key={list.id} href={`/lists/${list.slug}`}>
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
            <VStack gap={0} align="start" flex={1} minW={0}>
              <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                {list.title}
              </Text>
              {list.stats.open > 0 && (
                <Text fontSize="xs" color={mutedColor}>
                  {list.stats.open} open · {list.stats.done} done
                </Text>
              )}
            </VStack>
            <HStack gap={2} flexShrink={0}>
              {list.stats.open > 0 && (
                <Badge size="sm" colorPalette="blue" variant="subtle">
                  {list.stats.open}
                </Badge>
              )}
              {list.stats.open === 0 && list.stats.total > 0 && (
                <Badge size="sm" colorPalette="green" variant="subtle">
                  done
                </Badge>
              )}
            </HStack>
          </HStack>
        </Link>
      ))}
    </VStack>
  );
}

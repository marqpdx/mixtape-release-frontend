// app/(main)/(site)/commons/page.tsx
//
// Public Crossroads Commons page.
// Two views: Map (default) and List. Both will show published CommonsItems.

"use client";

import { useState } from "react";
import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { CommonsMapPlaceholder } from "@components/commons/CommonsMapPlaceholder";

type ViewMode = "map" | "list";

export default function CommonsPage() {
  const [view, setView] = useState<ViewMode>("map");
  const headerBg = useColorModeValue("white", "gray.900");
  const subtitleColor = useColorModeValue("gray.600", "gray.400");

  return (
    <Box maxW="1200px" mx="auto" px={{ base: 4, md: 6 }} py={8}>
      {/* Header */}
      <VStack align="start" gap={1} mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Crossroads Commons
        </Text>
        <Text fontSize="sm" color={subtitleColor}>
          A curated atlas of meaningful initiatives — people, organizations, projects, and places.
        </Text>
      </VStack>

      {/* View toggle + filters bar */}
      <HStack justify="space-between" mb={4}>
        <HStack gap={1}>
          <Button
            size="sm"
            variant={view === "map" ? "solid" : "outline"}
            onClick={() => setView("map")}
          >
            Map
          </Button>
          <Button
            size="sm"
            variant={view === "list" ? "solid" : "outline"}
            onClick={() => setView("list")}
          >
            List
          </Button>
        </HStack>
      </HStack>

      {/* Content area */}
      {view === "map" ? (
        <Box h="calc(100vh - 300px)" minH="400px">
          <CommonsMapPlaceholder />
        </Box>
      ) : (
        <VStack align="stretch" gap={4} py={4}>
          <Text fontSize="sm" color={subtitleColor}>
            No published items yet.
          </Text>
        </VStack>
      )}
    </Box>
  );
}

// src/components/writing/DraftFilterToolbar.tsx
/**
 * Compact toolbar for filtering drafts with show toggles
 * Shows: [Show: Mine] [Show: Collab] [All] | [+ New Doc]
 */

"use client";

import { HStack, Button, Text, Box, Separator } from "@chakra-ui/react";
import { IconPlus } from "@tabler/icons-react";

interface DraftFilterToolbarProps {
  showSolo: boolean;
  showCollab: boolean;
  onToggleShowSolo: () => void;
  onToggleShowCollab: () => void;
  onShowAll: () => void;
  onCreateNew: () => void;
  canCreate?: boolean;
}

export function DraftFilterToolbar({
  showSolo,
  showCollab,
  onToggleShowSolo,
  onToggleShowCollab,
  onShowAll,
  onCreateNew,
  canCreate = true,
}: DraftFilterToolbarProps) {
  // All button is disabled when both filters are already active
  const isAllDisabled = showSolo && showCollab;

  return (
    <HStack gap={3} mb={4} justify="space-between">
      {/* Filter section */}
      <HStack gap={2}>
        <Text fontSize="sm" fontWeight="medium" color="gray.600" _dark={{ color: "gray.400" }}>
          Show:
        </Text>
        <Box position="relative">
          <Button
            size="xs"
            variant={showSolo ? "solid" : "outline"}
            colorScheme={showSolo ? "blue" : "gray"}
            onClick={onToggleShowSolo}
            opacity={showSolo ? 1 : 0.6}
          >
            Mine
          </Button>
          {!showSolo && (
            <Box
              position="absolute"
              top="50%"
              left="0"
              right="0"
              height="1px"
              bg="gray.500"
              transform="translateY(-50%) rotate(-15deg)"
              pointerEvents="none"
              opacity={0.5}
            />
          )}
        </Box>
        <Box position="relative">
          <Button
            size="xs"
            variant={showCollab ? "solid" : "outline"}
            colorScheme={showCollab ? "purple" : "gray"}
            onClick={onToggleShowCollab}
            opacity={showCollab ? 1 : 0.6}
          >
            Collab
          </Button>
          {!showCollab && (
            <Box
              position="absolute"
              top="50%"
              left="0"
              right="0"
              height="1px"
              bg="gray.500"
              transform="translateY(-50%) rotate(-15deg)"
              pointerEvents="none"
              opacity={0.5}
            />
          )}
        </Box>

        {/* Separator between individual filters and "All" */}
        <Box h="16px" w="1px" bg="gray.300" _dark={{ bg: "gray.600" }} mx={1} />

        {/* All button - enables both filters */}
        <Button
          size="xs"
          variant="outline"
          colorScheme="gray"
          onClick={onShowAll}
          disabled={isAllDisabled}
          opacity={isAllDisabled ? 0.4 : 1}
          cursor={isAllDisabled ? "not-allowed" : "pointer"}
        >
          All
        </Button>
      </HStack>

      {/* Divider */}
      <Box h="20px" w="1px" bg="gray.300" _dark={{ bg: "gray.600" }} />

      {/* Create button */}
      {canCreate && (
        <Button size="xs" colorScheme="green" onClick={onCreateNew} gap={1}>
          <IconPlus size={14} />
          New Doc
        </Button>
      )}
    </HStack>
  );
}

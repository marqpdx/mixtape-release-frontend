// src/components/writing/DraftFilterToolbar.tsx
/**
 * Compact toolbar for filtering drafts with show toggles
 * Shows: [Show: Solo] [Show: Collab] [All] | [+ New Doc]
 */

"use client";

import { HStack, Button, Text, Box } from "@chakra-ui/react";
import { IconPlus } from "@tabler/icons-react";

interface DraftFilterToolbarProps {
  showSolo: boolean;
  showCollab: boolean;
  onToggleShowSolo: () => void;
  onToggleShowCollab: () => void;
  onShowAll: () => void;
  onCreateNew: () => void;
  canCreate?: boolean;
  showGroupByTags?: boolean;
  onToggleGroupByTags?: () => void;
  showSoloCollab?: boolean;
  showAllButton?: boolean;
  groupByTagsWidth?: string;
}

export function DraftFilterToolbar({
  showSolo,
  showCollab,
  onToggleShowSolo,
  onToggleShowCollab,
  // onShowAll,
  onCreateNew,
  canCreate = true,
  showGroupByTags = false,
  onToggleGroupByTags,
  showSoloCollab = true,
  // showAllButton = true,
  groupByTagsWidth = "140px",
}: DraftFilterToolbarProps) {
  return (
    <HStack gap={2} justify="flex-end" w="full" align="center">
      {showSoloCollab && (
        <HStack gap={2} align="center">
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
              Solo
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
        </HStack>
      )}

      <Box w="12px" />

      {onToggleGroupByTags && (
        <Button
          size="xs"
          variant="outline"
          colorScheme="gray"
          onClick={onToggleGroupByTags}
          minW={groupByTagsWidth}
        >
          {showGroupByTags ? "List view" : "Group by Tags"}
        </Button>
      )}

      <Box w="12px" />

      {canCreate && (
        <Button size="xs" colorScheme="green" onClick={onCreateNew} gap={1}>
          <IconPlus size={14} />
          New Doc
        </Button>
      )}
    </HStack>
  );
}

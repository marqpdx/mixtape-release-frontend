// components/writing/draft-room-v2/DraftQueue.tsx

"use client";

import { Box, Button, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { IconPlus } from "@tabler/icons-react";
import { DraftQueueItem } from "./DraftQueueItem";
import type { WritingWorkingCopy } from "@mixtape/core/types/writingTypes";

interface DraftQueueProps {
  drafts: WritingWorkingCopy[];
  isLoading: boolean;
  selectedPieceId: string | null;
  onSelect: (id: string) => void;
  onNewDraft: () => void;
}

export function DraftQueue({
  drafts,
  isLoading,
  selectedPieceId,
  onSelect,
  onNewDraft,
}: DraftQueueProps) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("gray.50", "gray.900");

  return (
    <Box
      h="100%"
      borderRight="1px solid"
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box
        px={3}
        py={2}
        borderBottom="1px solid"
        borderColor={borderColor}
        bg={headerBg}
        flexShrink={0}
      >
        <Button
          size="sm"
          variant="ghost"
          width="100%"
          onClick={onNewDraft}
        >
          <IconPlus size={14} />
          New draft
        </Button>
      </Box>

      {/* Draft list */}
      <Box flex="1" overflowY="auto">
        {isLoading ? (
          <Box p={3}>
            <Text fontSize="sm" color="gray.500">
              Loading...
            </Text>
          </Box>
        ) : drafts.length === 0 ? (
          <VStack p={4} gap={2}>
            <Text fontSize="sm" color="gray.500" textAlign="center">
              No drafts yet
            </Text>
            <Text fontSize="xs" color="gray.400" textAlign="center">
              Click &ldquo;New draft&rdquo; to start writing
            </Text>
          </VStack>
        ) : (
          <VStack gap={0} align="stretch">
            {drafts.map((draft) => (
              <DraftQueueItem
                key={draft.piece.id}
                id={draft.piece.id}
                title={draft.piece.title || draft.title}
                lastEdited={draft.last_saved_at || draft.piece.updated_at}
                writingKind={draft.piece.writing_kind}
                isSelected={selectedPieceId === draft.piece.id}
                isEmpty={!draft.title && !draft.piece.title}
                onClick={() => onSelect(draft.piece.id)}
              />
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
}

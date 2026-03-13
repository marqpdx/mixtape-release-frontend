// components/writing/draft-room-v2/DraftQueue.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, IconButton, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { IconPlus, IconSparkles } from "@tabler/icons-react";
import { DraftQueueItem } from "./DraftQueueItem";
import type { WritingWorkingCopy } from "@mixtape/core/types/writingTypes";

interface DraftQueueProps {
  drafts: WritingWorkingCopy[];
  isLoading: boolean;
  selectedPieceId: string | null;
  onSelect: (id: string) => void;
  onNewDraft: () => void;
  /** ID of a piece that just appeared (for fade-in animation) */
  freshPieceId?: string | null;
  /** Draft IDs that have active stream sessions */
  sessionDraftIds?: Set<string>;
  /** Toggle to collapse the queue and show only the sparkles strip */
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function DraftQueue({
  drafts,
  isLoading,
  selectedPieceId,
  onSelect,
  onNewDraft,
  freshPieceId,
  sessionDraftIds,
  isCollapsed,
  onToggleCollapse,
}: DraftQueueProps) {
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const headerBg = useColorModeValue("gray.50", "gray.900");
  const sparklesBg = useColorModeValue("green.50", "green.900");
  const sparklesBorder = useColorModeValue("green.200", "green.700");

  // Collapsed: show only the sparkles strip
  if (isCollapsed) {
    return (
      <Box
        w="48px"
        h="100%"
        borderRight="1px solid"
        borderColor={borderColor}
        display="flex"
        flexDirection="column"
        alignItems="center"
        pt={3}
      >
        <IconButton
          size="sm"
          variant="ghost"
          bg={sparklesBg}
          border="1px solid"
          borderColor={sparklesBorder}
          borderRadius="full"
          shadow="sm"
          onClick={onToggleCollapse}
          title="Show drafts"
          _hover={{ shadow: "md" }}
        >
          <IconSparkles size={16} color="green" />
        </IconButton>
      </Box>
    );
  }

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
        display="flex"
        alignItems="center"
        gap={1}
      >
        <Button
          size="sm"
          variant="ghost"
          flex="1"
          onClick={onNewDraft}
        >
          <IconPlus size={14} />
          New draft
        </Button>
        <IconButton
          size="xs"
          variant="ghost"
          onClick={onToggleCollapse}
          title="Hide drafts"
        >
          <IconSparkles size={14} />
        </IconButton>
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
              <FadeInWrapper
                key={draft.piece.id}
                animate={draft.piece.id === freshPieceId}
              >
                <DraftQueueItem
                  id={draft.piece.id}
                  title={draft.piece.title || draft.title}
                  lastEdited={draft.last_saved_at || draft.piece.updated_at}
                  writingKind={draft.piece.writing_kind}
                  isSelected={selectedPieceId === draft.piece.id}
                  isEmpty={!draft.title && !draft.piece.title}
                  hasActiveSession={sessionDraftIds?.has(draft.piece.id)}
                  onClick={() => onSelect(draft.piece.id)}
                />
              </FadeInWrapper>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  );
}

/** Fade-in wrapper for newly inserted drafts */
function FadeInWrapper({
  animate,
  children,
}: {
  animate: boolean;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(!animate);
  const mounted = useRef(false);

  useEffect(() => {
    if (animate && !mounted.current) {
      mounted.current = true;
      // Trigger fade-in on next frame
      requestAnimationFrame(() => setVisible(true));
    }
  }, [animate]);

  if (!animate) return <>{children}</>;

  return (
    <Box
      opacity={visible ? 1 : 0}
      transition="opacity 0.4s ease-in"
    >
      {children}
    </Box>
  );
}

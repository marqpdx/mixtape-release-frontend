// components/writing/draft-room-v2/DraftQueueItem.tsx

"use client";

import { Box, HStack, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { formatDistanceToNow } from "date-fns";

interface DraftQueueItemProps {
  id: string;
  title?: string;
  lastEdited: string;
  writingKind?: string;
  isSelected: boolean;
  isEmpty?: boolean;
  hasActiveSession?: boolean;
  onClick: () => void;
}

export function DraftQueueItem({
  title,
  lastEdited,
  writingKind,
  isSelected,
  isEmpty,
  hasActiveSession,
  onClick,
}: DraftQueueItemProps) {
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const hoverBg = useColorModeValue("gray.100", "gray.800");
  const borderColor = useColorModeValue("blue.400", "blue.500");
  const kindColor = useColorModeValue("gray.500", "gray.400");
  const timeColor = useColorModeValue("gray.400", "gray.500");

  const displayTitle = title || "Untitled";
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(lastEdited), { addSuffix: true });
    } catch {
      return "";
    }
  })();

  return (
    <Box
      px={3}
      py={2}
      cursor="pointer"
      bg={isSelected ? selectedBg : "transparent"}
      borderLeft="3px solid"
      borderLeftColor={isSelected ? borderColor : "transparent"}
      _hover={{ bg: isSelected ? selectedBg : hoverBg }}
      transition="background 0.15s"
      onClick={onClick}
    >
      <HStack gap={1}>
        {hasActiveSession && (
          <Box
            w="6px"
            h="6px"
            borderRadius="full"
            bg="orange.400"
            flexShrink={0}
            title="Active stream session"
          />
        )}
        <Text
          fontSize="sm"
          fontWeight={isSelected ? "semibold" : "normal"}
          lineClamp={1}
          opacity={isEmpty && !title ? 0.6 : 1}
        >
          {displayTitle}
        </Text>
      </HStack>
      <HStack gap={2} mt={0.5}>
        {writingKind && writingKind !== "post" && (
          <Text fontSize="xs" color={kindColor}>
            {writingKind}
          </Text>
        )}
        {timeAgo && (
          <Text fontSize="xs" color={timeColor}>
            {timeAgo}
          </Text>
        )}
      </HStack>
    </Box>
  );
}

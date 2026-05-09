"use client";

import { Badge, Box, HStack, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useResolveCapture } from "@mixtape/api/hooks/console/useConsole";
import type { StreamEntry as StreamEntryData } from "@mixtape/api/clients/worktable/worktableApi";

const KIND_LABELS: Record<string, string> = {
  fix: "We Need To",
  need_more: "We Need More",
  remind: "Remind",
  note: "Note",
};

const KIND_COLORS: Record<string, string> = {
  fix: "green",
  need_more: "blue",
  remind: "orange",
  note: "gray",
};

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function StreamEntry({ entry }: { entry: StreamEntryData }) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const resolveCapture = useResolveCapture();

  if (entry.entry_type === "capture") {
    const isResolved = entry.status === "resolved";
    return (
      <Box
        bg={cardBg}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        px={4}
        py={3}
        opacity={isResolved ? 0.5 : 1}
      >
        <HStack justify="space-between" mb={1}>
          <HStack gap={2}>
            <Badge
              colorPalette={KIND_COLORS[entry.kind ?? "note"] ?? "gray"}
              variant="subtle"
              fontSize="xs"
            >
              {KIND_LABELS[entry.kind ?? "note"] ?? entry.kind}
            </Badge>
            {entry.visibility === "shared" && (
              <Badge colorPalette="blue" variant="outline" fontSize="xs">group</Badge>
            )}
            {entry.status === "resolved" && (
              <Badge colorPalette="green" variant="outline" fontSize="xs">resolved</Badge>
            )}
          </HStack>
          <HStack gap={3} align="center">
            <Text fontSize="xs" color={mutedColor}>{formatTime(entry.created_at)}</Text>
            {!isResolved && (
              <Box
                as="button"
                fontSize="lg"
                color="green.500"
                _hover={{ color: "green.600" }}
                title="Mark resolved"
                onClick={() => resolveCapture.mutate(entry.id)}
              >
                ✓
              </Box>
            )}
          </HStack>
        </HStack>
        <Text fontSize="sm" lineHeight="tall" color={isResolved ? mutedColor : undefined}>
          {entry.body}
        </Text>
      </Box>
    );
  }

  // prose / ledger / agentic_return — W2/W4 placeholders
  return null;
}

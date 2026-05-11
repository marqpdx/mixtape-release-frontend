"use client";

import { useState } from "react";
import { Badge, Box, HStack, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useResolveCapture } from "@mixtape/api/hooks/console/useConsole";
import type { StreamEntry as StreamEntryData } from "@mixtape/api/clients/worktable/worktableApi";

const KIND_LABELS: Record<string, string> = {
  fix: "We Need To",
  need_more: "We Need",
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

function ActionButton({
  label,
  title,
  color,
  hoverColor,
  onClick,
}: {
  label: string;
  title: string;
  color: string;
  hoverColor: string;
  onClick: () => void;
}) {
  return (
    <Box
      as="button"
      fontSize="xs"
      color={color}
      _hover={{ color: hoverColor }}
      title={title}
      onClick={onClick}
      px={1}
    >
      {label}
    </Box>
  );
}

function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  return (
    <HStack gap={1}>
      <Text fontSize="xs" color={mutedColor}>delete?</Text>
      <Box as="button" fontSize="xs" color="red.500" _hover={{ color: "red.600" }} onClick={onConfirm} px={0.5}>yes</Box>
      <Box as="button" fontSize="xs" color={mutedColor} _hover={{ opacity: 0.7 }} onClick={onCancel} px={0.5}>no</Box>
    </HStack>
  );
}

function EntryActions({
  onResolve,
  onArchive,
  onDelete,
}: {
  onResolve?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const mutedColor = useColorModeValue("gray.300", "gray.600");
  const mutedHover = useColorModeValue("gray.500", "gray.400");

  if (deleteConfirm) {
    return <DeleteConfirm onConfirm={() => { onDelete?.(); setDeleteConfirm(false); }} onCancel={() => setDeleteConfirm(false)} />;
  }

  return (
    <HStack gap={0}>
      {onResolve && (
        <ActionButton label="✓" title="Mark resolved" color="green.400" hoverColor="green.600" onClick={onResolve} />
      )}
      {onArchive && (
        <ActionButton label="⊟" title="Archive" color={mutedColor} hoverColor={mutedHover} onClick={onArchive} />
      )}
      {onDelete && (
        <ActionButton label="⊗" title="Delete" color={mutedColor} hoverColor="red.400" onClick={() => setDeleteConfirm(true)} />
      )}
    </HStack>
  );
}

export function StreamEntry({
  entry,
  onArchive,
  onDelete,
}: {
  entry: StreamEntryData;
  onArchive?: () => void;
  onDelete?: () => void;
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const proseColor = useColorModeValue("gray.800", "gray.200");
  const resolveCapture = useResolveCapture();

  if (entry.entry_type === "capture") {
    const isResolved = entry.status === "resolved";
    const onResolve = !isResolved ? () => resolveCapture.mutate(entry.id) : undefined;
    return (
      <Box
        role="group"
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
          <HStack gap={2} align="center">
            <Text fontSize="xs" color={mutedColor}>{formatTime(entry.created_at)}</Text>
            <EntryActions onResolve={onResolve} onArchive={onArchive} onDelete={onDelete} />
          </HStack>
        </HStack>
        <Text fontSize="sm" lineHeight="tall" color={isResolved ? mutedColor : undefined}>
          {entry.body}
        </Text>
      </Box>
    );
  }

  if (entry.entry_type === "prose") {
    return (
      <Box role="group" borderLeft="3px solid" borderColor={borderColor} pl={4} py={2} position="relative">
        <Text fontSize="sm" lineHeight="tall" color={proseColor} whiteSpace="pre-wrap">
          {entry.body}
        </Text>
        <HStack justify="space-between" mt={1}>
          <Text fontSize="xs" color={mutedColor}>{formatTime(entry.created_at)}</Text>
          <EntryActions onArchive={onArchive} onDelete={onDelete} />
        </HStack>
      </Box>
    );
  }

  if (entry.entry_type === "ledger") {
    const eventType = (entry.metadata as Record<string, string>)?.ledger_event_type ?? "";
    return (
      <Box role="group">
        <HStack gap={2} px={2} py={1} opacity={0.6}>
          <Text fontSize="xs">⟐</Text>
          <Text fontSize="xs" color={mutedColor} fontStyle="italic">
            {entry.body || eventType.replace(/_/g, " ")}
          </Text>
          <Text fontSize="xs" color={mutedColor}>· {formatTime(entry.created_at)}</Text>
          {(onArchive || onDelete) && (
            <Box ml="auto">
              <EntryActions onArchive={onArchive} onDelete={onDelete} />
            </Box>
          )}
        </HStack>
      </Box>
    );
  }

  return null;
}

"use client";

import { useState } from "react";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { StreamEntry } from "./StreamEntry";
import type { StreamEntry as StreamEntryData } from "@mixtape/api/clients/worktable/worktableApi";

const BUNDLE_WINDOW_MS = 90_000;

export interface Bundle {
  entries: StreamEntryData[];
  key: string;
}

export function groupIntoBundles(entries: StreamEntryData[]): Bundle[] {
  const bundles: Bundle[] = [];
  let current: StreamEntryData[] = [];

  for (const entry of entries) {
    if (current.length === 0) {
      current.push(entry);
      continue;
    }
    const prev = current[current.length - 1];
    const timeDiff =
      new Date(entry.created_at).getTime() - new Date(prev.created_at).getTime();
    const sameType = entry.entry_type === prev.entry_type;
    const sameKind = entry.kind === prev.kind;

    if (sameType && sameKind && timeDiff <= BUNDLE_WINDOW_MS) {
      current.push(entry);
    } else {
      bundles.push({ entries: [...current], key: current[0].id });
      current = [entry];
    }
  }
  if (current.length > 0) {
    bundles.push({ entries: [...current], key: current[0].id });
  }
  return bundles;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

const KIND_LABELS: Record<string, string> = {
  fix: "fix",
  need_more: "need more",
  remind: "reminder",
  note: "note",
};

export function StreamBundle({
  bundle,
  onArchive,
  onDelete,
}: {
  bundle: Bundle;
  onArchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { entries } = bundle;
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const collapseBg = useColorModeValue("gray.50", "gray.850");
  const [expanded, setExpanded] = useState(entries.length <= 2);

  if (entries.length === 1) {
    return (
      <StreamEntry
        entry={entries[0]}
        onArchive={onArchive ? () => onArchive(entries[0].id) : undefined}
        onDelete={onDelete ? () => onDelete(entries[0].id) : undefined}
      />
    );
  }

  const newest = entries[entries.length - 1];
  const kind = entries[0].kind;
  const kindLabel = kind ? KIND_LABELS[kind] ?? kind : "entry";
  const header = `${entries.length} ${kindLabel} — ${formatTime(newest.created_at)}`;

  if (!expanded) {
    return (
      <Box
        as="button"
        w="full"
        textAlign="left"
        bg={collapseBg}
        borderRadius="lg"
        px={4}
        py={2}
        onClick={() => setExpanded(true)}
        _hover={{ opacity: 0.8 }}
      >
        <HStack justify="space-between">
          <Text fontSize="sm" color={mutedColor} fontWeight="medium">{header}</Text>
          <Text fontSize="xs" color={mutedColor}>expand ↓</Text>
        </HStack>
      </Box>
    );
  }

  return (
    <VStack gap={2} align="stretch">
      {entries.length >= 3 && (
        <HStack justify="space-between">
          <Text fontSize="xs" color={mutedColor} fontWeight="medium">{header}</Text>
          <Box
            as="button"
            fontSize="xs"
            color={mutedColor}
            onClick={() => setExpanded(false)}
            _hover={{ opacity: 0.7 }}
          >
            collapse ↑
          </Box>
        </HStack>
      )}
      {entries.map((e) => (
        <StreamEntry
          key={e.id}
          entry={e}
          onArchive={onArchive ? () => onArchive(e.id) : undefined}
          onDelete={onDelete ? () => onDelete(e.id) : undefined}
        />
      ))}
    </VStack>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge, Box, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useHubCaptures, useStewardship } from "@mixtape/api/hooks/console/useConsole";
import {
  fetchApertureLog,
  type ApertureLogEntry,
  type ApertureLogEntryKind,
} from "@mixtape/api/clients/initiatives/initiativesApi";
import type { ActionMode } from "./ActionPanel";

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function EntryBadge({ kind }: { kind: ApertureLogEntryKind }) {
  const map: Record<ApertureLogEntryKind, { label: string; color: string }> = {
    prose:      { label: "",        color: "gray"   },
    handoff:    { label: "handoff", color: "blue"   },
    emph:       { label: "emph",    color: "purple" },
    ledger:     { label: "ledger",  color: "gray"   },
    seed_spawn: { label: "seed",    color: "green"  },
  };
  const { label, color } = map[kind] ?? { label: kind, color: "gray" };
  if (!label) return null;
  return <Badge colorPalette={color} size="xs" variant="subtle">{label}</Badge>;
}

function LogEntry({ entry }: { entry: ApertureLogEntry }) {
  const systemBg = useColorModeValue("gray.50", "gray.800");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const isSystem = entry.is_system_generated;

  return (
    <Box
      py={2}
      px={isSystem ? 3 : 0}
      bg={isSystem ? systemBg : "transparent"}
      borderRadius={isSystem ? "md" : undefined}
      borderLeft={isSystem ? "2px solid" : undefined}
      borderColor={isSystem ? "border" : undefined}
    >
      <HStack gap={2} align="flex-start">
        <VStack align="stretch" gap={0.5} flex="1">
          {entry.kind === "emph" && entry.emph_note ? (
            <Text fontSize="sm" fontStyle="italic" color="purple.600">
              ❝ {entry.emph_note}
            </Text>
          ) : (
            <Text fontSize="sm" whiteSpace="pre-wrap">{entry.body}</Text>
          )}
          <HStack gap={2}>
            <EntryBadge kind={entry.kind} />
            <Text fontSize="xs" color={mutedColor}>{formatRelative(entry.created_at)}</Text>
            {entry.authored_by && !isSystem && (
              <Text fontSize="xs" color={mutedColor}>· {entry.authored_by}</Text>
            )}
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Status bar — open counts for initiative surface
// ---------------------------------------------------------------------------

function StatusBar({ onAction }: { onAction: (mode: ActionMode) => void }) {
  const { data: needData } = useHubCaptures("need_more", undefined);
  const { data: fixData } = useHubCaptures("fix", undefined);
  const { data: stewardship } = useStewardship();

  const borderColor = useColorModeValue("gray.100", "gray.700");
  const mutedColor = useColorModeValue("gray.400", "gray.500");

  const needCount = needData?.captures.length ?? 0;
  const fixCount = fixData?.captures.length ?? 0;
  const remindCount = stewardship?.overdue_reminders.length ?? 0;

  const items: { label: string; count: number; mode: ActionMode; color: string }[] = (
    [
      { label: "We Need More's", count: needCount, mode: "needs" as ActionMode, color: "blue.500" },
      { label: "Let's Fix's", count: fixCount, mode: "fixes" as ActionMode, color: "red.500" },
      { label: "Reminders", count: remindCount, mode: "reminders" as ActionMode, color: "orange.500" },
    ] as { label: string; count: number; mode: ActionMode; color: string }[]
  ).filter((i) => i.count > 0);

  if (items.length === 0) return null;

  return (
    <HStack gap={4} pb={3} mb={3} borderBottom="1px solid" borderColor={borderColor} flexWrap="wrap">
      {items.map((item) => (
        <Box key={item.mode} as="button" onClick={() => onAction(item.mode)} _hover={{ opacity: 0.7 }}>
          <Text fontSize="xs" color={mutedColor} as="span">{item.label} </Text>
          <Text fontSize="xs" fontWeight="700" color={item.color} as="span">{item.count}</Text>
        </Box>
      ))}
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// ApertureLogStream
// ---------------------------------------------------------------------------

export function ApertureLogStream({
  initiativeId,
  appendRef,
  onAction,
}: {
  initiativeId: string;
  appendRef?: React.MutableRefObject<((entry: ApertureLogEntry) => void) | null>;
  onAction?: (mode: ActionMode) => void;
}) {
  const [entries, setEntries] = useState<ApertureLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const load = useCallback(async (reset = false) => {
    if (reset) setIsLoading(true);
    try {
      const log = await fetchApertureLog(initiativeId);
      setEntries(log.entries);
    } finally {
      if (reset) setIsLoading(false);
    }
  }, [initiativeId]);

  const appendEntry = useCallback((entry: ApertureLogEntry) => {
    setEntries((prev) => [...prev, entry]);
  }, []);

  useEffect(() => {
    if (appendRef) appendRef.current = appendEntry;
  }, [appendEntry, appendRef]);

  useEffect(() => {
    void load(true);
    pollRef.current = setInterval(() => void load(false), 10_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [load]);

  return (
    <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={4} minH="200px">
      {onAction && <StatusBar onAction={onAction} />}

      {isLoading ? (
        <Box textAlign="center" py={8}>
          <Spinner size="md" color="blue.500" />
        </Box>
      ) : entries.length === 0 ? (
        <Box textAlign="center" py={12}>
          <Text fontSize="sm" color={mutedColor}>No entries yet. Write something to begin.</Text>
        </Box>
      ) : (
        <VStack align="stretch" gap={0} divideY="1px">
          {[...entries].reverse().map((entry) => (
            <LogEntry key={entry.id} entry={entry} />
          ))}
        </VStack>
      )}
    </Box>
  );
}

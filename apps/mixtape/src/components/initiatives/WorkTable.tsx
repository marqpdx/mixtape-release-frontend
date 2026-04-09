// apps/mixtape/src/components/initiatives/WorkTable.tsx
// The Aperture entry surface — renders the Personal Initiative's ApertureLog.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Textarea,
  VStack,
  HStack,
  Spinner,
  Badge,
} from "@chakra-ui/react";
import { IconSend, IconBookmark } from "@tabler/icons-react";
import {
  fetchApertureOrientation,
  fetchApertureLog,
  fetchApertureHandoffs,
  createApertureLogEntry,
  type ApertureContext,
  type ApertureLog,
  type ApertureLogEntry,
  type ApertureLogEntryKind,
} from "@mixtape/api/clients/initiatives/initiativesApi";
import { useColorModeValue } from "@components/ui/color-mode";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// function parseEntryKind(input: string): ApertureLogEntryKind {
//   if (input.startsWith("/handoff ")) return "handoff";
//   if (input.startsWith("/emph ")) return "emph";
//   return "prose";
// }

function parseEntryPayload(input: string): { kind: ApertureLogEntryKind; body: string; emph_note: string } {
  const trimmed = input.trim();
  if (trimmed.startsWith("/handoff ")) {
    return { kind: "handoff", body: trimmed.slice("/handoff ".length).trim(), emph_note: "" };
  }
  if (trimmed.startsWith("/emph ")) {
    const rest = trimmed.slice("/emph ".length).trim();
    // /emph "quoted note" — strip outer quotes if present
    const note = rest.startsWith('"') && rest.endsWith('"') ? rest.slice(1, -1) : rest;
    return { kind: "emph", body: "", emph_note: note };
  }
  return { kind: "prose", body: trimmed, emph_note: "" };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EntryBadge({ kind }: { kind: ApertureLogEntryKind }) {
  const map: Record<ApertureLogEntryKind, { label: string; color: string }> = {
    prose:      { label: "",         color: "gray" },
    handoff:    { label: "handoff",  color: "blue" },
    emph:       { label: "emph",     color: "purple" },
    ledger:     { label: "ledger",   color: "gray" },
    seed_spawn: { label: "seed",     color: "green" },
  };
  const { label, color } = map[kind] ?? { label: kind, color: "gray" };
  if (!label) return null;
  return <Badge colorPalette={color} size="xs" variant="subtle">{label}</Badge>;
}

function LogEntry({ entry }: { entry: ApertureLogEntry }) {
  const systemBg = useColorModeValue("gray.50", "gray.800");
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
            <Text fontSize="xs" color="fg.muted">{formatRelative(entry.created_at)}</Text>
            {entry.authored_by && !isSystem && (
              <Text fontSize="xs" color="fg.muted">· {entry.authored_by}</Text>
            )}
          </HStack>
        </VStack>
      </HStack>
    </Box>
  );
}

function HandoffSidebar({ initiativeId }: { initiativeId: string }) {
  const [handoffs, setHandoffs] = useState<ApertureLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (!initiativeId) return;
    setLoading(true);
    fetchApertureHandoffs(initiativeId)
      .then(setHandoffs)
      .finally(() => setLoading(false));
  }, [initiativeId]);

  const latest = handoffs[handoffs.length - 1];

  return (
    <Box
      w="260px"
      flexShrink={0}
      borderLeft="1px solid"
      borderColor={borderColor}
      pl={4}
    >
      <HStack gap={1} mb={3}>
        <IconBookmark size={14} />
        <Text fontSize="xs" fontWeight="semibold" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
          Last Handoff
        </Text>
      </HStack>
      {loading ? (
        <Spinner size="xs" />
      ) : !latest ? (
        <Text fontSize="xs" color="fg.muted">No handoff notes yet.</Text>
      ) : (
        <VStack align="stretch" gap={1}>
          <Text fontSize="sm" whiteSpace="pre-wrap">{latest.body}</Text>
          <Text fontSize="xs" color="fg.muted">{formatRelative(latest.created_at)}</Text>
          {handoffs.length > 1 && (
            <Text fontSize="xs" color="fg.muted">{handoffs.length - 1} earlier</Text>
          )}
        </VStack>
      )}
    </Box>
  );
}

function OrientationView({
  contexts,
  onSelect,
}: {
  contexts: ApertureContext[];
  onSelect: (ctx: ApertureContext) => void;
}) {
  const hoverBg = useColorModeValue("gray.50", "gray.800");

  if (contexts.length === 0) {
    return <Text fontSize="sm" color="fg.muted">No recent contexts.</Text>;
  }

  return (
    <VStack align="stretch" gap={0}>
      {contexts.map((ctx) => (
        <Box
          key={ctx.id}
          px={3}
          py={2}
          cursor="pointer"
          borderRadius="md"
          _hover={{ bg: hoverBg }}
          onClick={() => onSelect(ctx)}
        >
          <HStack gap={2} justify="space-between">
            <Text fontSize="sm" fontWeight={ctx.is_personal ? "semibold" : "normal"}>
              {ctx.title}
              {ctx.is_personal && (
                <Text as="span" fontSize="xs" color="fg.muted" ml={1}>(personal)</Text>
              )}
            </Text>
            <Text fontSize="xs" color="fg.muted">{formatRelative(ctx.updated_at)}</Text>
          </HStack>
          {ctx.last_handoff_body && (
            <Text fontSize="xs" color="fg.muted" mt={0.5} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
              ↳ {ctx.last_handoff_body}
            </Text>
          )}
        </Box>
      ))}
    </VStack>
  );
}

// ---------------------------------------------------------------------------
// Main WorkTable
// ---------------------------------------------------------------------------

export default function WorkTable() {
  const [orientation, setOrientation] = useState<ApertureContext[]>([]);
  const [orientationLoading, setOrientationLoading] = useState(true);

  const [activeInitiative, setActiveInitiative] = useState<ApertureContext | null>(null);
  const [log, setLog] = useState<ApertureLog | null>(null);
  const [logLoading, setLogLoading] = useState(false);

  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const commandHintColor = useColorModeValue("blue.600", "blue.300");

  // Load orientation on mount
  useEffect(() => {
    fetchApertureOrientation()
      .then((res) => {
        setOrientation(res.contexts);
        // Auto-open Personal Initiative if present
        const personal = res.contexts.find((c) => c.is_personal);
        if (personal) selectInitiative(personal);
      })
      .finally(() => setOrientationLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectInitiative = useCallback((ctx: ApertureContext) => {
    setActiveInitiative(ctx);
    setLogLoading(true);
    fetchApertureLog(ctx.id)
      .then(setLog)
      .finally(() => setLogLoading(false));
  }, []);

  // Scroll to bottom when entries change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log?.entries.length]);

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeInitiative || submitting) return;

    const { kind, body, emph_note } = parseEntryPayload(trimmed);
    setSubmitting(true);
    try {
      const entry = await createApertureLogEntry(activeInitiative.id, { kind: kind as Exclude<ApertureLogEntryKind, 'ledger' | 'seed_spawn'>, body, emph_note });
      setLog((prev) =>
        prev ? { ...prev, entries: [...prev.entries, entry] } : prev
      );
      setInput("");
    } finally {
      setSubmitting(false);
    }
  }, [input, activeInitiative, submitting]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Detect command prefix for visual hint
  const commandHint = input.startsWith("/handoff ")
    ? "Handoff note"
    : input.startsWith("/emph ")
    ? "Emphasis"
    : null;

  return (
    <Box h="100%" display="flex" flexDirection="column">
      {/* Header */}
      <Box px={4} py={3} borderBottom="1px solid" borderColor={borderColor}>
        <HStack gap={3} align="center">
          <Text fontSize="sm" fontWeight="semibold">
            {activeInitiative ? activeInitiative.title : "WorkTable"}
          </Text>
          {activeInitiative && !activeInitiative.is_personal && (
            <Text
              fontSize="xs"
              color="blue.500"
              cursor="pointer"
              onClick={() => {
                const personal = orientation.find((c) => c.is_personal);
                if (personal) selectInitiative(personal);
              }}
            >
              ← return
            </Text>
          )}
        </HStack>
      </Box>

      {/* Body */}
      <Flex flex="1" minH="0" overflow="hidden">
        {/* Main column */}
        <Box flex="1" display="flex" flexDirection="column" minH="0">
          {/* Log stream or orientation */}
          <Box flex="1" overflowY="auto" px={4} py={3}>
            {!activeInitiative ? (
              orientationLoading ? (
                <Spinner size="sm" />
              ) : (
                <OrientationView contexts={orientation} onSelect={selectInitiative} />
              )
            ) : logLoading ? (
              <Spinner size="sm" />
            ) : !log || log.entries.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">
                No entries yet. Write something to begin.
              </Text>
            ) : (
              <VStack align="stretch" gap={0} divideY="1px">
                {log.entries.map((entry) => (
                  <LogEntry key={entry.id} entry={entry} />
                ))}
                <div ref={bottomRef} />
              </VStack>
            )}
          </Box>

          {/* Input */}
          {activeInitiative && (
            <Box px={4} py={3} borderTop="1px solid" borderColor={borderColor}>
              {commandHint && (
                <Text fontSize="xs" color={commandHintColor} mb={1}>{commandHint}</Text>
              )}
              <HStack gap={2} align="flex-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a log entry, or /handoff, /emph &quot;note&quot;"
                  rows={2}
                  resize="none"
                  fontSize="sm"
                  flex="1"
                />
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!input.trim() || submitting}
                  style={{
                    opacity: !input.trim() || submitting ? 0.4 : 1,
                    cursor: !input.trim() || submitting ? "not-allowed" : "pointer",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "none",
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {submitting ? <Spinner size="xs" /> : <IconSend size={16} />}
                </button>
              </HStack>
              <Text fontSize="xs" color="fg.muted" mt={1}>
                Enter to submit · Shift+Enter for newline · /handoff · /emph "note"
              </Text>
            </Box>
          )}
        </Box>

        {/* Handoff sidebar */}
        {activeInitiative && (
          <Box px={4} py={3} display={{ base: "none", lg: "block" }}>
            <HandoffSidebar initiativeId={activeInitiative.id} />
          </Box>
        )}
      </Flex>
    </Box>
  );
}

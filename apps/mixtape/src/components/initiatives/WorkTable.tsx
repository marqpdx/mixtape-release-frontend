// apps/mixtape/src/components/initiatives/WorkTable.tsx
// The Aperture entry surface — renders the Personal Initiative's ApertureLog.
// // command: navigation typeahead. /handoff, /emph: log entry commands.

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
import { IconSend, IconBookmark, IconChevronLeft } from "@tabler/icons-react";
import {
  fetchApertureOrientation,
  fetchApertureLog,
  fetchApertureHandoffs,
  fetchApertureInitiativeTypeahead,
  createApertureLogEntry,
  type ApertureContext,
  type ApertureLog,
  type ApertureLogEntry,
  type ApertureLogEntryKind,
  type ApertureTypeaheadItem,
} from "@mixtape/api/clients/initiatives/initiativesApi";
import { useColorModeValue } from "@components/ui/color-mode";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Content type shorthands — local lookup, no server call.
const CONTENT_SHORTHANDS: Record<string, string> = {
  wri: "writing",
  crs: "courses",
  msg: "messages",
  seed: "seeds",
  doc: "documents",
};

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

function parseEntryPayload(input: string): { kind: ApertureLogEntryKind; body: string; emph_note: string } {
  const trimmed = input.trim();
  if (trimmed.startsWith("/handoff ")) {
    return { kind: "handoff", body: trimmed.slice("/handoff ".length).trim(), emph_note: "" };
  }
  if (trimmed.startsWith("/emph ")) {
    const rest = trimmed.slice("/emph ".length).trim();
    const note = rest.startsWith('"') && rest.endsWith('"') ? rest.slice(1, -1) : rest;
    return { kind: "emph", body: "", emph_note: note };
  }
  return { kind: "prose", body: trimmed, emph_note: "" };
}

// Detect mode from raw input value.
// Returns: { mode: "nav", query: string } | { mode: "entry" }
function detectInputMode(value: string): { mode: "nav"; query: string } | { mode: "entry" } {
  if (value.startsWith("//")) {
    return { mode: "nav", query: value.slice(2).trimStart() };
  }
  if (value === "/") {
    // Single slash — ambiguous, not yet nav; treat as entry prefix
    return { mode: "entry" };
  }
  return { mode: "entry" };
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
      w="240px"
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
            <Text fontSize="xs" color="fg.muted" flexShrink={0}>{formatRelative(ctx.updated_at)}</Text>
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
// // Typeahead dropdown
// ---------------------------------------------------------------------------

function TypeaheadDropdown({
  query,
  onSelect,
  onCreateNew,
  borderColor,
}: {
  query: string;
  onSelect: (item: ApertureTypeaheadItem) => void;
  onCreateNew: (title: string) => void;
  borderColor: string;
}) {
  const [items, setItems] = useState<ApertureTypeaheadItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const hoverBg = useColorModeValue("gray.50", "gray.800");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Expanded shorthand label, if query matches
  const shorthandMatch = query ? CONTENT_SHORTHANDS[query.toLowerCase()] : null;

  // Debounced fetch
  useEffect(() => {
    setActiveIdx(0);
    if (!query) {
      // No query → fetch all (orientation-style)
      setLoading(true);
      fetchApertureInitiativeTypeahead("").then((res) => {
        setItems(res.initiatives);
        setLoading(false);
      });
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      fetchApertureInitiativeTypeahead(query).then((res) => {
        setItems(res.initiatives);
        setLoading(false);
      });
    }, 120);
    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation — hoisted to parent via data-typeahead attr, handled below
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!dropdownRef.current) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, items.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = items[activeIdx];
        if (item) onSelect(item);
        else if (query) onCreateNew(query);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, activeIdx, query, onSelect, onCreateNew]);

  return (
    <Box
      ref={dropdownRef}
      position="absolute"
      bottom="calc(100% + 4px)"
      left={0}
      right={0}
      bg={useColorModeValue("white", "gray.900")}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      boxShadow="md"
      zIndex={10}
      maxH="280px"
      overflowY="auto"
    >
      {loading ? (
        <Box px={3} py={2}><Spinner size="xs" /></Box>
      ) : items.length === 0 && !query ? (
        <Box px={3} py={2}>
          <Text fontSize="xs" color="fg.muted">No initiatives yet.</Text>
        </Box>
      ) : (
        <>
          {shorthandMatch && (
            <Box px={3} py={1.5} borderBottom="1px solid" borderColor={borderColor}>
              <Text fontSize="xs" color="blue.500">→ show recent {shorthandMatch}</Text>
            </Box>
          )}
          {items.map((item, idx) => (
            <Box
              key={item.id}
              px={3}
              py={2}
              cursor="pointer"
              bg={idx === activeIdx ? hoverBg : "transparent"}
              _hover={{ bg: hoverBg }}
              onClick={() => onSelect(item)}
            >
              <HStack gap={2} justify="space-between">
                <Text fontSize="sm" fontWeight={item.is_personal ? "semibold" : "normal"}>
                  {item.title}
                </Text>
                <Text fontSize="xs" color="fg.muted" flexShrink={0}>{formatRelative(item.updated_at)}</Text>
              </HStack>
            </Box>
          ))}
          {query && items.length === 0 && (
            <Box
              px={3}
              py={2}
              cursor="pointer"
              _hover={{ bg: hoverBg }}
              onClick={() => onCreateNew(query)}
            >
              <Text fontSize="sm" color="blue.500">+ Create &ldquo;{query}&rdquo;</Text>
            </Box>
          )}
          {query && items.length > 0 && (
            <Box
              px={3}
              py={2}
              cursor="pointer"
              borderTop="1px solid"
              borderColor={borderColor}
              _hover={{ bg: hoverBg }}
              onClick={() => onCreateNew(query)}
            >
              <Text fontSize="sm" color="fg.muted">+ Create new &ldquo;{query}&rdquo;</Text>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main WorkTable
// ---------------------------------------------------------------------------

export default function WorkTable() {
  const [orientation, setOrientation] = useState<ApertureContext[]>([]);
  const [orientationLoading, setOrientationLoading] = useState(true);

  const [activeInitiative, setActiveInitiative] = useState<ApertureContext | null>(null);
  const [personalInitiative, setPersonalInitiative] = useState<ApertureContext | null>(null);
  const [log, setLog] = useState<ApertureLog | null>(null);
  const [logLoading, setLogLoading] = useState(false);

  // Dissolve animation state
  const [dissolving, setDissolving] = useState(false);

  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const commandHintColor = useColorModeValue("blue.600", "blue.300");

  const inputMode = detectInputMode(input);

  // ---------------------------------------------------------------------------
  // Load orientation on mount
  // ---------------------------------------------------------------------------

  useEffect(() => {
    fetchApertureOrientation()
      .then((res) => {
        setOrientation(res.contexts);
        const personal = res.contexts.find((c) => c.is_personal);
        if (personal) {
          setPersonalInitiative(personal);
          dissolveToInitiative(personal);
        }
      })
      .finally(() => setOrientationLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Dissolve navigation
  // ---------------------------------------------------------------------------

  const dissolveToInitiative = useCallback((ctx: ApertureContext) => {
    setDissolving(true);
    setTimeout(() => {
      setActiveInitiative(ctx);
      setLogLoading(true);
      setDissolving(false);
      fetchApertureLog(ctx.id)
        .then(setLog)
        .finally(() => setLogLoading(false));
    }, 150);
  }, []);

  const returnToPersonal = useCallback(() => {
    if (personalInitiative) dissolveToInitiative(personalInitiative);
  }, [personalInitiative, dissolveToInitiative]);

  // ---------------------------------------------------------------------------
  // Scroll to bottom when entries change
  // ---------------------------------------------------------------------------

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log?.entries.length]);

  // ---------------------------------------------------------------------------
  // Entry submission
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeInitiative || submitting) return;
    if (inputMode.mode === "nav") return; // nav mode — Enter is handled by dropdown

    const { kind, body, emph_note } = parseEntryPayload(trimmed);
    setSubmitting(true);
    try {
      const entry = await createApertureLogEntry(activeInitiative.id, {
        kind: kind as Exclude<ApertureLogEntryKind, "ledger" | "seed_spawn">,
        body,
        emph_note,
      });
      setLog((prev) =>
        prev ? { ...prev, entries: [...prev.entries, entry] } : prev
      );
      setInput("");
    } finally {
      setSubmitting(false);
    }
  }, [input, activeInitiative, submitting, inputMode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        if (inputMode.mode === "nav") {
          // TypeaheadDropdown handles Enter via window keydown listener
          e.preventDefault();
          return;
        }
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === "Escape" && inputMode.mode === "nav") {
        e.preventDefault();
        setInput("");
      }
    },
    [handleSubmit, inputMode]
  );

  // ---------------------------------------------------------------------------
  // Typeahead callbacks
  // ---------------------------------------------------------------------------

  const handleTypeaheadSelect = useCallback(
    (item: ApertureTypeaheadItem) => {
      setInput("");
      const asContext: ApertureContext = {
        type: "initiative",
        id: item.id,
        title: item.title,
        status: item.status,
        is_personal: item.is_personal,
        updated_at: item.updated_at,
        last_handoff_body: null,
        last_handoff_at: null,
      };
      dissolveToInitiative(asContext);
    },
    [dissolveToInitiative]
  );

  const handleCreateNew = useCallback((title: string) => {
    // TODO: wire to initiative creation flow — open a create-initiative modal
    // For now, just clear the nav command and show a notice
    setInput("");
    console.info("TODO: create initiative with title:", title);
  }, []);

  // ---------------------------------------------------------------------------
  // Command hint (entry mode)
  // ---------------------------------------------------------------------------

  const commandHint =
    inputMode.mode === "entry"
      ? input.startsWith("/handoff ")
        ? "Handoff note"
        : input.startsWith("/emph ")
        ? "Emphasis"
        : null
      : null;

  const isNavMode = inputMode.mode === "nav";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Box h="100%" display="flex" flexDirection="column">
      {/* Header */}
      <Box px={4} py={3} borderBottom="1px solid" borderColor={borderColor}>
        <HStack gap={3} align="center">
          {activeInitiative && !activeInitiative.is_personal && (
            <Box
              as="button"
              onClick={returnToPersonal}
              color="fg.muted"
              _hover={{ color: "fg" }}
              display="flex"
              alignItems="center"
              gap={1}
              fontSize="xs"
              background="none"
              border="none"
              cursor="pointer"
              p={0}
            >
              <IconChevronLeft size={14} />
              <Text as="span">WorkTable</Text>
            </Box>
          )}
          <Text fontSize="sm" fontWeight="semibold">
            {activeInitiative ? activeInitiative.title : "WorkTable"}
          </Text>
        </HStack>
      </Box>

      {/* Body */}
      <Flex flex="1" minH="0" overflow="hidden">
        {/* Main column */}
        <Box
          flex="1"
          display="flex"
          flexDirection="column"
          minH="0"
          opacity={dissolving ? 0 : 1}
          transition="opacity 0.15s ease"
        >
          {/* Log stream or orientation */}
          <Box flex="1" overflowY="auto" px={4} py={3}>
            {!activeInitiative ? (
              orientationLoading ? (
                <Spinner size="sm" />
              ) : (
                <OrientationView contexts={orientation} onSelect={dissolveToInitiative} />
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

          {/* Input bar */}
          {activeInitiative && (
            <Box
              px={4}
              py={3}
              borderTop="1px solid"
              borderColor={borderColor}
              position="relative"
            >
              {/* // typeahead dropdown — floats above input */}
              {isNavMode && (
                <TypeaheadDropdown
                  query={inputMode.query}
                  onSelect={handleTypeaheadSelect}
                  onCreateNew={handleCreateNew}
                  borderColor={borderColor}
                />
              )}

              {commandHint && (
                <Text fontSize="xs" color={commandHintColor} mb={1}>{commandHint}</Text>
              )}
              {isNavMode && (
                <Text fontSize="xs" color={commandHintColor} mb={1}>
                  navigate → {inputMode.query || "showing all"}
                  <Text as="span" color="fg.muted" ml={2}>↑↓ to move · Enter to open · Esc to cancel</Text>
                </Text>
              )}

              <HStack gap={2} align="flex-end">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a log entry · // to navigate · /handoff · /emph &quot;note&quot;"
                  rows={isNavMode ? 1 : 2}
                  resize="none"
                  fontSize="sm"
                  flex="1"
                  fontFamily={isNavMode ? "mono" : undefined}
                />
                {!isNavMode && (
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
                )}
              </HStack>
              {!isNavMode && (
                <Text fontSize="xs" color="fg.muted" mt={1}>
                  Enter to submit · Shift+Enter for newline · // to navigate · /. to return
                </Text>
              )}
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

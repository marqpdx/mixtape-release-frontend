"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge, Box, Button, HStack, Text, Textarea, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useOrientation } from "@mixtape/api/hooks/console/useConsole";
import type { StreamEntry } from "@mixtape/api/clients/worktable/worktableApi";
import type { ApertureLogEntry, ApertureLogEntryKind } from "@mixtape/api/clients/initiatives/initiativesApi";
import type { WorkTableContext } from "./types";
import { parseNeedMoreItems, parseRemindAt, formatRemindPreview } from "./parseCapture";

interface InitiativeSearchResult {
  id: string;
  title: string;
  is_personal: boolean;
}

const CONTEXT_SWITCH_RE = /^\/\/(.+)/;
const CONTEXT_RETURN_RE = /^\/\.(\s|$)/;
const LOG_ENTRY_RE = /^\/log\s+([\s\S]+)/i;
const HANDOFF_RE = /^\/handoff\s+([\s\S]+)/i;
const EMPH_RE = /^\/emph\s+([\s\S]+)/i;

function parseApertureKind(text: string): { kind: Exclude<ApertureLogEntryKind, "ledger" | "seed_spawn">; body: string; emph_note: string } {
  const handoffMatch = HANDOFF_RE.exec(text);
  if (handoffMatch) return { kind: "handoff", body: handoffMatch[1].trim(), emph_note: "" };
  const emphMatch = EMPH_RE.exec(text);
  if (emphMatch) {
    const note = emphMatch[1].trim();
    return { kind: "emph", body: "", emph_note: note.startsWith('"') && note.endsWith('"') ? note.slice(1, -1) : note };
  }
  return { kind: "prose", body: text, emph_note: "" };
}

type HubCaptureKind = "fix" | "need_more" | "remind" | "note";

function detectKind(text: string): HubCaptureKind {
  const t = text.toLowerCase().trim();
  if (/^(fix |let'?s fix |we need to |needs? to |need to )/.test(t)) return "fix";
  if (/^(we need more |need more |we need |needs? more |order |get more )/.test(t)) return "need_more";
  if (/^(remind me |reminder |remind us |don'?t forget |remember to )/.test(t)) return "remind";
  return "note";
}

export function WorkTableCommandField({
  context,
  onContextSwitch,
  onContextReturn,
  onCapture,
  onApertureCapture,
}: {
  context: WorkTableContext;
  onContextSwitch: (ctx: WorkTableContext) => void;
  onContextReturn: () => void;
  onCapture: (entry: StreamEntry) => void;
  onApertureCapture?: (entry: ApertureLogEntry) => void;
}) {
  const [input, setInput] = useState("");
  const [visibility, setVisibility] = useState<"private" | "shared">("private");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCapture, setLastCapture] = useState<{ kind: string; body: string } | null>(null);
  const [initiativeResults, setInitiativeResults] = useState<InitiativeSearchResult[]>([]);
  const [showInitiativeDropdown, setShowInitiativeDropdown] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { data: orientation } = useOrientation();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const previewBg = useColorModeValue("blue.50", "blue.900");
  const previewColor = useColorModeValue("blue.700", "blue.200");
  const remindHintBg = useColorModeValue("orange.50", "orange.900");
  const remindHintColor = useColorModeValue("orange.700", "orange.200");
  const dropdownBg = useColorModeValue("white", "gray.800");
  const dropdownHoverBg = useColorModeValue("gray.50", "gray.700");
  const dropdownTextColor = useColorModeValue("gray.700", "gray.200");

  const trimmed = input.trim();
  const contextSwitchMatch = CONTEXT_SWITCH_RE.exec(trimmed);
  const isReturn = CONTEXT_RETURN_RE.test(trimmed);
  const logMatch = LOG_ENTRY_RE.exec(trimmed);
  const contextQuery = contextSwitchMatch?.[1]?.trim().toLowerCase() ?? null;

  const contextTarget = contextQuery
    ? (orientation?.groups ?? []).find(
        (g) => g.title.toLowerCase().includes(contextQuery) || g.slug.includes(contextQuery)
      ) ?? null
    : null;

  // Initiative typeahead — fetch when // text is typed and no group match found
  useEffect(() => {
    if (!contextQuery || contextTarget) {
      setInitiativeResults([]);
      setShowInitiativeDropdown(false);
      return;
    }
    let cancelled = false;
    axiosInstance
      .get<{ initiatives: InitiativeSearchResult[] }>(`/api/initiatives/search`, { params: { q: contextQuery } })
      .then((res) => {
        if (!cancelled) {
          setInitiativeResults(res.data.initiatives);
          setShowInitiativeDropdown(res.data.initiatives.length > 0);
        }
      })
      .catch(() => {
        if (!cancelled) { setInitiativeResults([]); setShowInitiativeDropdown(false); }
      });
    return () => { cancelled = true; };
  }, [contextQuery, contextTarget]);

  // Detect kind + parse
  const detectedKind = trimmed ? detectKind(trimmed) : null;
  const isNeedMore = detectedKind === "need_more";
  const isRemind = detectedKind === "remind";

  const needItems = useMemo(
    () => (isNeedMore && trimmed ? parseNeedMoreItems(trimmed) : []),
    [isNeedMore, trimmed]
  );
  const remindAt = isRemind && trimmed ? parseRemindAt(trimmed) : null;

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (!trimmed || submitting) return;
    setError(null);

    if (CONTEXT_RETURN_RE.test(trimmed)) {
      onContextReturn();
      setInput("");
      return;
    }

    if (contextTarget) {
      onContextSwitch({ kind: "group", id: contextTarget.id, slug: contextTarget.slug, title: contextTarget.title });
      setInput("");
      setShowInitiativeDropdown(false);
      return;
    }

    // If exactly one initiative matches, dissolve into it on submit
    if (contextQuery && initiativeResults.length === 1) {
      const init = initiativeResults[0];
      onContextSwitch({ kind: "initiative", id: init.id, title: init.title, sponsor: "personal" });
      setInput("");
      setInitiativeResults([]);
      setShowInitiativeDropdown(false);
      return;
    }

    // Initiative context — all entries go to the Aperture log
    if (context.kind === "initiative") {
      setSubmitting(true);
      try {
        const { kind, body, emph_note } = parseApertureKind(trimmed);
        const res = await axiosInstance.post<ApertureLogEntry>(
          `/api/initiatives/${context.id}/aperture-log/entries`,
          { kind, body, emph_note }
        );
        onApertureCapture?.(res.data);
        setLastCapture({ kind, body: body || emph_note });
        setInput("");
        setTimeout(() => setLastCapture(null), 3000);
      } catch {
        setError("Failed to save entry. Try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // /log prose entry (personal / group contexts)
    if (logMatch) {
      const logBody = logMatch[1].trim();
      if (!logBody) return;
      setSubmitting(true);
      try {
        const res = await axiosInstance.post<{
          id: string; entry_type: string; body: string; created_at: string;
        }>("/api/worktable/prose/", {
          body: logBody,
          ...(context.kind === "group" ? { group_slug: context.slug } : {}),
        });
        const entry: StreamEntry = {
          id: res.data.id,
          entry_type: "prose",
          body: res.data.body,
          created_at: res.data.created_at,
          metadata: {},
        };
        onCapture(entry);
        setLastCapture({ kind: "log", body: logBody });
        setInput("");
        setTimeout(() => setLastCapture(null), 3000);
      } catch {
        setError("Failed to save log entry. Try again.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const kind = detectKind(trimmed);
    const groupSlug = context.kind === "group" ? context.slug : undefined;
    const captureVisibility = groupSlug ? visibility : "private";

    setSubmitting(true);
    try {
      // need_more with multiple items → one capture per item
      if (kind === "need_more" && needItems.length > 1) {
        const entries: StreamEntry[] = [];
        for (const item of needItems) {
          const res = await axiosInstance.post<{
            id: string; kind: string; body: string; status: string; visibility: string; created_at: string;
          }>("/api/console/hub/captures/", {
            kind,
            body: item,
            group_slug: groupSlug,
            visibility: captureVisibility,
          });
          entries.push({
            id: res.data.id,
            entry_type: "capture",
            kind: res.data.kind as HubCaptureKind,
            body: res.data.body,
            status: res.data.status as "open",
            visibility: res.data.visibility as "private" | "shared",
            created_at: res.data.created_at,
            metadata: {},
          });
        }
        entries.forEach((e) => onCapture(e));
        setLastCapture({ kind: "need_more", body: `${needItems.length} items` });
        setInput("");
        setTimeout(() => setLastCapture(null), 3000);
        return;
      }

      // Single capture
      const res = await axiosInstance.post<{
        id: string; kind: string; body: string; status: string; visibility: string; created_at: string;
      }>("/api/console/hub/captures/", {
        kind,
        body: trimmed,
        group_slug: groupSlug,
        visibility: captureVisibility,
        ...(kind === "remind" && remindAt ? { remind_at: remindAt.toISOString() } : {}),
      });

      const entry: StreamEntry = {
        id: res.data.id,
        entry_type: "capture",
        kind: res.data.kind as HubCaptureKind,
        body: res.data.body,
        status: res.data.status as "open",
        visibility: res.data.visibility as "private" | "shared",
        created_at: res.data.created_at,
        metadata: {},
      };
      onCapture(entry);
      setLastCapture({ kind: res.data.kind, body: res.data.body });
      setInput("");
      setTimeout(() => setLastCapture(null), 3000);
    } catch {
      setError("Failed to save. Try again.");
    } finally {
      setSubmitting(false);
    }
  }, [trimmed, submitting, contextTarget, contextQuery, initiativeResults, context, onCapture, onApertureCapture, onContextSwitch, onContextReturn, logMatch, visibility, needItems, remindAt]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    }
  };

  // Button label + state
  let buttonLabel = "Save";
  let buttonColor: string = "blue";
  let buttonDisabled = !trimmed || submitting;

  if (isReturn) { buttonLabel = "Return to Personal"; buttonColor = "gray"; }
  else if (logMatch) { buttonLabel = "Log"; buttonColor = "orange"; }
  else if (contextTarget) { buttonLabel = `Switch to ${contextTarget.title}`; buttonColor = "purple"; }
  else if (contextQuery && initiativeResults.length === 1) { buttonLabel = `Open ${initiativeResults[0].title}`; buttonColor = "teal"; }
  else if (contextQuery && !contextTarget && initiativeResults.length === 0) { buttonDisabled = true; }
  else if (isNeedMore && needItems.length > 1) { buttonLabel = `Save ${needItems.length} items`; }

  // Help text
  const isInitiative = context.kind === "initiative";
  const helpText = contextQuery
    ? contextTarget
      ? `Switch to ${contextTarget.title}`
      : initiativeResults.length > 0
      ? `${initiativeResults.length} initiative${initiativeResults.length > 1 ? "s" : ""} found`
      : `No match for "${contextQuery}"`
    : isReturn ? "Return to personal context"
    : isInitiative ? '/handoff · /emph "note" · prose to log'
    : logMatch ? "Write a prose log entry"
    : isRemind ? "Use 'on Tuesday', 'tomorrow', or 'next week' to set a date"
    : isNeedMore ? "Items split on commas, 'and', or new lines"
    : 'Capture · /log … · // Group or Initiative · /. return';

  const handleInitiativeSelect = (init: InitiativeSearchResult) => {
    onContextSwitch({ kind: "initiative", id: init.id, title: init.title, sponsor: "personal" });
    setInput("");
    setInitiativeResults([]);
    setShowInitiativeDropdown(false);
  };

  return (
    <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={4}>
      <Box position="relative">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isInitiative ? 'Write a log entry — /handoff · /emph "note"' : "Type to capture — or // GroupName to switch context…"}
          minH="80px"
          resize="vertical"
          fontSize="sm"
          mb={showInitiativeDropdown ? 0 : 3}
        />
        {showInitiativeDropdown && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            zIndex={200}
            bg={dropdownBg}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            mt={1}
            mb={3}
            shadow="md"
            overflow="hidden"
          >
            {initiativeResults.map((init) => (
              <Box
                key={init.id}
                px={3}
                py={2}
                fontSize="sm"
                color={dropdownTextColor}
                cursor="pointer"
                _hover={{ bg: dropdownHoverBg }}
                onMouseDown={() => handleInitiativeSelect(init)}
              >
                <HStack gap={2}>
                  <Text as="span" fontSize="xs" color="teal.500" fontWeight="700">initiative</Text>
                  <Text as="span">{init.title}</Text>
                </HStack>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Parsed previews */}
      {isNeedMore && needItems.length > 1 && (
        <Box bg={previewBg} borderRadius="md" px={3} py={2} mb={3}>
          <Text fontSize="xs" fontWeight="700" color={previewColor} mb={1}>
            {needItems.length} items detected:
          </Text>
          <VStack align="start" gap={0.5}>
            {needItems.map((item, i) => (
              <Text key={i} fontSize="xs" color={previewColor}>· {item}</Text>
            ))}
          </VStack>
        </Box>
      )}

      {isRemind && remindAt && (
        <Box bg={remindHintBg} borderRadius="md" px={3} py={2} mb={3}>
          <Text fontSize="xs" color={remindHintColor}>
            🔔 Remind at: <strong>{formatRemindPreview(remindAt)}</strong>
          </Text>
        </Box>
      )}

      {isRemind && !remindAt && trimmed && (
        <Box bg={remindHintBg} borderRadius="md" px={3} py={2} mb={3}>
          <Text fontSize="xs" color={remindHintColor}>
            No date detected — add "on Tuesday", "tomorrow", or "next week"
          </Text>
        </Box>
      )}

      {/* Visibility + help text + submit — single row */}
      <HStack justify="space-between" align="center" mt={2} gap={2}>
        {context.kind === "group" ? (
          <Box
            as="button"
            px={2}
            py={0.5}
            borderRadius="md"
            fontSize="xs"
            fontWeight="600"
            flexShrink={0}
            bg={visibility === "private" ? "gray.100" : "blue.50"}
            color={visibility === "private" ? "gray.600" : "blue.600"}
            _dark={{ bg: visibility === "private" ? "gray.700" : "blue.900", color: visibility === "private" ? "gray.300" : "blue.300" }}
            onClick={() => setVisibility(visibility === "private" ? "shared" : "private")}
            title={visibility === "private" ? "Only you — click to share with group" : "Shared with group — click to make private"}
          >
            {visibility === "private" ? "🔒 Private" : "👥 Shared"}
          </Box>
        ) : (
          <Box />
        )}
        <Text fontSize="xs" color={mutedColor} flex={1} textAlign="center">{helpText}</Text>
        <HStack gap={1.5} flexShrink={0}>
          <Badge variant="subtle" fontSize="10px">⌘↩</Badge>
          <Button
            size="xs"
            colorPalette={buttonColor}
            onClick={() => void handleSubmit()}
            disabled={buttonDisabled}
            loading={submitting}
          >
            {buttonLabel}
          </Button>
        </HStack>
      </HStack>

      {error && <Text fontSize="xs" color="red.500" mt={2}>{error}</Text>}
      {lastCapture && (
        <Text fontSize="xs" color="green.600" mt={2}>
          ✓ Saved: {lastCapture.body.slice(0, 60)}
        </Text>
      )}
    </Box>
  );
}

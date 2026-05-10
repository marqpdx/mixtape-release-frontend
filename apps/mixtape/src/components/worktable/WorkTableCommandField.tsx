"use client";

import { useCallback, useRef, useState } from "react";
import { Badge, Box, Button, HStack, Text, Textarea } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useOrientation } from "@mixtape/api/hooks/console/useConsole";
import type { StreamEntry } from "@mixtape/api/clients/worktable/worktableApi";
import type { WorkTableContext } from "./types";

const WORKSTREAM_RE = /^\/n\s+(.+)/i;
const CONTEXT_SWITCH_RE = /^\/\/(.+)/;
const CONTEXT_RETURN_RE = /^\/\.(\s|$)/;
const LOG_ENTRY_RE = /^\/log\s+([\s\S]+)/i;

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
}: {
  context: WorkTableContext;
  onContextSwitch: (ctx: WorkTableContext) => void;
  onContextReturn: () => void;
  onCapture: (entry: StreamEntry) => void;
}) {
  const [input, setInput] = useState("");
  const [visibility, setVisibility] = useState<"private" | "shared">("private");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCapture, setLastCapture] = useState<{ kind: string; body: string } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const { data: orientation } = useOrientation();

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const workstreamMatch = WORKSTREAM_RE.exec(input.trim());
  const contextSwitchMatch = CONTEXT_SWITCH_RE.exec(input.trim());
  const isReturn = CONTEXT_RETURN_RE.test(input.trim());
  const logMatch = LOG_ENTRY_RE.exec(input.trim());
  const workstreamName = workstreamMatch?.[1]?.trim() ?? null;
  const contextQuery = contextSwitchMatch?.[1]?.trim().toLowerCase() ?? null;

  const contextTarget = contextQuery
    ? (orientation?.groups ?? []).find(
        (g) => g.title.toLowerCase().includes(contextQuery) || g.slug.includes(contextQuery)
      ) ?? null
    : null;

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || submitting) return;

    setError(null);

    // /. — return to personal
    if (CONTEXT_RETURN_RE.test(trimmed)) {
      onContextReturn();
      setInput("");
      return;
    }

    // // context switch
    if (contextTarget) {
      onContextSwitch({ kind: "group", id: contextTarget.id, slug: contextTarget.slug, title: contextTarget.title });
      setInput("");
      return;
    }

    // /log prose entry — WT-D11
    if (logMatch) {
      const logBody = logMatch[1].trim();
      if (!logBody) return;
      if (context.kind !== "initiative") {
        setError("/log entries require an initiative context. Use // InitiativeName to switch.");
        return;
      }
      setSubmitting(true);
      try {
        const res = await axiosInstance.post<{
          id: string; entry_type: string; body: string; created_at: string;
        }>(`/api/initiatives/${context.id}/aperture-log/entries`, {
          kind: "prose",
          body: logBody,
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

    // /n workstream — stub for W1
    if (workstreamName) {
      setError("Workstream creation not yet wired to WorkTable. Use the Console action field below.");
      return;
    }

    // Natural language → HubCapture
    const kind = detectKind(trimmed);
    const groupSlug = context.kind === "group" ? context.slug : undefined;
    const captureVisibility = groupSlug ? visibility : "private";

    setSubmitting(true);
    try {
      const res = await axiosInstance.post<{
        id: string; kind: string; body: string; status: string; visibility: string; created_at: string;
      }>("/api/console/hub/captures/", {
        kind,
        body: trimmed,
        group_slug: groupSlug,
        visibility: captureVisibility,
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
  }, [input, submitting, contextTarget, workstreamName, context, onCapture, onContextSwitch, onContextReturn]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void handleSubmit();
    }
  };

  // Button label and state
  let buttonLabel = "Capture";
  let buttonColor: string = "blue";
  let buttonDisabled = !input.trim() || submitting;

  if (isReturn) { buttonLabel = "Return to Personal"; buttonColor = "gray"; }
  else if (logMatch) { buttonLabel = "Log Entry"; buttonColor = "orange"; }
  else if (contextTarget) { buttonLabel = `Switch to ${contextTarget.title}`; buttonColor = "purple"; }
  else if (contextQuery && !contextTarget) { buttonDisabled = true; }
  else if (workstreamName) { buttonLabel = "New Workstream"; buttonColor = "teal"; }

  const helpText = contextQuery
    ? contextTarget ? `Press to switch to ${contextTarget.title}` : `No group matching "${contextQuery}"`
    : isReturn ? "Return to personal context"
    : logMatch ? "Write a prose log entry into the initiative's ApertureLog"
    : workstreamName ? "Create workstream (use Console action field below)"
    : 'Type to capture. /log ... for prose entries. // GroupName to switch. /. to return.';

  return (
    <Box bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="lg" p={4}>
      <Textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type to capture — or // GroupName to switch context…"
        minH="80px"
        resize="vertical"
        fontSize="sm"
        mb={3}
      />
      {context.kind === "group" && (
        <HStack mb={3} gap={2}>
          <Text fontSize="xs" color={mutedColor} fontWeight="medium">Visibility:</Text>
          <Box
            as="button"
            px={2}
            py={1}
            borderRadius="md"
            fontSize="xs"
            fontWeight="600"
            bg={visibility === "private" ? "gray.100" : "blue.50"}
            color={visibility === "private" ? "gray.600" : "blue.600"}
            _dark={{ bg: visibility === "private" ? "gray.700" : "blue.900", color: visibility === "private" ? "gray.300" : "blue.300" }}
            onClick={() => setVisibility(visibility === "private" ? "shared" : "private")}
            title={visibility === "private" ? "Only you can see this — click to share with group" : "Shared with group — click to make private"}
          >
            {visibility === "private" ? "🔒 Private" : "👥 Shared"}
          </Box>
          {visibility === "shared" && (
            <Text fontSize="xs" color={mutedColor}>Visible to all group members</Text>
          )}
        </HStack>
      )}
      <HStack justify="space-between" align="center">
        <Text fontSize="xs" color={mutedColor}>{helpText}</Text>
        <HStack gap={2}>
          <Badge variant="subtle">⌘↩</Badge>
          <Button
            size="sm"
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
          ✓ Captured as {lastCapture.kind}: {lastCapture.body.slice(0, 60)}
        </Text>
      )}
    </Box>
  );
}

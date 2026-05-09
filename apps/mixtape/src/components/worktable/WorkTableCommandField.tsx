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
const CONTEXT_RETURN_RE = /^\/\.$/;

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

    // /n workstream — stub for W1
    if (workstreamName) {
      setError("Workstream creation not yet wired to WorkTable. Use the Console action field below.");
      return;
    }

    // Natural language → HubCapture
    const kind = detectKind(trimmed);
    const groupSlug = context.kind === "group" ? context.slug : undefined;

    setSubmitting(true);
    try {
      const res = await axiosInstance.post<{
        id: string; kind: string; body: string; status: string; created_at: string;
      }>("/api/console/hub/captures/", {
        kind,
        body: trimmed,
        group_slug: groupSlug,
      });

      const entry: StreamEntry = {
        id: res.data.id,
        entry_type: "capture",
        kind: res.data.kind as HubCaptureKind,
        body: res.data.body,
        status: res.data.status as "open",
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
  else if (contextTarget) { buttonLabel = `Switch to ${contextTarget.title}`; buttonColor = "purple"; }
  else if (contextQuery && !contextTarget) { buttonDisabled = true; }
  else if (workstreamName) { buttonLabel = "New Workstream"; buttonColor = "teal"; }

  const helpText = contextQuery
    ? contextTarget ? `Press to switch to ${contextTarget.title}` : `No group matching "${contextQuery}"`
    : isReturn ? "Return to personal context"
    : workstreamName ? "Create workstream (use Console action field below)"
    : 'Type to capture. ⌘↩ to send. // GroupName to switch context. /. to return.';

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

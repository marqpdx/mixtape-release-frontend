"use client";

import { useEffect, useState } from "react";
import { Box, Button, Flex, IconButton, Progress, Skeleton, Stack, Text } from "@chakra-ui/react";
import { IconPencil, IconPlus, IconX } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  useAtriumSessions,
  useAtriumSponsorContext,
  useCreateAtriumSession,
  useAtriumExchange,
  useUpdateAtriumSession,
  useWarmAtriumSession,
  useCompactAtriumSession,
  useResetAtriumSession,
} from "@mixtape/api/hooks/atrium";
import { useFind, useAdd } from "@mixtape/api/hooks/switchboard";
import type { AtriumDialMode, AtriumSession } from "@mixtape/core/types/atriumTypes";
import { AtriumSessionThread } from "./AtriumSessionThread";
import { AtriumComposeBar } from "./AtriumComposeBar";
import { AtriumMemorySeedEditor } from "./AtriumMemorySeedEditor";
import { AtriumContextPreview } from "./AtriumContextPreview";
import { AtriumDial } from "./AtriumDial";
import { AtriumOrientRow } from "./AtriumOrientRow";
import { AtriumDistillModal } from "./AtriumDistillModal";

interface AtriumDialogSurfaceProps {
  groupSlug?: string;
}

export function AtriumDialogSurface({ groupSlug }: AtriumDialogSurfaceProps) {
  const { sessions, isLoading } = useAtriumSessions(groupSlug);
  const { sponsorContext: _sponsorContext } = useAtriumSponsorContext(groupSlug);
  const { mutateAsync: createSession, isPending: creating } = useCreateAtriumSession();
  const { mutateAsync: updateSession } = useUpdateAtriumSession();
  const [activeSession, setActiveSession] = useState<AtriumSession | null>(null);
  const [editingMemory, setEditingMemory] = useState(false);
  const [commandPending, setCommandPending] = useState(false);
  const [orientDismissed, setOrientDismissed] = useState(false);
  const [reconstructedNote, setReconstructedNote] = useState<string | null>(null);
  const [distillOpen, setDistillOpen] = useState(false);
  const [compactPromptVisible, setCompactPromptVisible] = useState(false);
  const [freshStartNote, setFreshStartNote] = useState(false);

  const { entries, streaming, error, activityText, contextStatus, usedFallback, send, reset, appendLocalEntry } =
    useAtriumExchange(activeSession);
  const { mutate: warmSession, isPending: isWarming } = useWarmAtriumSession();
  const { mutateAsync: compactSession, isPending: compacting } = useCompactAtriumSession();
  const { mutateAsync: resetSession, isPending: resetting } = useResetAtriumSession();
  const { submitAsync: submitFind } = useFind();
  const { submitAsync: submitAdd } = useAdd();

  // Pre-warm subprocess whenever the active session changes.
  useEffect(() => {
    if (!activeSession?.id) return;
    setReconstructedNote(null);
    warmSession(activeSession.id, {
      onSuccess: (result) => {
        if (result.type === "reconstructed" && result.provenance) {
          setReconstructedNote(result.provenance);
        }
      },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id]);

  async function handleCompose(message: string) {
    if (message.startsWith("/find")) {
      const query = message.slice("/find".length).trim();
      if (!query) {
        appendLocalEntry({ role: "assistant", content: "Usage: /find <query> — searches your library." });
        return;
      }
      appendLocalEntry({ role: "user", content: message });
      setCommandPending(true);
      try {
        const result = await submitFind({ query, surface: "atrium" });
        const body = result.results.length
          ? result.results
              .map((r, i) => `${i + 1}. ${r.text.slice(0, 200)}${r.text.length > 200 ? "…" : ""} (score: ${r.score.toFixed(2)})`)
              .join("\n")
          : "No results found.";
        appendLocalEntry({ role: "assistant", content: body });
      } catch (err) {
        appendLocalEntry({
          role: "assistant",
          content: `/find failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
      } finally {
        setCommandPending(false);
      }
      return;
    }

    if (message.startsWith("/add")) {
      const rest = message.slice("/add".length).trim();
      const [listTitle, itemsRaw] = rest.split(":");
      const items = (itemsRaw ?? "").split(",").map((s) => s.trim()).filter(Boolean);
      if (!listTitle?.trim() || items.length === 0) {
        appendLocalEntry({
          role: "assistant",
          content: "Usage: /add <list name>: item one, item two — appends items to a list, creating it if needed.",
        });
        return;
      }
      appendLocalEntry({ role: "user", content: message });
      setCommandPending(true);
      try {
        const result = await submitAdd({ list_title: listTitle.trim(), items, surface: "atrium" });
        appendLocalEntry({
          role: "assistant",
          content: `Added ${result.items_added} item${result.items_added === 1 ? "" : "s"} to "${result.title}".`,
        });
      } catch (err) {
        appendLocalEntry({
          role: "assistant",
          content: `/add failed: ${err instanceof Error ? err.message : "Unknown error"}`,
        });
      } finally {
        setCommandPending(false);
      }
      return;
    }

    send(message);
  }

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const subtitleColor = useColorModeValue("gray.500", "gray.400");
  const editIconColor = useColorModeValue("gray.400", "gray.500");
  const activityColor = useColorModeValue("blue.500", "blue.300");
  const reconstructedBg = useColorModeValue("blue.50", "blue.900");
  const reconstructedTextColor = useColorModeValue("blue.700", "blue.200");
  const reconstructedIconColor = useColorModeValue("blue.400", "blue.300");

  const ctxPct = contextStatus?.pct ?? 0;
  const ctxColorScheme = ctxPct >= 85 ? "red" : ctxPct >= 70 ? "orange" : "blue";

  function handleCompactClick() {
    setCompactPromptVisible(true);
  }

  async function handleCompactOnly() {
    if (!activeSession) return;
    setCompactPromptVisible(false);
    await compactSession(activeSession.id);
  }

  function handleDistillBeforeCompact() {
    setCompactPromptVisible(false);
    setDistillOpen(true);
  }

  async function handleStartFresh() {
    if (!activeSession) return;
    setEditingMemory(false);
    await resetSession(activeSession.id);
    reset(); // clear local entries state
    setFreshStartNote(true);
    setReconstructedNote(null);
    setCompactPromptVisible(false);
  }

  async function handleDialChange(mode: AtriumDialMode) {
    if (!activeSession) return;
    const updated = await updateSession({ sessionId: activeSession.id, data: { dial_mode: mode } });
    setActiveSession(updated);
    if (mode !== "very_focused") setOrientDismissed(false);
  }

  async function handleNewSession() {
    const session = await createSession(groupSlug ? { group_slug: groupSlug } : {});
    reset();
    setEditingMemory(false);
    setOrientDismissed(false);
    setReconstructedNote(null);
    setFreshStartNote(false);
    setActiveSession(session);
  }

  function handleSelectSession(session: AtriumSession) {
    if (session.id === activeSession?.id) return;
    reset();
    setEditingMemory(false);
    setOrientDismissed(false);
    setReconstructedNote(null);
    setFreshStartNote(false);
    setActiveSession(session);
  }

  function handleMemorySaved(updated: AtriumSession) {
    setActiveSession(updated);
    setEditingMemory(false);
  }

  if (isLoading) {
    return (
      <Stack gap={2}>
        <Skeleton height="48px" borderRadius="md" />
        <Skeleton height="48px" borderRadius="md" />
      </Stack>
    );
  }

  return (
    <Box
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      overflow="hidden"
    >
      {/* Session picker + new session */}
      <Flex
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        align="center"
        gap={3}
        overflowX="auto"
      >
        {sessions.length === 0 && !activeSession && (
          <Text fontSize="sm" color={subtitleColor} flexShrink={0}>
            No sessions yet.
          </Text>
        )}
        {sessions.map((s) => (
          <Button
            key={s.id}
            size="xs"
            variant={activeSession?.id === s.id ? "solid" : "outline"}
            colorScheme="blue"
            onClick={() => handleSelectSession(s)}
            flexShrink={0}
            maxW="160px"
          >
            <Text lineClamp={1}>{s.title || "Untitled"}</Text>
          </Button>
        ))}
        {activeSession && (
          <IconButton
            aria-label={editingMemory ? "Close memory seed editor" : "Edit session title and memory seed"}
            size="xs"
            variant="ghost"
            color={editingMemory ? "blue.500" : editIconColor}
            onClick={() => setEditingMemory((v) => !v)}
            flexShrink={0}
          >
            {editingMemory ? <IconX size={14} /> : <IconPencil size={14} />}
          </IconButton>
        )}
        {editingMemory && activeSession && (
          <Button
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={handleStartFresh}
            loading={resetting}
            disabled={streaming}
            flexShrink={0}
          >
            Start fresh
          </Button>
        )}
        <Button
          size="xs"
          variant="ghost"
          onClick={handleNewSession}
          loading={creating}
          flexShrink={0}
          ml="auto"
        >
          <IconPlus size={14} />
          New
        </Button>
      </Flex>

      {/* Memory seed editor — inline, collapsible */}
      {activeSession && editingMemory && (
        <AtriumMemorySeedEditor
          session={activeSession}
          onSaved={handleMemorySaved}
          onCancel={() => setEditingMemory(false)}
        />
      )}

      {/* Dial — session-level posture selector */}
      {activeSession && !editingMemory && (
        <Box px={4} py={2} borderBottomWidth="1px" borderColor={borderColor}>
          <AtriumDial
            value={activeSession.dial_mode ?? "expressive"}
            onChange={handleDialChange}
            disabled={streaming || commandPending}
          />
        </Box>
      )}

      {/* Beryl context preview — collapsed by default, power-user transparency */}
      {activeSession && !editingMemory && (
        <AtriumContextPreview sessionId={activeSession.id} />
      )}

      {/* Context usage bar — shown when we have a reading */}
      {activeSession && !editingMemory && contextStatus && (
        <Box px={4} pt={1}>
          <Flex align="center" gap={2}>
            <Progress.Root
              value={contextStatus.pct}
              max={100}
              size="xs"
              colorPalette={ctxColorScheme}
              flex={1}
            >
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>
            <Text fontSize="xs" color={subtitleColor} flexShrink={0} whiteSpace="nowrap">
              {Math.round(contextStatus.pct)}%
            </Text>
            {contextStatus.pct >= 50 && !compactPromptVisible && (
              <Button
                size="2xs"
                variant="ghost"
                onClick={handleCompactClick}
                loading={compacting}
                flexShrink={0}
              >
                Compact
              </Button>
            )}
          </Flex>
          {/* Pre-compact Distillate prompt */}
          {compactPromptVisible && (
            <Flex align="center" gap={2} pt={1} flexWrap="wrap">
              <Text fontSize="xs" color={subtitleColor} flex={1}>
                Good moment to save a Distillate before compressing?
              </Text>
              <Button
                size="2xs"
                colorPalette="blue"
                variant="outline"
                onClick={handleDistillBeforeCompact}
                flexShrink={0}
              >
                Distill →
              </Button>
              <Button
                size="2xs"
                variant="ghost"
                onClick={handleCompactOnly}
                loading={compacting}
                flexShrink={0}
              >
                Compact only
              </Button>
            </Flex>
          )}
        </Box>
      )}

      {/* Standalone Distill button — always accessible when a session is active */}
      {activeSession && !editingMemory && !compactPromptVisible && (
        <Box px={4} pt={1}>
          <Button
            size="2xs"
            variant="ghost"
            colorPalette="blue"
            onClick={() => setDistillOpen(true)}
          >
            Distill →
          </Button>
        </Box>
      )}

      {/* Reconstructed badge — shown once on cold spawn, dismissible */}
      {activeSession && reconstructedNote && (
        <Flex
          px={4}
          py={2}
          align="center"
          gap={2}
          bg={reconstructedBg}
          borderBottomWidth="1px"
          borderColor={borderColor}
        >
          <Text fontSize="xs" color={reconstructedTextColor} flex={1}>
            ↩ {reconstructedNote}
          </Text>
          <IconButton
            aria-label="Dismiss"
            size="2xs"
            variant="ghost"
            color={reconstructedIconColor}
            onClick={() => setReconstructedNote(null)}
          >
            <IconX size={12} />
          </IconButton>
        </Flex>
      )}

      {/* Fresh-start banner — shown briefly after Session Reset */}
      {activeSession && freshStartNote && (
        <Flex
          px={4}
          py={2}
          align="center"
          gap={2}
          bg={reconstructedBg}
          borderBottomWidth="1px"
          borderColor={borderColor}
        >
          <Text fontSize="xs" color={reconstructedTextColor} flex={1}>
            ↺ Session reset — started fresh. Prior conversation is archived in the DB.
          </Text>
          <IconButton
            aria-label="Dismiss"
            size="2xs"
            variant="ghost"
            color={reconstructedIconColor}
            onClick={() => setFreshStartNote(false)}
          >
            <IconX size={12} />
          </IconButton>
        </Flex>
      )}

      {/* Thread */}
      {activeSession ? (
        <Box px={4} pt={4}>
          <AtriumSessionThread
            entries={entries}
            streaming={streaming}
            error={error}
            sessionTitle={activeSession.title}
          />
        </Box>
      ) : (
        <Box px={4} pt={6} pb={2} textAlign="center">
          <Text fontSize="sm" color={subtitleColor}>
            Select a session above or start a new one.
          </Text>
        </Box>
      )}

      {/* Orient row — Very Focused only, dismissed once user sets a target */}
      {activeSession &&
        (activeSession.dial_mode ?? "expressive") === "very_focused" &&
        !orientDismissed && (
          <Box px={4} pt={2}>
            <AtriumOrientRow onDismiss={() => setOrientDismissed(true)} />
          </Box>
        )}

      {/* Warming indicator — shown while PTY is booting */}
      {activeSession && isWarming && !streaming && (
        <Box px={4} pb={1}>
          <Text fontSize="xs" color={subtitleColor} fontStyle="italic">
            Starting up Claude Code…
          </Text>
        </Box>
      )}

      {/* Activity indicator — shows tool-call activity while PTY is working */}
      {activeSession && activityText && streaming && (
        <Box px={4} pb={1}>
          <Text fontSize="xs" color={activityColor} fontStyle="italic" lineClamp={1}>
            ⯎ {activityText}
          </Text>
        </Box>
      )}

      {/* Fallback notice — shown briefly after a response completed via timeout */}
      {activeSession && usedFallback && !streaming && (
        <Box px={4} pb={1}>
          <Text fontSize="xs" color={subtitleColor} fontStyle="italic">
            (prompt detection timed out — response may be truncated)
          </Text>
        </Box>
      )}

      {/* Compose bar */}
      <Box px={4} pb={4} pt={2}>
        <AtriumComposeBar
          onSend={handleCompose}
          disabled={!activeSession}
          streaming={streaming || commandPending}
        />
      </Box>

      {/* Distill modal — portal-rendered, outside the scroll container */}
      {activeSession && (
        <AtriumDistillModal
          sessionId={activeSession.id}
          open={distillOpen}
          onClose={() => setDistillOpen(false)}
        />
      )}
    </Box>
  );
}

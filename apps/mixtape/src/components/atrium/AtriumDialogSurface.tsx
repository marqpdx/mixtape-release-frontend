"use client";

import { useState } from "react";
import { Box, Button, Flex, IconButton, Skeleton, Stack, Text } from "@chakra-ui/react";
import { IconPencil, IconPlus, IconX } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  useAtriumSessions,
  useCreateAtriumSession,
  useAtriumExchange,
  useUpdateAtriumSession,
} from "@mixtape/api/hooks/atrium";
import { useFind, useAdd } from "@mixtape/api/hooks/switchboard";
import type { AtriumDialMode, AtriumSession } from "@mixtape/core/types/atriumTypes";
import { AtriumSessionThread } from "./AtriumSessionThread";
import { AtriumComposeBar } from "./AtriumComposeBar";
import { AtriumMemorySeedEditor } from "./AtriumMemorySeedEditor";
import { AtriumContextPreview } from "./AtriumContextPreview";
import { AtriumDial } from "./AtriumDial";
import { AtriumOrientRow } from "./AtriumOrientRow";

export function AtriumDialogSurface() {
  const { sessions, isLoading } = useAtriumSessions();
  const { mutateAsync: createSession, isPending: creating } = useCreateAtriumSession();
  const { mutateAsync: updateSession } = useUpdateAtriumSession();
  const [activeSession, setActiveSession] = useState<AtriumSession | null>(null);
  const [editingMemory, setEditingMemory] = useState(false);
  const [commandPending, setCommandPending] = useState(false);
  const [orientDismissed, setOrientDismissed] = useState(false);

  const { entries, streaming, error, send, reset, appendLocalEntry } = useAtriumExchange(activeSession);
  const { submitAsync: submitFind } = useFind();
  const { submitAsync: submitAdd } = useAdd();

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

  async function handleDialChange(mode: AtriumDialMode) {
    if (!activeSession) return;
    const updated = await updateSession({ sessionId: activeSession.id, data: { dial_mode: mode } });
    setActiveSession(updated);
    if (mode !== "very_focused") setOrientDismissed(false);
  }

  async function handleNewSession() {
    const session = await createSession({});
    reset();
    setEditingMemory(false);
    setOrientDismissed(false);
    setActiveSession(session);
  }

  function handleSelectSession(session: AtriumSession) {
    if (session.id === activeSession?.id) return;
    reset();
    setEditingMemory(false);
    setOrientDismissed(false);
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

      {/* Compose bar */}
      <Box px={4} pb={4} pt={3}>
        <AtriumComposeBar
          onSend={handleCompose}
          disabled={!activeSession}
          streaming={streaming || commandPending}
        />
      </Box>
    </Box>
  );
}

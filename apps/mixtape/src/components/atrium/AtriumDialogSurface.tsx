"use client";

import { useEffect, useState } from "react";
import { Box, Button, Flex, IconButton, Popover, Portal, Progress, Skeleton, Stack, Text } from "@chakra-ui/react";
import { IconAdjustmentsHorizontal, IconEye, IconGauge, IconHistory, IconPencil, IconPlus, IconSparkles, IconTarget, IconUser, IconUsers, IconX } from "@tabler/icons-react";
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
import { useFind, useAdd, useTrack } from "@mixtape/api/hooks/switchboard";
import type { AtriumDialMode, AtriumSession } from "@mixtape/core/types/atriumTypes";
import { AtriumSessionThread } from "./AtriumSessionThread";
import { AtriumComposeBar } from "./AtriumComposeBar";
import { AtriumMemorySeedEditor } from "./AtriumMemorySeedEditor";
import { AtriumContextPreview } from "./AtriumContextPreview";
import { AtriumDial } from "./AtriumDial";
import { AtriumOrientRow } from "./AtriumOrientRow";
import { AtriumDistillModal } from "./AtriumDistillModal";
import { AtriumInitiativeLogPanel } from "./AtriumInitiativeLogPanel";

// Right strip width — icon-only; set as CSS var so fixed compose bar can reference it
const RIGHT_STRIP_W = "52px";

interface AtriumDialogSurfaceProps {
  groupSlug?: string;
  selectedInitiativeId?: string | null;
  onInitiativeSessionChange?: (initiativeId: string | null) => void;
  onTrackedFetch?: (items: string[]) => void;
}

export function AtriumDialogSurface({ groupSlug, selectedInitiativeId, onInitiativeSessionChange, onTrackedFetch }: AtriumDialogSurfaceProps) {
  const { sessions, isLoading } = useAtriumSessions(groupSlug);
  const { sponsorContext } = useAtriumSponsorContext(groupSlug);
  const { mutateAsync: createSession, isPending: creating } = useCreateAtriumSession();
  const { mutateAsync: updateSession } = useUpdateAtriumSession();
  const [activeSession, setActiveSession] = useState<AtriumSession | null>(null);
  const [memoryOpen, setMemoryOpen] = useState(false);
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
  const { submitAsync: submitTrack } = useTrack();

  async function handleSelectInitiative(initiativeId: string) {
    const existing = sessions.find((s) => s.initiative_id === initiativeId);
    if (existing) {
      handleSelectSession(existing);
    } else {
      const session = await createSession(
        groupSlug
          ? { group_slug: groupSlug, initiative_id: initiativeId }
          : { initiative_id: initiativeId }
      );
      reset();
      setMemoryOpen(false);
      setOrientDismissed(false);
      setReconstructedNote(null);
      setFreshStartNote(false);
      setActiveSession(session);
    }
  }

  useEffect(() => {
    if (!selectedInitiativeId) return;
    handleSelectInitiative(selectedInitiativeId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInitiativeId]);

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
        const result = await submitFind({ query, surface: "atrium", group_slug: groupSlug });
        const body = result.results.length
          ? result.results
              .map((r, i) => {
                const source = r.artifact_type === "list"
                  ? `[List: ${r.list_title ?? "Tracked"}]`
                  : `(score: ${r.score.toFixed(2)})`;
                return `${i + 1}. ${r.text.slice(0, 200)}${r.text.length > 200 ? "…" : ""} ${source}`;
              })
              .join("\n")
          : "No results found.";
        appendLocalEntry({ role: "assistant", content: body });
      } catch (err) {
        appendLocalEntry({ role: "assistant", content: `/find failed: ${err instanceof Error ? err.message : "Unknown error"}` });
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
        appendLocalEntry({ role: "assistant", content: "Usage: /add <list name>: item one, item two — appends items to a list, creating it if needed." });
        return;
      }
      appendLocalEntry({ role: "user", content: message });
      setCommandPending(true);
      try {
        const result = await submitAdd({ list_title: listTitle.trim(), items, surface: "atrium" });
        appendLocalEntry({ role: "assistant", content: `Added ${result.items_added} item${result.items_added === 1 ? "" : "s"} to "${result.title}".` });
      } catch (err) {
        appendLocalEntry({ role: "assistant", content: `/add failed: ${err instanceof Error ? err.message : "Unknown error"}` });
      } finally {
        setCommandPending(false);
      }
      return;
    }

    if (message.startsWith("/track")) {
      const rest = message.slice("/track".length).trim();
      appendLocalEntry({ role: "user", content: message });
      setCommandPending(true);
      try {
        if (!rest) {
          const result = await submitTrack({ action: "fetch", group_slug: groupSlug });
          if (result.action === "fetch") {
            onTrackedFetch?.(result.items);
            const body = result.items.length
              ? `Tracked items:\n${result.items.map((item, i) => `${i + 1}. ${item}`).join("\n")}`
              : "No tracked items yet. Use `/track [text]` to add one.";
            appendLocalEntry({ role: "assistant", content: body });
          }
        } else {
          const result = await submitTrack({ action: "append", text: rest, group_slug: groupSlug });
          if (result.action === "append") {
            appendLocalEntry({ role: "assistant", content: `Tracked: "${rest}"` });
            const fetchResult = await submitTrack({ action: "fetch", group_slug: groupSlug });
            if (fetchResult.action === "fetch") onTrackedFetch?.(fetchResult.items);
          }
        }
      } catch (err) {
        appendLocalEntry({ role: "assistant", content: `/track failed: ${err instanceof Error ? err.message : "Unknown error"}` });
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
  const activityColor = useColorModeValue("blue.500", "blue.300");
  const reconstructedBg = useColorModeValue("blue.50", "blue.900");
  const reconstructedTextColor = useColorModeValue("blue.700", "blue.200");
  const reconstructedIconColor = useColorModeValue("blue.400", "blue.300");
  const sponsorGroupBg = useColorModeValue("blue.50", "blue.950");
  const sponsorPersonalBg = useColorModeValue("gray.50", "gray.750");
  const sponsorGroupColor = useColorModeValue("blue.700", "blue.300");
  const sponsorPersonalColor = useColorModeValue("gray.600", "gray.400");
  const stripBg = useColorModeValue("gray.50", "gray.900");

  const ctxPct = contextStatus?.pct ?? 0;
  const ctxColorScheme = ctxPct >= 85 ? "red" : ctxPct >= 70 ? "orange" : "blue";

  function handleCompactClick() { setCompactPromptVisible(true); }

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
    setMemoryOpen(false);
    await resetSession(activeSession.id);
    reset();
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
    setMemoryOpen(false);
    setOrientDismissed(false);
    setReconstructedNote(null);
    setFreshStartNote(false);
    setActiveSession(session);
    onInitiativeSessionChange?.(null);
  }

  function handleSelectSession(session: AtriumSession) {
    if (session.id === activeSession?.id) return;
    reset();
    setMemoryOpen(false);
    setOrientDismissed(false);
    setReconstructedNote(null);
    setFreshStartNote(false);
    setActiveSession(session);
    onInitiativeSessionChange?.(session.initiative_id ?? null);
  }

  function handleMemorySaved(updated: AtriumSession) {
    setActiveSession(updated);
  }

  const personalSessions = sessions.filter((s) => !s.initiative_id);

  if (isLoading) {
    return (
      <Stack gap={2} flex="1">
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
      display="flex"
      flexDirection="column"
      flex="1"
      minH="0"
    >
      {/* Sponsor identity badge — full width */}
      {sponsorContext && (
        <Flex
          className="ads-sponsor-badge"
          px={4}
          py={1.5}
          align="center"
          gap={1.5}
          bg={sponsorContext.sponsor_type === "group" ? sponsorGroupBg : sponsorPersonalBg}
          borderBottomWidth="1px"
          borderColor={borderColor}
          flexShrink={0}
        >
          {sponsorContext.sponsor_type === "group" ? (
            <IconUsers size={12} color={sponsorGroupColor} />
          ) : (
            <IconUser size={12} color={sponsorPersonalColor} />
          )}
          <Text fontSize="xs" fontWeight="500"
            color={sponsorContext.sponsor_type === "group" ? sponsorGroupColor : sponsorPersonalColor}>
            {sponsorContext.sponsor_type === "group" ? sponsorContext.sponsor_name : "Personal"}
          </Text>
        </Flex>
      )}

      {/* Body: thread (left) + controls strip (right) */}
      <Flex flex="1" minH="0">

        {/* LEFT — thread column */}
        <Box flex="1" display="flex" flexDirection="column" minH="0">

          {/* Status banners */}
          {activeSession && reconstructedNote && (
            <Flex px={4} py={2} align="center" gap={2} bg={reconstructedBg} borderBottomWidth="1px" borderColor={borderColor} flexShrink={0}>
              <Text fontSize="xs" color={reconstructedTextColor} flex={1}>↩ {reconstructedNote}</Text>
              <IconButton aria-label="Dismiss" size="2xs" variant="ghost" color={reconstructedIconColor} onClick={() => setReconstructedNote(null)}>
                <IconX size={12} />
              </IconButton>
            </Flex>
          )}
          {activeSession && freshStartNote && (
            <Flex px={4} py={2} align="center" gap={2} bg={reconstructedBg} borderBottomWidth="1px" borderColor={borderColor} flexShrink={0}>
              <Text fontSize="xs" color={reconstructedTextColor} flex={1}>↺ Session reset — started fresh.</Text>
              <IconButton aria-label="Dismiss" size="2xs" variant="ghost" color={reconstructedIconColor} onClick={() => setFreshStartNote(false)}>
                <IconX size={12} />
              </IconButton>
            </Flex>
          )}

          {/* Initiative log panel */}
          {activeSession && activeSession.initiative_id && (
            <Box flexShrink={0}>
              <AtriumInitiativeLogPanel session={activeSession} defaultExpanded />
            </Box>
          )}

          {/* Thread — grows and scrolls */}
          <Box flex="1" minH="0" display="flex" flexDirection="column" px={4} pt={4} pb="80px">
            {activeSession ? (
              <AtriumSessionThread
                entries={entries}
                streaming={streaming}
                error={error}
                sessionTitle={activeSession.title}
              />
            ) : (
              <Box textAlign="center" pt={6}>
                <Text fontSize="sm" color={subtitleColor}>
                  Select an initiative or start a personal session.
                </Text>
              </Box>
            )}
          </Box>

          {/* Orient row */}
          {activeSession && (activeSession.dial_mode ?? "expressive") === "very_focused" && !orientDismissed && (
            <Box px={4} pt={2} flexShrink={0}>
              <AtriumOrientRow onDismiss={() => setOrientDismissed(true)} />
            </Box>
          )}

          {/* Status indicators */}
          {activeSession && isWarming && !streaming && (
            <Box px={4} pb={1} flexShrink={0}>
              <Text fontSize="xs" color={subtitleColor} fontStyle="italic">Starting up Claude Code…</Text>
            </Box>
          )}
          {activeSession && activityText && streaming && (
            <Box px={4} pb={1} flexShrink={0}>
              <Text fontSize="xs" color={activityColor} fontStyle="italic" lineClamp={1}>⯎ {activityText}</Text>
            </Box>
          )}
          {activeSession && usedFallback && !streaming && (
            <Box px={4} pb={1} flexShrink={0}>
              <Text fontSize="xs" color={subtitleColor} fontStyle="italic">(prompt detection timed out — response may be truncated)</Text>
            </Box>
          )}
        </Box>

        {/* RIGHT — controls strip */}
        {/* RIGHT — icon-only strip; popovers open to the left on click, title= gives native rollover label */}
        <Box
          className="ads-right-strip"
          w={RIGHT_STRIP_W}
          borderLeft="1px solid"
          borderColor={borderColor}
          flexShrink={0}
          bg={stripBg}
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={1}
          py={2}
          overflowY="auto"
        >
          {/* Sessions */}
          <Popover.Root positioning={{ placement: "left-start" }}>
            <Popover.Trigger asChild>
              <IconButton aria-label="Sessions" title="Sessions" size="sm" variant="ghost">
                <IconHistory size={16} />
              </IconButton>
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner zIndex={200}>
                <Popover.Content w="200px">
                  <Box p={3}>
                    <Text fontSize="xs" fontWeight="700" color={subtitleColor} textTransform="uppercase" letterSpacing="wider" mb={2}>Personal</Text>
                    <Flex direction="column" gap={1}>
                      {personalSessions.map((s) => (
                        <Button key={s.id} size="xs" variant={activeSession?.id === s.id ? "solid" : "outline"}
                          colorPalette="blue" onClick={() => handleSelectSession(s)} w="full" justifyContent="flex-start">
                          <Text lineClamp={1}>{s.title || "Session"}</Text>
                        </Button>
                      ))}
                      <Button size="xs" variant="ghost" onClick={handleNewSession} loading={creating} justifyContent="flex-start">
                        <IconPlus size={12} /> New session
                      </Button>
                    </Flex>
                  </Box>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>

          {/* Initiatives */}
          {sponsorContext && sponsorContext.initiatives.length > 0 && (
            <Popover.Root positioning={{ placement: "left-start" }}>
              <Popover.Trigger asChild>
                <IconButton aria-label="Initiatives" title="Initiatives" size="sm" variant="ghost">
                  <IconTarget size={16} />
                </IconButton>
              </Popover.Trigger>
              <Portal>
                <Popover.Positioner zIndex={200}>
                  <Popover.Content w="200px">
                    <Box p={3}>
                      <Text fontSize="xs" fontWeight="700" color={subtitleColor} textTransform="uppercase" letterSpacing="wider" mb={2}>Initiatives</Text>
                      <Flex direction="column" gap={0.5}>
                        {sponsorContext.initiatives.map((ini) => {
                          const isActive = activeSession?.initiative_id === ini.id;
                          return (
                            <Button key={ini.id} size="sm" variant={isActive ? "solid" : "ghost"} colorPalette="blue"
                              justifyContent="flex-start" onClick={() => handleSelectInitiative(ini.id)} w="full">
                              <Text lineClamp={1} textAlign="left" flex={1}>{ini.title}</Text>
                            </Button>
                          );
                        })}
                      </Flex>
                    </Box>
                  </Popover.Content>
                </Popover.Positioner>
              </Portal>
            </Popover.Root>
          )}

          {/* Memory seed */}
          {activeSession && (
            <Popover.Root open={memoryOpen} onOpenChange={(e) => setMemoryOpen(e.open)} positioning={{ placement: "left-start" }}>
              <Popover.Trigger asChild>
                <IconButton aria-label="Memory seed" title="Memory seed" size="sm"
                  variant={memoryOpen ? "solid" : "ghost"} colorPalette={memoryOpen ? "blue" : undefined}>
                  <IconPencil size={16} />
                </IconButton>
              </Popover.Trigger>
              <Portal>
                <Popover.Positioner zIndex={200}>
                  <Popover.Content w="280px">
                    <Box p={3}>
                      <Flex align="center" justify="space-between" mb={2}>
                        <Text fontSize="xs" fontWeight="700" color={subtitleColor} textTransform="uppercase" letterSpacing="wider">Memory seed</Text>
                        <Button size="2xs" variant="ghost" colorPalette="red" onClick={handleStartFresh} loading={resetting} disabled={streaming}>
                          Start fresh
                        </Button>
                      </Flex>
                      <AtriumMemorySeedEditor
                        session={activeSession}
                        onSaved={(updated) => { handleMemorySaved(updated); setMemoryOpen(false); }}
                        onCancel={() => setMemoryOpen(false)}
                      />
                    </Box>
                  </Popover.Content>
                </Popover.Positioner>
              </Portal>
            </Popover.Root>
          )}

          {/* Dial / Mode */}
          {activeSession && (
            <Popover.Root positioning={{ placement: "left-start" }}>
              <Popover.Trigger asChild>
                <IconButton aria-label="Mode" title="Mode" size="sm" variant="ghost">
                  <IconAdjustmentsHorizontal size={16} />
                </IconButton>
              </Popover.Trigger>
              <Portal>
                <Popover.Positioner zIndex={200}>
                  <Popover.Content w="220px">
                    <Box p={3}>
                      <Text fontSize="xs" fontWeight="700" color={subtitleColor} textTransform="uppercase" letterSpacing="wider" mb={2}>Mode</Text>
                      <AtriumDial value={activeSession.dial_mode ?? "expressive"} onChange={handleDialChange} disabled={streaming || commandPending} />
                    </Box>
                  </Popover.Content>
                </Popover.Positioner>
              </Portal>
            </Popover.Root>
          )}

          {/* Beryl context */}
          {activeSession && (
            <Popover.Root positioning={{ placement: "left-start" }}>
              <Popover.Trigger asChild>
                <IconButton aria-label="Beryl context" title="Beryl context" size="sm" variant="ghost">
                  <IconEye size={16} />
                </IconButton>
              </Popover.Trigger>
              <Portal>
                <Popover.Positioner zIndex={200}>
                  <Popover.Content w="260px">
                    <Box p={3}>
                      <AtriumContextPreview sessionId={activeSession.id} />
                    </Box>
                  </Popover.Content>
                </Popover.Positioner>
              </Portal>
            </Popover.Root>
          )}

          {/* Context usage */}
          {activeSession && contextStatus && (
            <Popover.Root positioning={{ placement: "left-start" }}>
              <Popover.Trigger asChild>
                <IconButton
                  aria-label={`Context ${Math.round(contextStatus.pct)}%`}
                  title={`Context ${Math.round(contextStatus.pct)}%`}
                  size="sm" variant="ghost"
                  color={ctxPct >= 85 ? "red.500" : ctxPct >= 70 ? "orange.500" : undefined}
                >
                  <IconGauge size={16} />
                </IconButton>
              </Popover.Trigger>
              <Portal>
                <Popover.Positioner zIndex={200}>
                  <Popover.Content w="220px">
                    <Box p={3}>
                      <Text fontSize="xs" fontWeight="700" color={subtitleColor} textTransform="uppercase" letterSpacing="wider" mb={2}>Context</Text>
                      <Flex align="center" gap={2} mb={compactPromptVisible ? 2 : 0}>
                        <Progress.Root value={contextStatus.pct} max={100} size="xs" colorPalette={ctxColorScheme} flex={1}>
                          <Progress.Track><Progress.Range /></Progress.Track>
                        </Progress.Root>
                        <Text fontSize="xs" color={subtitleColor} flexShrink={0}>{Math.round(contextStatus.pct)}%</Text>
                        {contextStatus.pct >= 50 && !compactPromptVisible && (
                          <Button size="2xs" variant="ghost" onClick={handleCompactClick} loading={compacting} flexShrink={0}>Compact</Button>
                        )}
                      </Flex>
                      {compactPromptVisible && (
                        <Flex direction="column" gap={1.5}>
                          <Text fontSize="xs" color={subtitleColor}>Save a Distillate before compressing?</Text>
                          <Flex gap={2}>
                            <Button size="2xs" colorPalette="blue" variant="outline" onClick={handleDistillBeforeCompact}>Distill →</Button>
                            <Button size="2xs" variant="ghost" onClick={handleCompactOnly} loading={compacting}>Compact only</Button>
                          </Flex>
                        </Flex>
                      )}
                    </Box>
                  </Popover.Content>
                </Popover.Positioner>
              </Portal>
            </Popover.Root>
          )}

          {/* Distill */}
          {activeSession && (
            <IconButton aria-label="Distill" title="Distill" size="sm" variant="ghost" colorPalette="blue" onClick={() => setDistillOpen(true)}>
              <IconSparkles size={16} />
            </IconButton>
          )}
        </Box>
      </Flex>

      {/* Compose bar — fixed at viewport bottom, spanning thread column only */}
      <Box
        position="fixed"
        bottom={0}
        left="var(--gss-rail-w, 168px)"
        right={RIGHT_STRIP_W}
        zIndex={100}
        bg={bgColor}
        borderTop="1px solid"
        borderColor={borderColor}
        px={4}
        pb={4}
        pt={3}
      >
        <AtriumComposeBar
          onSend={handleCompose}
          disabled={!activeSession}
          streaming={streaming || commandPending}
        />
      </Box>

      {/* Distill modal */}
      {activeSession && (
        <AtriumDistillModal sessionId={activeSession.id} open={distillOpen} onClose={() => setDistillOpen(false)} />
      )}
    </Box>
  );
}

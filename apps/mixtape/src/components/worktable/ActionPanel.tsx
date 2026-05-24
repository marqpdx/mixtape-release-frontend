"use client";

import { useState } from "react";
import { Box, Button, HStack, Input, Spinner, Text, Textarea, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  useHubCaptures,
  usePromoteCaptures,
  useResolveCapture,
  useStewardship,
} from "@mixtape/api/hooks/console/useConsole";
import { useHandoverDraft } from "@mixtape/api/hooks/initiatives";
import { createApertureLogEntry } from "@mixtape/api/clients/initiatives/initiativesApi";
import { ContextSummary } from "./ContextSummary";
import AddPanel from "@components/puddlejump/panels/AddPanel";
import FindPanel from "@components/puddlejump/panels/FindPanel";
import ResearchPanel from "@components/puddlejump/panels/ResearchPanel";
import DraftPanel from "@components/puddlejump/panels/DraftPanel";
import RefinePanel from "@components/puddlejump/panels/RefinePanel";
import type { WorkTableContext } from "./types";
import type { ApertureLogEntry } from "@mixtape/api/clients/initiatives/initiativesApi";

export type ActionMode = "empty" | "needs" | "reminders" | "fixes" | "handover" | "draft" | "refine" | "add" | "find" | "research";

// ---------------------------------------------------------------------------
// Shared header with back button
// ---------------------------------------------------------------------------

function PanelHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  return (
    <HStack justify="space-between" mb={3}>
      <Text fontSize="sm" fontWeight="700">{title}</Text>
      <Box
        as="button"
        fontSize="xs"
        color={mutedColor}
        onClick={onBack}
        _hover={{ opacity: 0.7 }}
      >
        ← back
      </Box>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// NeedsPanel
// ---------------------------------------------------------------------------

function NeedsPanel({ context, onBack }: { context: WorkTableContext; onBack: () => void }) {
  const groupSlug = context.kind === "group" ? context.slug : undefined;
  const { data, isLoading } = useHubCaptures("need_more", groupSlug);
  const resolveCapture = useResolveCapture();
  const promoteCaptures = usePromoteCaptures();

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [promoting, setPromoting] = useState(false);
  const [promoteTitle, setPromoteTitle] = useState("");

  const cardBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  const items = data?.captures ?? [];

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function exitSelect() {
    setSelectMode(false);
    setSelectedIds(new Set());
    setPromoting(false);
    setPromoteTitle("");
  }

  async function handlePromote() {
    if (!promoteTitle.trim() || selectedIds.size === 0) return;
    await promoteCaptures.mutateAsync({ captureIds: [...selectedIds], targetTitle: promoteTitle.trim() });
    exitSelect();
  }

  if (isLoading) return <Spinner size="sm" />;

  return (
    <Box>
      <HStack justify="space-between" mb={3}>
        <Text fontSize="sm" fontWeight="700">We Need More's</Text>
        <HStack gap={2}>
          {items.length > 0 && (
            <Box
              as="button"
              fontSize="xs"
              color={selectMode ? "blue.400" : mutedColor}
              onClick={() => (selectMode ? exitSelect() : setSelectMode(true))}
              _hover={{ opacity: 0.7 }}
            >
              {selectMode ? "cancel" : "select"}
            </Box>
          )}
          <Box as="button" fontSize="xs" color={mutedColor} onClick={onBack} _hover={{ opacity: 0.7 }}>
            ← back
          </Box>
        </HStack>
      </HStack>

      {items.length === 0 ? (
        <Text fontSize="sm" color={mutedColor}>No open needs.</Text>
      ) : (
        <VStack gap={1} align="stretch">
          {items.map((c) => (
            <HStack
              key={c.id}
              bg={selectMode && selectedIds.has(c.id) ? hoverBg : cardBg}
              border="1px solid"
              borderColor={selectMode && selectedIds.has(c.id) ? "blue.300" : borderColor}
              borderRadius="md"
              px={3}
              py={2}
              justify="space-between"
              cursor={selectMode ? "pointer" : "default"}
              onClick={selectMode ? () => toggleSelect(c.id) : undefined}
            >
              <Text fontSize="sm" flex={1} lineClamp={2}>{c.body}</Text>
              {!selectMode && (
                <Text
                  fontSize="xs"
                  color={mutedColor}
                  cursor="pointer"
                  _hover={{ color: "green.400" }}
                  flexShrink={0}
                  ml={2}
                  onClick={(e) => { e.stopPropagation(); resolveCapture.mutate(c.id); }}
                >
                  ✓
                </Text>
              )}
            </HStack>
          ))}

          {selectMode && selectedIds.size > 0 && (
            <VStack gap={2} mt={2} align="stretch">
              {!promoting ? (
                <Button size="sm" colorPalette="blue" variant="subtle" onClick={() => setPromoting(true)}>
                  Promote {selectedIds.size} to List →
                </Button>
              ) : (
                <HStack gap={2}>
                  <Input
                    size="sm"
                    placeholder="List title…"
                    value={promoteTitle}
                    onChange={(e) => setPromoteTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handlePromote(); }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    colorPalette="blue"
                    loading={promoteCaptures.isPending}
                    disabled={!promoteTitle.trim()}
                    onClick={() => void handlePromote()}
                  >
                    Go
                  </Button>
                </HStack>
              )}
            </VStack>
          )}
        </VStack>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// RemindersPanel
// ---------------------------------------------------------------------------

function RemindersPanel({ onBack }: { onBack: () => void }) {
  const { data, isLoading } = useStewardship();
  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const reminders = data?.overdue_reminders ?? [];

  if (isLoading) return <Spinner size="sm" />;

  return (
    <Box>
      <PanelHeader title="Reminders" onBack={onBack} />
      {reminders.length === 0 ? (
        <Text fontSize="sm" color={mutedColor}>No overdue reminders.</Text>
      ) : (
        <VStack gap={1} align="stretch">
          {reminders.map((r) => (
            <HStack
              key={r.id}
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="md"
              px={3}
              py={2}
              justify="space-between"
            >
              <Text fontSize="sm" flex={1} lineClamp={2}>{r.title || r.body || "(reminder)"}</Text>
              <Text fontSize="xs" color="red.400" flexShrink={0}>{r.days_overdue}d</Text>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// FixesPanel
// ---------------------------------------------------------------------------

function FixesPanel({ context, onBack }: { context: WorkTableContext; onBack: () => void }) {
  const groupSlug = context.kind === "group" ? context.slug : undefined;
  const { data, isLoading } = useHubCaptures("fix", groupSlug);
  const resolveCapture = useResolveCapture();

  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const cardBg = useColorModeValue("gray.50", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const items = data?.captures ?? [];

  if (isLoading) return <Spinner size="sm" />;

  return (
    <Box>
      <PanelHeader title="Let's Fix's" onBack={onBack} />
      {items.length === 0 ? (
        <Text fontSize="sm" color={mutedColor}>No open fixes.</Text>
      ) : (
        <VStack gap={1} align="stretch">
          {items.map((c) => (
            <HStack
              key={c.id}
              bg={cardBg}
              border="1px solid"
              borderColor={borderColor}
              borderRadius="md"
              px={3}
              py={2}
              justify="space-between"
            >
              <Text fontSize="sm" flex={1} lineClamp={2}>{c.body}</Text>
              <Text
                fontSize="xs"
                color={mutedColor}
                cursor="pointer"
                _hover={{ color: "green.400" }}
                flexShrink={0}
                ml={2}
                onClick={() => resolveCapture.mutate(c.id)}
              >
                ✓
              </Text>
            </HStack>
          ))}
        </VStack>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// HandoverPanel
// ---------------------------------------------------------------------------

const HANDOVER_COLOR = "#0D7377";

function HandoverPanel({
  initiativeId,
  onBack,
  onApertureCapture,
}: {
  initiativeId: string;
  onBack: () => void;
  onApertureCapture?: (entry: ApertureLogEntry) => void;
}) {
  const { draft, isLoading, error, refetch } = useHandoverDraft(initiativeId);
  const [body, setBody] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Sync textarea when draft arrives (only on first load)
  const editableBody = body ?? draft?.draft_body ?? "";

  async function handleApprove() {
    if (!editableBody.trim() || approving) return;
    setApproving(true);
    setApproveError(null);
    try {
      const entry = await createApertureLogEntry(initiativeId, { kind: "handoff", body: editableBody.trim() });
      onApertureCapture?.(entry);
      onBack();
    } catch {
      setApproveError("Failed to save. Try again.");
    } finally {
      setApproving(false);
    }
  }

  async function handleRegenerate() {
    setBody(null);
    await refetch();
  }

  if (isLoading) {
    return (
      <Box>
        <PanelHeader title="Handover draft" onBack={onBack} />
        <HStack gap={2} py={4}>
          <Spinner size="sm" color={HANDOVER_COLOR} />
          <Text fontSize="sm" color={mutedColor}>Generating…</Text>
        </HStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <PanelHeader title="Handover draft" onBack={onBack} />
        <Text fontSize="sm" color="red.400">{error}</Text>
      </Box>
    );
  }

  if (!draft) {
    return (
      <Box>
        <PanelHeader title="Handover draft" onBack={onBack} />
        <Text fontSize="sm" color={mutedColor}>
          No recent activity to summarize. Write a handoff note directly with{" "}
          <Box as="span" fontFamily="mono" fontSize="xs" fontWeight="700">/handoff</Box>.
        </Text>
      </Box>
    );
  }

  const generatedAgo = (() => {
    const ms = Date.now() - new Date(draft.generated_at).getTime();
    const min = Math.round(ms / 60_000);
    return min < 1 ? "just now" : `${min} min ago`;
  })();

  return (
    <Box>
      <HStack justify="space-between" mb={3}>
        <Text fontSize="sm" fontWeight="700">Handover draft</Text>
        <HStack gap={2}>
          <Text fontSize="xs" color={labelColor}>{generatedAgo}</Text>
          <Box
            as="button"
            fontSize="xs"
            color={mutedColor}
            _hover={{ opacity: 0.7 }}
            onClick={() => void handleRegenerate()}
            title="Regenerate"
          >
            ⟳
          </Box>
          <Box as="button" fontSize="xs" color={mutedColor} onClick={onBack} _hover={{ opacity: 0.7 }}>
            ← back
          </Box>
        </HStack>
      </HStack>

      <Textarea
        value={editableBody}
        onChange={(e) => setBody(e.target.value)}
        fontSize="sm"
        minH="260px"
        resize="vertical"
        mb={3}
        fontFamily="mono"
        borderColor={borderColor}
      />

      {approveError && (
        <Text fontSize="xs" color="red.400" mb={2}>{approveError}</Text>
      )}

      <HStack gap={2} justify="flex-end">
        <Button
          size="sm"
          variant="ghost"
          colorPalette="gray"
          onClick={onBack}
          disabled={approving}
        >
          Discard
        </Button>
        <Button
          size="sm"
          colorPalette="teal"
          onClick={() => void handleApprove()}
          loading={approving}
          disabled={!editableBody.trim()}
        >
          Approve — save as handoff note
        </Button>
      </HStack>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// EmptyState
// ---------------------------------------------------------------------------

function EmptyState({ context }: { context: WorkTableContext }) {
  return <ContextSummary context={context} />;
}

// ---------------------------------------------------------------------------
// ActionPanel
// ---------------------------------------------------------------------------

export function ActionPanel({
  mode,
  context,
  onClear,
  onApertureCapture,
}: {
  mode: ActionMode;
  context: WorkTableContext;
  onClear: () => void;
  onApertureCapture?: (entry: ApertureLogEntry) => void;
}) {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      minH="200px"
    >
      {mode === "empty" && <EmptyState context={context} />}
      {mode === "needs" && <NeedsPanel context={context} onBack={onClear} />}
      {mode === "reminders" && <RemindersPanel onBack={onClear} />}
      {mode === "fixes" && <FixesPanel context={context} onBack={onClear} />}
      {mode === "handover" && context.kind === "initiative" && (
        <HandoverPanel
          initiativeId={context.id}
          onBack={onClear}
          onApertureCapture={onApertureCapture}
        />
      )}
      {mode === "handover" && context.kind !== "initiative" && (
        <EmptyState context={context} />
      )}
      {mode === "add" && <AddPanel surface="console" />}
      {mode === "find" && <FindPanel surface="console" />}
      {mode === "research" && <ResearchPanel surface="console" />}
      {mode === "draft" && <DraftPanel surface="console" />}
      {mode === "refine" && <RefinePanel surface="console" />}
    </Box>
  );
}

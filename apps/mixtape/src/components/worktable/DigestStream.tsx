"use client";

import { useState } from "react";
import { Box, HStack, Spinner, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useWorktableStream } from "@mixtape/api/hooks/worktable/useWorktable";
import { useHubCaptures, useStewardship } from "@mixtape/api/hooks/console/useConsole";
import type { StreamEntry } from "@mixtape/api/clients/worktable/worktableApi";
import { ApertureLogStream } from "./ApertureLogStream";
import type { WorkTableContext } from "./types";
import type { ActionMode } from "./ActionPanel";

// ---------------------------------------------------------------------------
// Day grouping
// ---------------------------------------------------------------------------

type DayGroup = {
  dateKey: string;
  label: string;
  entries: StreamEntry[];
};

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function formatDayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  const today = new Date();
  const todayKey = toDateKey(today.toISOString());
  const yesterdayKey = toDateKey(new Date(today.getTime() - 86_400_000).toISOString());
  if (dateKey === todayKey) return "Today";
  if (dateKey === yesterdayKey) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

function groupByDay(entries: StreamEntry[]): DayGroup[] {
  const map = new Map<string, StreamEntry[]>();
  for (const e of entries) {
    const key = toDateKey(e.created_at);
    const bucket = map.get(key) ?? [];
    bucket.push(e);
    map.set(key, bucket);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, es]) => ({
      dateKey,
      label: formatDayLabel(dateKey),
      entries: es,
    }));
}

type CaptureKind = "fix" | "need_more" | "remind" | "note" | "prose";

function countByKind(entries: StreamEntry[]): Record<CaptureKind, number> {
  const counts: Record<CaptureKind, number> = { fix: 0, need_more: 0, remind: 0, note: 0, prose: 0 };
  for (const e of entries) {
    if (e.entry_type === "prose") { counts.prose++; continue; }
    const k = (e.kind ?? "note") as CaptureKind;
    if (k in counts) counts[k]++;
    else counts.note++;
  }
  return counts;
}

function summaryLine(counts: Record<CaptureKind, number>): string {
  const parts: string[] = [];
  if (counts.need_more) parts.push(`${counts.need_more} need${counts.need_more > 1 ? "s" : ""}`);
  if (counts.fix) parts.push(`${counts.fix} fix${counts.fix > 1 ? "es" : ""}`);
  if (counts.remind) parts.push(`${counts.remind} reminder${counts.remind > 1 ? "s" : ""}`);
  if (counts.note) parts.push(`${counts.note} note${counts.note > 1 ? "s" : ""}`);
  if (counts.prose) parts.push(`${counts.prose} log${counts.prose > 1 ? "s" : ""}`);
  return parts.join(" · ") || "no captures";
}

// ---------------------------------------------------------------------------
// Status bar — always-current open counts
// ---------------------------------------------------------------------------

function StatusBar({
  context,
  onAction,
}: {
  context: WorkTableContext;
  onAction: (mode: ActionMode) => void;
}) {
  const groupSlug = context.kind === "group" ? context.slug : undefined;
  const { data: needData } = useHubCaptures("need_more", groupSlug);
  const { data: fixData } = useHubCaptures("fix", groupSlug);
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
    <HStack
      gap={4}
      pb={3}
      mb={3}
      borderBottom="1px solid"
      borderColor={borderColor}
      flexWrap="wrap"
    >
      {items.map((item) => (
        <Box
          key={item.mode}
          as="button"
          onClick={() => onAction(item.mode)}
          _hover={{ opacity: 0.7 }}
        >
          <Text fontSize="xs" color={mutedColor} as="span">{item.label} </Text>
          <Text fontSize="xs" fontWeight="700" color={item.color} as="span">{item.count}</Text>
        </Box>
      ))}
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// DayRow
// ---------------------------------------------------------------------------

function DayRow({
  group,
  defaultOpen,
  onAction,
}: {
  group: DayGroup;
  defaultOpen: boolean;
  onAction: (mode: ActionMode) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const counts = countByKind(group.entries);

  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const labelColor = useColorModeValue("gray.700", "gray.200");
  const actionBg = useColorModeValue("gray.50", "gray.750");
  const borderColor = useColorModeValue("gray.100", "gray.700");

  const actions: { label: string; mode: ActionMode; count: number }[] = (
    [
      { label: "Manage Needs", mode: "needs" as ActionMode, count: counts.need_more },
      { label: "Review Fixes", mode: "fixes" as ActionMode, count: counts.fix },
      { label: "Review Reminders", mode: "reminders" as ActionMode, count: counts.remind },
    ] as { label: string; mode: ActionMode; count: number }[]
  ).filter((a) => a.count > 0);

  return (
    <Box borderBottom="1px solid" borderColor={borderColor} pb={2} mb={2}>
      <HStack
        as="button"
        width="100%"
        justify="space-between"
        onClick={() => setOpen((v) => !v)}
        py={1}
        _hover={{ opacity: 0.8 }}
      >
        <Text fontSize="xs" fontWeight="700" color={labelColor}>{group.label}</Text>
        <Text fontSize="xs" color={mutedColor}>{open ? "▲" : summaryLine(counts) + " ▼"}</Text>
      </HStack>

      {open && (
        <VStack align="start" gap={1} pt={1} pl={1}>
          {counts.need_more > 0 && (
            <Text fontSize="xs" color={mutedColor}>· {counts.need_more} need{counts.need_more > 1 ? "s" : ""} added</Text>
          )}
          {counts.fix > 0 && (
            <Text fontSize="xs" color={mutedColor}>· {counts.fix} fix{counts.fix > 1 ? "es" : ""}</Text>
          )}
          {counts.remind > 0 && (
            <Text fontSize="xs" color={mutedColor}>· {counts.remind} reminder{counts.remind > 1 ? "s" : ""}</Text>
          )}
          {counts.note > 0 && (
            <Text fontSize="xs" color={mutedColor}>· {counts.note} note{counts.note > 1 ? "s" : ""}</Text>
          )}
          {counts.prose > 0 && (
            <Text fontSize="xs" color={mutedColor}>· {counts.prose} log entr{counts.prose > 1 ? "ies" : "y"}</Text>
          )}

          {actions.length > 0 && (
            <HStack gap={2} pt={1} flexWrap="wrap">
              {actions.map((a) => (
                <Box
                  key={a.mode}
                  as="button"
                  px={2}
                  py={0.5}
                  bg={actionBg}
                  borderRadius="md"
                  fontSize="10px"
                  fontWeight="600"
                  color="blue.500"
                  border="1px solid"
                  borderColor="blue.200"
                  _dark={{ borderColor: "blue.700" }}
                  _hover={{ opacity: 0.7 }}
                  onClick={(e: React.MouseEvent) => { e.stopPropagation(); onAction(a.mode); }}
                >
                  {a.label} →
                </Box>
              ))}
            </HStack>
          )}
        </VStack>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// DigestStream
// ---------------------------------------------------------------------------

function contextToParams(ctx: WorkTableContext) {
  if (ctx.kind === "personal") return { scope: "personal" as const };
  if (ctx.kind === "group") return { scope: "group" as const, group_slug: ctx.slug };
  return { scope: "initiative" as const, initiative_id: ctx.id };
}

export function DigestStream({
  context,
  onAction,
}: {
  context: WorkTableContext;
  onAction: (mode: ActionMode) => void;
}) {
  const params = contextToParams(context);
  const { entries, isLoading } = useWorktableStream(params);

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.400", "gray.500");

  if (context.kind === "initiative") {
    return <ApertureLogStream initiativeId={context.id} />;
  }

  const todayKey = toDateKey(new Date().toISOString());
  const groups = groupByDay(entries);

  return (
    <Box
      bg={cardBg}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="lg"
      p={4}
      minH="200px"
    >
      <StatusBar context={context} onAction={onAction} />

      {isLoading ? (
        <Box textAlign="center" py={4}>
          <Spinner size="sm" color="blue.500" />
        </Box>
      ) : groups.length === 0 ? (
        <Text fontSize="xs" color={mutedColor} textAlign="center" py={4}>
          No activity yet.
        </Text>
      ) : (
        groups.map((g) => (
          <DayRow
            key={g.dateKey}
            group={g}
            defaultOpen={g.dateKey === todayKey}
            onAction={onAction}
          />
        ))
      )}
    </Box>
  );
}

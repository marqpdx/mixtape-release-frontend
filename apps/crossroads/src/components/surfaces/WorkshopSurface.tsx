"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Grid,
  HStack,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkshopObjectClass =
  | "destination"
  | "live-view"
  | "routine"
  | "watch"
  | "reminder"
  | "note";

type WorkshopObject = {
  id: string;
  class: WorkshopObjectClass;
  title: string;
  subtitle?: string;
  icon: string;
  href?: string;
  addedAt: string;
  isSystemSuggested?: boolean;
};

type WorkshopLayout = {
  objects: WorkshopObject[];
  version: 1;
};

// ── UCR fixture data ───────────────────────────────────────────────────────────

const UCR_FIXTURES: Record<string, WorkshopObject[]> = {
  cto: [
    { id: "cto-1", class: "destination", title: "Active Initiatives", icon: "◈", href: "atrium", addedAt: new Date().toISOString() },
    { id: "cto-2", class: "live-view", title: "Agent Runs", icon: "⟳", subtitle: "Pending attention", addedAt: new Date().toISOString() },
    { id: "cto-3", class: "destination", title: "MB Pilot", icon: "⊞", href: "workshop", addedAt: new Date().toISOString() },
    { id: "cto-4", class: "destination", title: "Puddlejump Queue", icon: "⦿", href: "catalyst", addedAt: new Date().toISOString() },
    { id: "cto-5", class: "reminder", title: "ADR Review", icon: "◎", subtitle: "Pending ratification", addedAt: new Date().toISOString() },
    { id: "cto-6", class: "watch", title: "Deployment Health", icon: "◉", addedAt: new Date().toISOString() },
  ],
  butcher: [
    { id: "btc-1", class: "destination", title: "Holiday Orders", icon: "◈", href: "atrium", addedAt: new Date().toISOString() },
    { id: "btc-2", class: "watch", title: "Pork Belly Price Watch", icon: "◉", addedAt: new Date().toISOString() },
    { id: "btc-3", class: "routine", title: "Monday Inventory Check", icon: "⟳", addedAt: new Date().toISOString() },
    { id: "btc-4", class: "live-view", title: "Supplier Prices", icon: "⊞", addedAt: new Date().toISOString() },
    { id: "btc-5", class: "reminder", title: "Compliance Renewal", icon: "◎", addedAt: new Date().toISOString() },
  ],
  boutique: [
    { id: "bou-1", class: "destination", title: "Fall Launch", icon: "◈", href: "atrium", addedAt: new Date().toISOString() },
    { id: "bou-2", class: "live-view", title: "Today's Sales", icon: "⊞", addedAt: new Date().toISOString() },
    { id: "bou-3", class: "routine", title: "Photography Queue", icon: "⟳", addedAt: new Date().toISOString() },
    { id: "bou-4", class: "watch", title: "Competitor Scan", icon: "◉", addedAt: new Date().toISOString() },
  ],
  nonprofit: [
    { id: "npe-1", class: "destination", title: "Grant Work", icon: "◈", href: "atrium", addedAt: new Date().toISOString() },
    { id: "npe-2", class: "destination", title: "Board Packet", icon: "⦿", href: "catalyst", addedAt: new Date().toISOString() },
    { id: "npe-3", class: "watch", title: "Funder Watch", icon: "◉", addedAt: new Date().toISOString() },
    { id: "npe-4", class: "reminder", title: "Board Meeting", icon: "◎", addedAt: new Date().toISOString() },
  ],
  writer: [
    { id: "wrt-1", class: "destination", title: "Current Manuscript", icon: "◈", href: "atrium", addedAt: new Date().toISOString() },
    { id: "wrt-2", class: "destination", title: "Reading Stack", icon: "⦿", href: "catalyst", addedAt: new Date().toISOString() },
    { id: "wrt-3", class: "routine", title: "Writing Prompt", icon: "⟳", addedAt: new Date().toISOString() },
    { id: "wrt-4", class: "watch", title: "Research Feed", icon: "◉", addedAt: new Date().toISOString() },
    { id: "wrt-5", class: "reminder", title: "Submission Deadline", icon: "◎", addedAt: new Date().toISOString() },
  ],
};

const CLASS_LABELS: Record<WorkshopObjectClass, string> = {
  destination: "Destination",
  "live-view": "Live View",
  routine: "Routine",
  watch: "Watch",
  reminder: "Reminder",
  note: "Note",
};

const STORAGE_KEY = (slug: string) => `wks-layout-v1-${slug}`;

// ── Persistence helpers ────────────────────────────────────────────────────────

function loadLayout(groupSlug: string): WorkshopObject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(groupSlug));
    if (!raw) return [];
    const parsed: WorkshopLayout = JSON.parse(raw);
    return parsed.version === 1 ? parsed.objects : [];
  } catch {
    return [];
  }
}

function saveLayout(groupSlug: string, objects: WorkshopObject[]) {
  try {
    const layout: WorkshopLayout = { objects, version: 1 };
    localStorage.setItem(STORAGE_KEY(groupSlug), JSON.stringify(layout));
  } catch {
    // localStorage unavailable — silent
  }
}

// ── ObjectCard ─────────────────────────────────────────────────────────────────

function ObjectCard({
  obj,
  groupSlug,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  obj: WorkshopObject;
  groupSlug: string;
  onRemove: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const router = useRouter();
  const cardBg = useColorModeValue("white", "gray.800");
  const cardBorder = useColorModeValue("gray.200", "gray.700");
  const suggestedBorder = useColorModeValue("indigo.100", "indigo.900");
  const titleColor = useColorModeValue("gray.800", "gray.100");
  const subtitleColor = useColorModeValue("gray.400", "gray.500");
  const badgeBg = useColorModeValue("gray.100", "gray.700");
  const badgeColor = useColorModeValue("gray.500", "gray.400");
  const mutedColor = useColorModeValue("gray.300", "gray.600");

  function handlePrimary() {
    if (obj.class === "destination" && obj.href) {
      router.push(`/app/groups/${groupSlug}/${obj.href}`);
    }
  }

  return (
    <Box
      className={`wks-object wks-object-${obj.class}`}
      bg={cardBg}
      border="1px solid"
      borderColor={obj.isSystemSuggested ? suggestedBorder : cardBorder}
      borderRadius="md"
      p={4}
      display="flex"
      flexDirection="column"
      gap={3}
      position="relative"
    >
      {obj.isSystemSuggested && (
        <Box position="absolute" top={2} right={2}>
          <Text fontSize="9px" color={subtitleColor} letterSpacing="0.08em" textTransform="uppercase">suggested</Text>
        </Box>
      )}

      <HStack gap={3} align="start">
        <Text fontSize="xl" lineHeight="1" flexShrink={0} mt="1px">{obj.icon}</Text>
        <Box flex="1" minW={0}>
          <Text
            className="wks-object-title"
            fontSize="sm"
            fontWeight="600"
            color={titleColor}
            lineHeight="1.3"
            mb={obj.subtitle ? 1 : 0}
            cursor={obj.class === "destination" ? "pointer" : "default"}
            _hover={obj.class === "destination" ? { textDecoration: "underline" } : undefined}
            onClick={handlePrimary}
          >
            {obj.title}
          </Text>
          {obj.subtitle && (
            <Text fontSize="xs" color={subtitleColor}>{obj.subtitle}</Text>
          )}
          <Box
            className="wks-object-badge"
            display="inline-block"
            mt={1}
            px={2}
            py="1px"
            bg={badgeBg}
            borderRadius="sm"
          >
            <Text fontSize="10px" color={badgeColor} letterSpacing="0.06em" textTransform="uppercase">
              {CLASS_LABELS[obj.class]}
            </Text>
          </Box>
        </Box>
      </HStack>

      <HStack gap={1} justify="flex-end">
        <Button size="xs" variant="ghost" color={mutedColor} disabled={isFirst} onClick={() => onMoveUp(obj.id)} aria-label="Move up">↑</Button>
        <Button size="xs" variant="ghost" color={mutedColor} disabled={isLast} onClick={() => onMoveDown(obj.id)} aria-label="Move down">↓</Button>
        <Button size="xs" variant="ghost" color={mutedColor} onClick={() => onRemove(obj.id)} aria-label="Remove">✕</Button>
      </HStack>
    </Box>
  );
}

// ── Add-object picker ──────────────────────────────────────────────────────────

const NEW_OBJECT_TEMPLATES: Omit<WorkshopObject, "id" | "addedAt">[] = [
  { class: "destination", title: "Atrium", icon: "◈", href: "atrium" },
  { class: "destination", title: "Catalyst", icon: "⦿", href: "catalyst" },
  { class: "destination", title: "Reception", icon: "↓", href: "reception" },
  { class: "routine", title: "Morning Arrival", icon: "⟳" },
  { class: "routine", title: "Evening Close", icon: "⟳" },
  { class: "watch", title: "New Watch", icon: "◉" },
  { class: "reminder", title: "New Reminder", icon: "◎" },
  { class: "note", title: "Local Note", icon: "·" },
];

function AddObjectPanel({ onAdd, onClose }: { onAdd: (obj: WorkshopObject) => void; onClose: () => void }) {
  const [customTitle, setCustomTitle] = useState("");
  const panelBg = useColorModeValue("white", "gray.800");
  const panelBorder = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  function addTemplate(tmpl: typeof NEW_OBJECT_TEMPLATES[0]) {
    onAdd({ ...tmpl, id: crypto.randomUUID(), addedAt: new Date().toISOString() });
    onClose();
  }

  function addCustom() {
    if (!customTitle.trim()) return;
    onAdd({ id: crypto.randomUUID(), class: "note", title: customTitle.trim(), icon: "·", addedAt: new Date().toISOString() });
    setCustomTitle("");
    onClose();
  }

  return (
    <Box
      className="wks-add-panel"
      bg={panelBg}
      border="1px solid"
      borderColor={panelBorder}
      borderRadius="md"
      p={4}
      mb={6}
    >
      <Text fontSize="xs" fontWeight="600" color={mutedColor} letterSpacing="0.1em" textTransform="uppercase" mb={3}>
        Add Object
      </Text>
      <VStack gap={1} align="stretch" mb={4}>
        {NEW_OBJECT_TEMPLATES.map((tmpl) => (
          <Button
            key={`${tmpl.class}-${tmpl.title}`}
            size="sm"
            variant="ghost"
            justifyContent="flex-start"
            fontWeight="400"
            onClick={() => addTemplate(tmpl)}
          >
            <Text mr={2}>{tmpl.icon}</Text>
            {tmpl.title}
            <Text ml="auto" fontSize="xs" color={mutedColor}>{CLASS_LABELS[tmpl.class]}</Text>
          </Button>
        ))}
      </VStack>
      <HStack gap={2}>
        <Input
          size="sm"
          placeholder="Custom title…"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addCustom(); }}
        />
        <Button size="sm" variant="outline" onClick={addCustom} disabled={!customTitle.trim()}>Add</Button>
        <Button size="sm" variant="ghost" color={mutedColor} onClick={onClose}>Cancel</Button>
      </HStack>
    </Box>
  );
}

// ── Clio panel (right zone) ────────────────────────────────────────────────────

export function WorkshopClioPanel() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const responseBg = useColorModeValue("gray.50", "gray.850");
  const responseBorder = useColorModeValue("gray.100", "gray.700");

  function handleQuery() {
    if (!query.trim()) return;
    setResponse("Clio integration is not yet active. This is a pilot placeholder.");
    setQuery("");
  }

  return (
    <VStack className="wks-clio-panel" gap={3} p={4} align="stretch">
      <Text fontSize="xs" fontWeight="600" letterSpacing="0.1em" textTransform="uppercase" color={mutedColor}>
        Clio
      </Text>
      {response && (
        <Box bg={responseBg} border="1px solid" borderColor={responseBorder} borderRadius="md" p={3}>
          <Text fontSize="xs" color={mutedColor}>{response}</Text>
        </Box>
      )}
      <HStack gap={2}>
        <Input
          size="sm"
          placeholder="Ask Clio…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleQuery(); }}
        />
        <Button size="sm" variant="outline" onClick={handleQuery} disabled={!query.trim()}>→</Button>
      </HStack>
    </VStack>
  );
}

// ── UCR fixture selector ───────────────────────────────────────────────────────

function FixtureSelector({ onLoad }: { onLoad: (ucr: string) => void }) {
  const mutedColor = useColorModeValue("gray.400", "gray.500");
  const ucrs = [
    { id: "cto", label: "CTO / Builder" },
    { id: "butcher", label: "Butcher" },
    { id: "boutique", label: "Boutique" },
    { id: "nonprofit", label: "Nonprofit ED" },
    { id: "writer", label: "Writer" },
  ];
  return (
    <HStack gap={2} flexWrap="wrap">
      <Text fontSize="xs" color={mutedColor}>Load UCR fixtures:</Text>
      {ucrs.map((u) => (
        <Button key={u.id} size="xs" variant="outline" onClick={() => onLoad(u.id)}>
          {u.label}
        </Button>
      ))}
    </HStack>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function WorkshopSurface({ groupSlug }: { groupSlug: string }) {
  const [objects, setObjects] = useState<WorkshopObject[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const bg = useColorModeValue("gray.50", "gray.950");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const emptyColor = useColorModeValue("gray.300", "gray.600");

  // Load from localStorage on mount (group-scoped)
  useEffect(() => {
    setObjects(loadLayout(groupSlug));
    setLoaded(true);
  }, [groupSlug]);

  // Persist whenever objects change (after initial load)
  useEffect(() => {
    if (loaded) saveLayout(groupSlug, objects);
  }, [objects, groupSlug, loaded]);

  const addObject = useCallback((obj: WorkshopObject) => {
    setObjects((prev) => [...prev, obj]);
  }, []);

  const removeObject = useCallback((id: string) => {
    setObjects((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const moveUp = useCallback((id: string) => {
    setObjects((prev) => {
      const idx = prev.findIndex((o) => o.id === id);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveDown = useCallback((id: string) => {
    setObjects((prev) => {
      const idx = prev.findIndex((o) => o.id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  function loadFixtures(ucr: string) {
    const fixtures = UCR_FIXTURES[ucr] ?? [];
    setObjects(fixtures.map((f) => ({ ...f, addedAt: new Date().toISOString() })));
  }

  if (!loaded) return null;

  return (
    <Box className="wks-surface" bg={bg} flex="1" px={{ base: 5, md: 8 }} py={6}>
      <VStack className="wks-surface-inner" gap={6} align="stretch" maxW="900px">

        {/* Toolbar */}
        <HStack className="wks-toolbar" justify="space-between" flexWrap="wrap" gap={3}>
          <FixtureSelector onLoad={loadFixtures} />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowAdd((v) => !v)}
          >
            {showAdd ? "Cancel" : "+ Add object"}
          </Button>
        </HStack>

        {/* Add panel */}
        {showAdd && (
          <AddObjectPanel
            onAdd={(obj) => { addObject(obj); setShowAdd(false); }}
            onClose={() => setShowAdd(false)}
          />
        )}

        {/* Object grid */}
        {objects.length === 0 ? (
          <Box py={12} textAlign="center">
            <Text fontSize="sm" color={emptyColor}>
              Your Workshop is empty. Add objects or load a UCR fixture set.
            </Text>
          </Box>
        ) : (
          <Grid
            className="wks-grid"
            templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
            gap={4}
          >
            {objects.map((obj, idx) => (
              <ObjectCard
                key={obj.id}
                obj={obj}
                groupSlug={groupSlug}
                onRemove={removeObject}
                onMoveUp={moveUp}
                onMoveDown={moveDown}
                isFirst={idx === 0}
                isLast={idx === objects.length - 1}
              />
            ))}
          </Grid>
        )}

        {/* Pilot note */}
        <Text fontSize="xs" color={labelColor}>
          Layout is stored locally in this browser. Backend persistence is pending (ADR open question 11).
        </Text>

      </VStack>
    </Box>
  );
}

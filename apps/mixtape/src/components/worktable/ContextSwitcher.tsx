"use client";

// ContextSwitcher — Personal pill + up to 3 recent group pills + typeahead search.
// Recent group slugs are persisted in localStorage (separate key from active slug).

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, HStack, Input, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useUserGroups } from "@mixtape/api/hooks/groups/useGroups";
import type { Group } from "@mixtape/core/types/groupTypes";
import type { WorkTableContext } from "./types";

// ---------------------------------------------------------------------------
// Emblem color — deterministic from slug
// ---------------------------------------------------------------------------

const EMBLEM_COLORS = [
  "#0E5AA7", "#2E7D52", "#8A6B00", "#6B3FA0",
  "#C0392B", "#1A6B85", "#7D4E2E", "#3D5A80",
];

function slugColor(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EMBLEM_COLORS[Math.abs(hash) % EMBLEM_COLORS.length];
}

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

const ACTIVE_KEY = (u: string) => `mixtape.web.worktable.contextSlug.${u}`;
const RECENTS_KEY = (u: string) => `mixtape.web.worktable.recentSlugs.${u}`;
const INITIATIVE_KEY = (u: string) => `mixtape.web.worktable.initiative.${u}`;

function saveActive(username: string, slug: string) {
  try { localStorage.setItem(ACTIVE_KEY(username), slug); } catch {}
}
function loadActive(username: string): string | null {
  try { return localStorage.getItem(ACTIVE_KEY(username)); } catch { return null; }
}
function loadRecents(username: string): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY(username));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}
function pushRecent(username: string, slug: string) {
  try {
    const next = [slug, ...loadRecents(username).filter(s => s !== slug)].slice(0, 3);
    localStorage.setItem(RECENTS_KEY(username), JSON.stringify(next));
  } catch {}
}
type SavedInitiative = { id: string; title: string; sponsor: "personal" | "group" };
function saveInitiative(username: string, ctx: SavedInitiative) {
  try { localStorage.setItem(INITIATIVE_KEY(username), JSON.stringify(ctx)); } catch {}
}
function clearInitiative(username: string) {
  try { localStorage.removeItem(INITIATIVE_KEY(username)); } catch {}
}
function loadInitiative(username: string): SavedInitiative | null {
  try {
    const raw = localStorage.getItem(INITIATIVE_KEY(username));
    return raw ? (JSON.parse(raw) as SavedInitiative) : null;
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// ContextChip
// ---------------------------------------------------------------------------

function ContextChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  const inactiveBg = useColorModeValue("white", "gray.800");
  const inactiveBorder = useColorModeValue("gray.200", "gray.600");
  const inactiveText = useColorModeValue("gray.600", "gray.300");
  const activeColor = color ?? "#0E5AA7";

  return (
    <Box
      as="button"
      onClick={onClick}
      px={3}
      py={1.5}
      borderRadius="full"
      border="1.5px solid"
      fontSize="xs"
      fontWeight="700"
      whiteSpace="nowrap"
      flexShrink={0}
      transition="all 0.15s"
      bg={active ? activeColor : inactiveBg}
      borderColor={active ? activeColor : inactiveBorder}
      color={active ? "white" : inactiveText}
      _hover={{ opacity: 0.8 }}
    >
      {label}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// GroupTypeahead
// ---------------------------------------------------------------------------

function GroupTypeahead({
  groups,
  onSelect,
}: {
  groups: Group[];
  onSelect: (g: Group) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputBg = useColorModeValue("white", "gray.800");
  const inputBorder = useColorModeValue("gray.200", "gray.600");
  const dropdownBg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const placeholderColor = useColorModeValue("gray.400", "gray.500");

  const filtered = query.trim()
    ? groups.filter(g => g.title.toLowerCase().includes(query.toLowerCase()))
    : groups;

  return (
    <Box position="relative" flexShrink={0}>
      <Input
        size="xs"
        placeholder="find group…"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        borderRadius="full"
        fontSize="xs"
        w="110px"
        bg={inputBg}
        borderColor={inputBorder}
        color={textColor}
        _placeholder={{ color: placeholderColor }}
        px={3}
        h="28px"
      />
      {open && filtered.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          zIndex={200}
          bg={dropdownBg}
          border="1px solid"
          borderColor={inputBorder}
          borderRadius="md"
          mt={1}
          maxH="200px"
          overflowY="auto"
          minW="160px"
          shadow="md"
        >
          {filtered.map(g => (
            <Box
              key={g.slug}
              px={3}
              py={1.5}
              fontSize="xs"
              color={textColor}
              cursor="pointer"
              _hover={{ bg: hoverBg }}
              onMouseDown={() => { onSelect(g); setQuery(""); setOpen(false); }}
            >
              {g.title}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// ContextSwitcher
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// InitiativeChip — shown when context.kind === "initiative"
// ---------------------------------------------------------------------------

const INITIATIVE_COLOR = "#0D7377";

function InitiativeChip({
  title,
  onDismiss,
}: {
  title: string;
  onDismiss: () => void;
}) {
  return (
    <Box
      display="inline-flex"
      alignItems="center"
      gap={1.5}
      px={3}
      py={1.5}
      borderRadius="full"
      border="1.5px solid"
      fontSize="xs"
      fontWeight="700"
      whiteSpace="nowrap"
      flexShrink={0}
      bg={INITIATIVE_COLOR}
      borderColor={INITIATIVE_COLOR}
      color="white"
    >
      <Box as="span" opacity={0.75} fontSize="10px">initiative</Box>
      <Box as="span">{title}</Box>
      <Box
        as="button"
        ml={1}
        opacity={0.7}
        _hover={{ opacity: 1 }}
        onClick={onDismiss}
        lineHeight={1}
        aria-label="Return to personal context"
      >
        ×
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// ContextSwitcher
// ---------------------------------------------------------------------------

export function ContextSwitcher({
  context,
  username,
  onSelect,
}: {
  context: WorkTableContext;
  username: string;
  onSelect: (ctx: WorkTableContext) => void;
}) {
  const { groups } = useUserGroups();
  const labelColor = useColorModeValue("gray.500", "gray.400");

  const [recentSlugs, setRecentSlugs] = useState<string[]>([]);
  const initiativeRestoredRef = useRef(false);

  // Load recents from localStorage once groups are available
  useEffect(() => {
    if (!username || groups.length === 0) return;
    setRecentSlugs(loadRecents(username));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length > 0]);

  // Restore initiative context on mount (before groups load)
  useEffect(() => {
    if (!username) return;
    const saved = loadInitiative(username);
    if (saved) {
      initiativeRestoredRef.current = true;
      onSelect({ kind: "initiative", id: saved.id, title: saved.title, sponsor: saved.sponsor });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  // Restore last active group context on mount — skipped if initiative was restored
  useEffect(() => {
    if (!username || groups.length === 0) return;
    if (initiativeRestoredRef.current) return;
    const saved = loadActive(username);
    if (!saved || saved === "__personal__") return;
    const match = groups.find(g => g.slug === saved);
    if (match) {
      onSelect({
        kind: "group",
        id: match.id,
        slug: match.slug,
        title: match.title,
        color: slugColor(match.slug),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length > 0]);

  // Save initiative context whenever it becomes active
  useEffect(() => {
    if (context.kind === "initiative") {
      saveInitiative(username, { id: context.id, title: context.title, sponsor: context.sponsor });
    }
  }, [context, username]);

  const activeSlug =
    context.kind === "group" ? context.slug : "__personal__";

  const handleGroupSelect = (g: Group) => {
    onSelect({ kind: "group", id: g.id, slug: g.slug, title: g.title, color: slugColor(g.slug) });
    saveActive(username, g.slug);
    pushRecent(username, g.slug);
    setRecentSlugs(loadRecents(username));
    clearInitiative(username);
    initiativeRestoredRef.current = false;
  };

  const handlePersonal = () => {
    onSelect({ kind: "personal" });
    saveActive(username, "__personal__");
    clearInitiative(username);
    initiativeRestoredRef.current = false;
  };

  // Build the up-to-3 recent group chips
  const recentGroups = recentSlugs
    .map(slug => groups.find(g => g.slug === slug))
    .filter((g): g is Group => g !== undefined);

  // Groups not shown as pills (for typeahead)
  const recentSlugSet = new Set(recentSlugs);
  const remainingGroups = groups.filter(g => !recentSlugSet.has(g.slug));

  // In initiative context: show initiative chip + Personal; hide group chips
  const isInitiativeCtx = context.kind === "initiative";

  return (
    <Box mb={3}>
      <HStack gap={3} flexWrap="nowrap" alignItems="center">
        <Text
          fontSize="xs"
          fontWeight="700"
          color={labelColor}
          letterSpacing="widest"
          textTransform="uppercase"
          flexShrink={0}
        >
          Context
        </Text>
        {isInitiativeCtx ? (
          <>
            <InitiativeChip
              title={context.title}
              onDismiss={handlePersonal}
            />
            <Box
              as="button"
              fontSize="xs"
              color={labelColor}
              _hover={{ opacity: 0.7 }}
              onClick={handlePersonal}
              flexShrink={0}
            >
              Personal
            </Box>
          </>
        ) : (
          <>
            <motion.div layout="position" style={{ flexShrink: 0 }}>
              <ContextChip
                label="Personal"
                active={activeSlug === "__personal__"}
                onClick={handlePersonal}
              />
            </motion.div>
            <AnimatePresence mode="popLayout">
              {recentGroups.map(g => (
                <motion.div
                  key={g.slug}
                  layout="position"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{ flexShrink: 0 }}
                >
                  <ContextChip
                    label={g.title}
                    active={activeSlug === g.slug}
                    color={slugColor(g.slug)}
                    onClick={() => handleGroupSelect(g)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {groups.length > 0 && (
              <GroupTypeahead
                groups={remainingGroups.length > 0 ? remainingGroups : groups}
                onSelect={handleGroupSelect}
              />
            )}
          </>
        )}
      </HStack>
    </Box>
  );

}

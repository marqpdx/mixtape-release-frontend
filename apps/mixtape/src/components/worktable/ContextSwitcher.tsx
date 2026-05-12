"use client";

// ContextSwitcher — Personal pill + up to 3 recent group pills + typeahead search.
// Recent group slugs are persisted in localStorage (separate key from active slug).

import { useEffect, useState } from "react";
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

  // Load recents from localStorage once groups are available
  useEffect(() => {
    if (!username || groups.length === 0) return;
    setRecentSlugs(loadRecents(username));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length > 0]);

  // Restore last active context on mount
  useEffect(() => {
    if (!username || groups.length === 0) return;
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

  const activeSlug =
    context.kind === "group" ? context.slug : "__personal__";

  const handleGroupSelect = (g: Group) => {
    onSelect({ kind: "group", id: g.id, slug: g.slug, title: g.title, color: slugColor(g.slug) });
    saveActive(username, g.slug);
    pushRecent(username, g.slug);
    setRecentSlugs(loadRecents(username));
  };

  const handlePersonal = () => {
    onSelect({ kind: "personal" });
    saveActive(username, "__personal__");
  };

  // Build the up-to-3 recent group chips
  const recentGroups = recentSlugs
    .map(slug => groups.find(g => g.slug === slug))
    .filter((g): g is Group => g !== undefined);

  // Groups not shown as pills (for typeahead)
  const recentSlugSet = new Set(recentSlugs);
  const remainingGroups = groups.filter(g => !recentSlugSet.has(g.slug));

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
        <ContextChip
          label="Personal"
          active={activeSlug === "__personal__"}
          onClick={handlePersonal}
        />
        {recentGroups.map(g => (
          <ContextChip
            key={g.slug}
            label={g.title}
            active={activeSlug === g.slug}
            color={slugColor(g.slug)}
            onClick={() => handleGroupSelect(g)}
          />
        ))}
        {groups.length > 0 && (
          <GroupTypeahead
            groups={remainingGroups.length > 0 ? remainingGroups : groups}
            onSelect={handleGroupSelect}
          />
        )}
      </HStack>
    </Box>
  );

}

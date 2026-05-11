"use client";

// ContextSwitcher — horizontal chip row for switching WorkTable scope.
// Matches the mobile OpsScreen group selector pattern.
// Persists last selection to localStorage per user.

import { useEffect } from "react";
import { Box, HStack, Text } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useUserGroups } from "@mixtape/api/hooks/groups/useGroups";
import type { WorkTableContext } from "./types";

// ---------------------------------------------------------------------------
// Emblem color — deterministic from slug (same algorithm as mobile)
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
// LocalStorage persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = (username: string) =>
  `mixtape.web.worktable.contextSlug.${username}`;

function saveSlug(username: string, slug: string) {
  try {
    localStorage.setItem(STORAGE_KEY(username), slug);
  } catch {}
}

function loadSlug(username: string): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY(username));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Chip component
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
// Main component
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

  const activeSlug =
    context.kind === "personal"
      ? "__personal__"
      : context.kind === "group"
      ? context.slug
      : "__personal__";

  // Restore last selection on mount
  useEffect(() => {
    if (!username || groups.length === 0) return;
    const saved = loadSlug(username);
    if (!saved || saved === "__personal__") return;
    const match = groups.find((g) => g.slug === saved);
    if (match) {
      onSelect({
        kind: "group",
        id: match.id,
        slug: match.slug,
        title: match.title,
        color: slugColor(match.slug),
      });
    }
  // Only run once after groups load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups.length > 0]);

  const handleSelect = (ctx: WorkTableContext) => {
    onSelect(ctx);
    const slug = ctx.kind === "group" ? ctx.slug : "__personal__";
    saveSlug(username, slug);
  };

  return (
    <Box mb={3}>
      <Text
        fontSize="10px"
        fontWeight="700"
        color={labelColor}
        letterSpacing="widest"
        textTransform="uppercase"
        mb={2}
      >
        Context
      </Text>
      <HStack gap={2} overflowX="auto" pb={1}
        css={{ scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}
      >
        <ContextChip
          label="Personal"
          active={activeSlug === "__personal__"}
          onClick={() => handleSelect({ kind: "personal" })}
        />
        {groups.map((g) => (
          <ContextChip
            key={g.slug}
            label={g.title}
            active={activeSlug === g.slug}
            color={slugColor(g.slug)}
            onClick={() =>
              handleSelect({
                kind: "group",
                id: g.id,
                slug: g.slug,
                title: g.title,
                color: slugColor(g.slug),
              })
            }
          />
        ))}
      </HStack>
    </Box>
  );
}

// apps/mixtape/src/components/common/ThemeSelector.tsx

"use client";

import React from "react";
import { ThemeSelector as BaseThemeSelector, type ThemeDefinition } from "@mixtape/core";
import { usePathname } from "next/navigation";
import { themes as baseThemes } from "@/theme/themes";
import { useGroupThemeSettings } from "@mixtape/api/hooks/appearance";
import { useTheme } from "@/contexts/ThemeContext";
import { HStack } from "@chakra-ui/react";

const LAST_GROUP_SLUG_KEY = "mixtape-last-group-slug";

function getGroupSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/groups\/([^/]+)/);
  return match ? match[1] : null;
}

function isThemeColors(value: unknown): value is ThemeDefinition["light"] {
  if (!value || typeof value !== "object") return false;
  const colors = value as Record<string, unknown>;
  return (
    typeof colors.bg === "string" &&
    (typeof colors.bgSecondary === "string" || typeof colors.bgSecondary === "undefined") &&
    typeof colors.surface === "string" &&
    typeof colors.accent === "string" &&
    typeof colors.text === "string" &&
    typeof colors.textSecondary === "string" &&
    typeof colors.border === "string"
  );
}

function isThemeDefinition(value: unknown): value is ThemeDefinition {
  if (!value || typeof value !== "object") return false;
  const theme = value as Record<string, unknown>;
  return (
    typeof theme.id === "string" &&
    typeof theme.name === "string" &&
    isThemeColors(theme.light) &&
    isThemeColors(theme.dark) &&
    (typeof theme.lightHighContrast === "undefined" || isThemeColors(theme.lightHighContrast)) &&
    (typeof theme.darkHighContrast === "undefined" || isThemeColors(theme.darkHighContrast))
  );
}

function buildAvailableThemes(
  hiddenThemeIds: string[],
  groupThemes: ThemeDefinition[]
): ThemeDefinition[] {
  const hidden = new Set(hiddenThemeIds);
  const combined = [...baseThemes, ...groupThemes];
  return combined.filter((theme) => !hidden.has(theme.id));
}

export function ThemeSelector() {
  const pathname = usePathname();
  const groupSlug = React.useMemo(() => getGroupSlugFromPath(pathname), [pathname]);
  const [storedGroupSlug, setStoredGroupSlug] = React.useState<string | null>(null);
  const themeContext = useTheme();
  // const usingStoredGroup = !groupSlug && !!storedGroupSlug;

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(LAST_GROUP_SLUG_KEY);
    if (saved) {
      setStoredGroupSlug(saved);
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined" || !groupSlug) return;
    window.localStorage.setItem(LAST_GROUP_SLUG_KEY, groupSlug);
    setStoredGroupSlug(groupSlug);
  }, [groupSlug]);

  const effectiveGroupSlug = groupSlug ?? storedGroupSlug;
  const { data } = useGroupThemeSettings(effectiveGroupSlug);

  const availableThemes = React.useMemo(() => {
    if (!effectiveGroupSlug) {
      return baseThemes;
    }
    const hiddenThemeIds = data?.hidden_theme_ids ?? [];
    const groupThemes = (data?.group_themes ?? []).filter(isThemeDefinition);
    return buildAvailableThemes(hiddenThemeIds, groupThemes);
  }, [data?.group_themes, data?.hidden_theme_ids, effectiveGroupSlug]);

  React.useEffect(() => {
    if (!themeContext) return;
    themeContext.setAvailableThemes(availableThemes);
  }, [availableThemes, themeContext]);

  return (
    <HStack gap={2} align="center">
      <BaseThemeSelector />
    </HStack>
  );
}

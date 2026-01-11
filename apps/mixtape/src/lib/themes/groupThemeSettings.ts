// apps/mixtape/src/lib/themes/groupThemeSettings.ts

import type { Theme } from "@/theme/themes";

export interface GroupThemeSettings {
  hiddenThemeIds: string[];
  groupThemes: Theme[];
}

const defaultSettings: GroupThemeSettings = {
  hiddenThemeIds: [],
  groupThemes: [],
};

function getStorageKey(groupId: string | number) {
  return `group-theme-settings:${groupId}`;
}

export function loadGroupThemeSettings(groupId: string | number): GroupThemeSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  const stored = localStorage.getItem(getStorageKey(groupId));
  if (!stored) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(stored) as GroupThemeSettings;
    if (!parsed || typeof parsed !== "object") {
      return defaultSettings;
    }
    return {
      hiddenThemeIds: Array.isArray(parsed.hiddenThemeIds) ? parsed.hiddenThemeIds : [],
      groupThemes: Array.isArray(parsed.groupThemes) ? parsed.groupThemes : [],
    };
  } catch (error) {
    console.warn("Failed to parse group theme settings", error);
    return defaultSettings;
  }
}

export function saveGroupThemeSettings(
  groupId: string | number,
  settings: GroupThemeSettings
): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(getStorageKey(groupId), JSON.stringify(settings));
}

export function createGroupThemeId(groupId: string | number, name: string): string {
  const slugBase = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const timestamp = Date.now().toString(36);
  return `group-${groupId}-${slugBase || "theme"}-${timestamp}`;
}

export function upsertGroupTheme(
  settings: GroupThemeSettings,
  theme: Theme
): GroupThemeSettings {
  const existingIndex = settings.groupThemes.findIndex((item) => item.id === theme.id);
  if (existingIndex === -1) {
    return {
      ...settings,
      groupThemes: [...settings.groupThemes, theme],
    };
  }

  const nextThemes = [...settings.groupThemes];
  nextThemes[existingIndex] = theme;
  return {
    ...settings,
    groupThemes: nextThemes,
  };
}

export function removeGroupTheme(
  settings: GroupThemeSettings,
  themeId: string
): GroupThemeSettings {
  return {
    ...settings,
    groupThemes: settings.groupThemes.filter((theme) => theme.id !== themeId),
    hiddenThemeIds: settings.hiddenThemeIds.filter((id) => id !== themeId),
  };
}

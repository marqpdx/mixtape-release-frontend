// /src/contexts/ThemeContext.tsx
"use client";

import * as React from "react";
import {
  ThemeProvider as BaseThemeProvider,
  useTheme as useBaseTheme,
  type ColorMode,
  type ContrastMode,
  type FontScale,
  type ThemeColors,
  type ThemeDefinition,
} from "@mixtape/core";
import { themes } from "../theme/themes";

export type { ColorMode, ContrastMode, FontScale, ThemeColors, ThemeDefinition };
export const useTheme = useBaseTheme;

export const CROSSROADS_FONT_STORAGE_KEY = "crossroads-font-family";

export const CROSSROADS_FONT_OPTIONS = [
  { label: "Nunito Sans", family: "var(--font-nunito-sans)" },
  { label: "Figtree", family: "var(--font-figtree)" },
  { label: "Sora", family: "var(--font-sora)" },
  { label: "Quicksand", family: "var(--font-quicksand)" },
  { label: "Manrope", family: "var(--font-manrope)" },
  { label: "Alegreya Sans", family: "var(--font-alegreya-sans)" },
] as const;

const DEFAULT_FONT_FAMILY = CROSSROADS_FONT_OPTIONS[5].family;

const isValidFontFamily = (value: string | null): value is (typeof CROSSROADS_FONT_OPTIONS)[number]["family"] =>
  !!value && CROSSROADS_FONT_OPTIONS.some((option) => option.family === value);

export const applyCrossroadsFontFamily = (family: string) => {
  if (typeof window === "undefined") return;
  document.documentElement.style.setProperty("--crossroads-font-family", family);
  window.localStorage.setItem(CROSSROADS_FONT_STORAGE_KEY, family);
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(CROSSROADS_FONT_STORAGE_KEY);
    applyCrossroadsFontFamily(isValidFontFamily(stored) ? stored : DEFAULT_FONT_FAMILY);
  }, []);

  return (
    <BaseThemeProvider
      themes={themes}
      defaultThemeId="gallery"
      storageKeyPrefix="crossroads"
    >
      {children}
    </BaseThemeProvider>
  );
}

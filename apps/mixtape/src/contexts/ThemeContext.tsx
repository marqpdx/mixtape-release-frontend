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

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <BaseThemeProvider
      themes={themes}
      defaultThemeId="gallery"
      storageKeyPrefix="mixtape"
    >
      {children}
    </BaseThemeProvider>
  );
}

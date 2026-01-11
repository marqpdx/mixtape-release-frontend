// packages/core/src/theme/theme-context.tsx
"use client";

import * as React from "react";
import { useColorMode } from "./color-mode";

export type ContrastMode = "normal" | "high";
export type FontScale = 0.875 | 1 | 1.125 | 1.25 | 1.5;
export type ColorMode = "light" | "dark";

export interface ThemeColors {
  bg: string;
  bgSecondary?: string;
  surface: string;
  accent: string;
  text: string;
  textSecondary: string;
  border: string;
}

export interface ThemeDefinition {
  name: string;
  id: string;
  light: ThemeColors;
  dark: ThemeColors;
  lightHighContrast?: ThemeColors;
  darkHighContrast?: ThemeColors;
}

export interface ThemeContextValue {
  currentTheme: ThemeDefinition;
  colorMode: ColorMode;
  contrastMode: ContrastMode;
  fontScale: FontScale;
  reducedMotion: boolean;
  setTheme: (themeId: string) => void;
  toggleColorMode: () => void;
  setContrastMode: (mode: ContrastMode) => void;
  setFontScale: (scale: FontScale) => void;
  setReducedMotion: (enabled: boolean) => void;
  setAvailableThemes: (themes: ThemeDefinition[]) => void;
  availableThemes: ThemeDefinition[];
  isLoaded: boolean;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    return null;
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  themes: ThemeDefinition[];
  defaultThemeId?: string;
  storageKeyPrefix?: string;
}

const fallbackTheme: ThemeDefinition = {
  id: "default",
  name: "Default",
  light: {
    bg: "#FFFFFF",
    surface: "#FFFFFF",
    accent: "#3182CE",
    text: "#1A202C",
    textSecondary: "#4A5568",
    border: "#E2E8F0",
  },
  dark: {
    bg: "#1A202C",
    surface: "#2D3748",
    accent: "#63B3ED",
    text: "#F7FAFC",
    textSecondary: "#CBD5E0",
    border: "#4A5568",
  },
};

export function ThemeProvider({
  children,
  themes,
  defaultThemeId,
  storageKeyPrefix = "mixtape",
}: ThemeProviderProps) {
  const colorModeHook = useColorMode();
  const initialThemeId = defaultThemeId || themes[0]?.id || fallbackTheme.id;
  const [currentThemeId, setCurrentThemeId] = React.useState(initialThemeId);
  const [availableThemes, setAvailableThemes] = React.useState<ThemeDefinition[]>(themes);
  const [contrastMode, setContrastModeState] = React.useState<ContrastMode>("normal");
  const [fontScale, setFontScaleState] = React.useState<FontScale>(1);
  const [reducedMotion, setReducedMotionState] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const storageKeys = React.useMemo(
    () => ({
      theme: `${storageKeyPrefix}-theme`,
      contrast: `${storageKeyPrefix}-contrast`,
      fontScale: `${storageKeyPrefix}-font-scale`,
    }),
    [storageKeyPrefix]
  );

  const colorMode = colorModeHook?.colorMode || "light";
  const toggleColorMode = colorModeHook?.toggleColorMode || (() => {});

  const currentTheme =
    availableThemes.find((theme) => theme.id === currentThemeId) ||
    availableThemes[0] ||
    fallbackTheme;

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const savedTheme = localStorage.getItem(storageKeys.theme);
    const savedContrast = localStorage.getItem(storageKeys.contrast) as ContrastMode | null;
    const savedFontScale = localStorage.getItem(storageKeys.fontScale);

    if (savedTheme && themes.find((theme) => theme.id === savedTheme)) {
      setCurrentThemeId(savedTheme);
    }
    if (savedContrast === "high") {
      setContrastModeState("high");
    }
    if (savedFontScale) {
      const scale = parseFloat(savedFontScale) as FontScale;
      if ([0.875, 1, 1.125, 1.25, 1.5].includes(scale)) {
        setFontScaleState(scale);
      }
    }

    setIsLoaded(true);
    setAvailableThemes(themes);
  }, [storageKeys, themes]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const contrastQuery = window.matchMedia("(prefers-contrast: high)");
    if (contrastQuery.matches && !localStorage.getItem(storageKeys.contrast)) {
      setContrastModeState("high");
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotionState(motionQuery.matches);

    const handleMotionChange = (event: MediaQueryListEvent) => setReducedMotionState(event.matches);
    motionQuery.addEventListener("change", handleMotionChange);

    return () => motionQuery.removeEventListener("change", handleMotionChange);
  }, [storageKeys.contrast]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const theme =
      availableThemes.find((t) => t.id === currentThemeId) ||
      availableThemes[0] ||
      fallbackTheme;

    let colors: ThemeColors;
    if (contrastMode === "high") {
      const highContrastKey = colorMode === "light" ? "lightHighContrast" : "darkHighContrast";
      colors = theme[highContrastKey] || theme[colorMode];
    } else {
      colors = theme[colorMode];
    }

    const root = document.documentElement;
    const bgSecondary =
      colors.bgSecondary ??
      `color-mix(in srgb, ${colors.bg} 70%, ${colors.surface} 30%)`;

    root.style.setProperty("--theme-bg", colors.bg);
    root.style.setProperty("--theme-bg-secondary", bgSecondary);
    root.style.setProperty("--theme-surface", colors.surface);
    root.style.setProperty("--theme-accent", colors.accent);
    root.style.setProperty("--theme-text", colors.text);
    root.style.setProperty("--theme-text-secondary", colors.textSecondary);
    root.style.setProperty("--theme-border", colors.border);

    const transitionDuration = reducedMotion ? "0s" : "0.3s";
    document.body.style.setProperty("background-color", colors.bg);
    document.body.style.setProperty("color", colors.text);
    document.body.style.setProperty(
      "transition",
      `background-color ${transitionDuration} ease, color ${transitionDuration} ease`
    );
  }, [currentThemeId, colorMode, contrastMode, reducedMotion, availableThemes]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    document.documentElement.style.setProperty("--font-scale", fontScale.toString());
  }, [fontScale]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const duration = reducedMotion ? "0ms" : "200ms";
    document.documentElement.style.setProperty("--transition-duration", duration);
  }, [reducedMotion]);

  const setTheme = (themeId: string) => {
    setCurrentThemeId(themeId);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKeys.theme, themeId);
    }
  };

  const setAvailableThemesList = (nextThemes: ThemeDefinition[]) => {
    setAvailableThemes(nextThemes);
    if (!nextThemes.find((theme) => theme.id === currentThemeId) && nextThemes[0]) {
      setCurrentThemeId(nextThemes[0].id);
    }
  };

  const setContrastMode = (mode: ContrastMode) => {
    setContrastModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKeys.contrast, mode);
    }
  };

  const setFontScale = (scale: FontScale) => {
    setFontScaleState(scale);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKeys.fontScale, scale.toString());
    }
  };

  const setReducedMotion = (enabled: boolean) => {
    setReducedMotionState(enabled);
  };

  const value: ThemeContextValue = {
    currentTheme,
    colorMode: colorMode as ColorMode,
    contrastMode,
    fontScale,
    reducedMotion,
    setTheme,
    toggleColorMode,
    setContrastMode,
    setFontScale,
    setReducedMotion,
    availableThemes,
    isLoaded,
    setAvailableThemes: setAvailableThemesList,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

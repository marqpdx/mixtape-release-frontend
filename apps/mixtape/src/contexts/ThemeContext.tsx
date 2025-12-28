// /src/contexts/ThemeContext.tsx

"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorMode } from '@components/ui/color-mode';
import { themes, Theme, ColorMode } from '../theme/themes';

export type ContrastMode = 'normal' | 'high';
export type FontScale = 0.875 | 1 | 1.125 | 1.25 | 1.5;

interface ThemeContextType {
  currentTheme: Theme;
  colorMode: ColorMode;
  contrastMode: ContrastMode;
  fontScale: FontScale;
  reducedMotion: boolean;
  setTheme: (themeId: string) => void;
  toggleColorMode: () => void;
  setContrastMode: (mode: ContrastMode) => void;
  setFontScale: (scale: FontScale) => void;
  setReducedMotion: (enabled: boolean) => void;
  availableThemes: Theme[];
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return null instead of throwing error for better SSR handling
    return null;
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colorModeHook = useColorMode();
  const [currentThemeId, setCurrentThemeId] = useState('gallery');
  const [contrastMode, setContrastModeState] = useState<ContrastMode>('normal');
  const [fontScale, setFontScaleState] = useState<FontScale>(1);
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Safe access to colorMode with fallback
  const colorMode = colorModeHook?.colorMode || 'light';
  const toggleColorMode = colorModeHook?.toggleColorMode || (() => {});

  const currentTheme = themes.find(t => t.id === currentThemeId) || themes[0];

  // Load saved preferences from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedTheme = localStorage.getItem('crossroads-theme');
    const savedContrast = localStorage.getItem('crossroads-contrast') as ContrastMode;
    const savedFontScale = localStorage.getItem('crossroads-font-scale');

    if (savedTheme && themes.find(t => t.id === savedTheme)) {
      setCurrentThemeId(savedTheme);
    }
    if (savedContrast === 'high') {
      setContrastModeState('high');
    }
    if (savedFontScale) {
      const scale = parseFloat(savedFontScale) as FontScale;
      if ([0.875, 1, 1.125, 1.25, 1.5].includes(scale)) {
        setFontScaleState(scale);
      }
    }

    setIsLoaded(true);
  }, []);

  // Detect system preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // High contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    if (contrastQuery.matches && !localStorage.getItem('crossroads-contrast')) {
      setContrastModeState('high');
    }

    // Reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotionState(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotionState(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => motionQuery.removeEventListener('change', handleMotionChange);
  }, []);

  // Inject CSS custom properties when theme, color mode, or contrast changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const theme = themes.find(t => t.id === currentThemeId) || themes[0];

    // Select colors based on contrast mode
    let colors;
    if (contrastMode === 'high') {
      const highContrastKey = colorMode === 'light' ? 'lightHighContrast' : 'darkHighContrast';
      colors = theme[highContrastKey] || theme[colorMode as 'light' | 'dark'];
    } else {
      colors = theme[colorMode as 'light' | 'dark'];
    }

    const root = document.documentElement;

    // Set CSS custom properties for theme colors
    root.style.setProperty('--theme-bg', colors.bg);
    root.style.setProperty('--theme-surface', colors.surface);
    root.style.setProperty('--theme-accent', colors.accent);
    root.style.setProperty('--theme-text', colors.text);
    root.style.setProperty('--theme-text-secondary', colors.textSecondary);
    root.style.setProperty('--theme-border', colors.border);

    // Also update body styles for immediate visual feedback
    const transitionDuration = reducedMotion ? '0s' : '0.3s';
    document.body.style.setProperty('background-color', colors.bg);
    document.body.style.setProperty('color', colors.text);
    document.body.style.setProperty('transition', `background-color ${transitionDuration} ease, color ${transitionDuration} ease`);
  }, [currentThemeId, colorMode, contrastMode, reducedMotion]);

  // Inject font scale CSS variable
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.style.setProperty('--font-scale', fontScale.toString());
  }, [fontScale]);

  // Inject motion preference CSS variable
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const duration = reducedMotion ? '0ms' : '200ms';
    document.documentElement.style.setProperty('--transition-duration', duration);
  }, [reducedMotion]);

  const setTheme = (themeId: string) => {
    setCurrentThemeId(themeId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crossroads-theme', themeId);
    }
  };

  const setContrastMode = (mode: ContrastMode) => {
    setContrastModeState(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crossroads-contrast', mode);
    }
  };

  const setFontScale = (scale: FontScale) => {
    setFontScaleState(scale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('crossroads-font-scale', scale.toString());
    }
  };

  const setReducedMotion = (enabled: boolean) => {
    setReducedMotionState(enabled);
  };

  const value: ThemeContextType = {
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
    availableThemes: themes,
    isLoaded,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
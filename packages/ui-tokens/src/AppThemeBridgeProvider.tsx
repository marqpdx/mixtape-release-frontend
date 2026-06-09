// TS-2 — injects app-theme-derived base CSS vars on the wrapped element.
// See decisions/theme-system-adr/theme-system-adr.md AD-1 and AD-3.
"use client";

import * as React from 'react';
import { useTheme } from '@mixtape/core';
import { appThemeToBaseVars } from './app-theme-bridge';
import type { ThemeColors } from './themes';

interface AppThemeBridgeProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AppThemeBridgeProvider({ children, style, ...rest }: AppThemeBridgeProviderProps) {
  const theme = useTheme();

  const baseVars = React.useMemo(() => {
    if (!theme) return {};
    const { currentTheme, colorMode, contrastMode } = theme;
    let colors: ThemeColors;
    if (contrastMode === 'high') {
      const key = colorMode === 'light' ? 'lightHighContrast' : 'darkHighContrast';
      colors = (currentTheme[key] ?? currentTheme[colorMode]) as ThemeColors;
    } else {
      colors = currentTheme[colorMode] as ThemeColors;
    }
    return appThemeToBaseVars(colors, colorMode);
  }, [theme]);

  return (
    <div style={{ ...baseVars, ...style } as React.CSSProperties} {...rest}>
      {children}
    </div>
  );
}

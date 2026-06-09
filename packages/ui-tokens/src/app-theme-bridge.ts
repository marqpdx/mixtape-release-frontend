// TS-1 — maps active app theme colors to the five surface theme base CSS vars
// See decisions/theme-system-adr/theme-system-adr.md for token ownership table.

import type { ThemeColors, ColorMode } from './themes';

export interface BaseSurfaceVars {
  '--bg': string;
  '--surface': string;
  '--ink': string;
  '--ink-soft': string;
  '--rule': string;
}

export function appThemeToBaseVars(colors: ThemeColors, _mode: ColorMode): BaseSurfaceVars {
  return {
    '--bg':       colors.bg,
    '--surface':  colors.surface,
    '--ink':      colors.text,
    '--ink-soft': colors.textSecondary,
    '--rule':     colors.border,
  };
}

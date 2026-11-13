// Approved colour roles: handoff-2026-11-13-abe-colour-tokens-stage-two.md.
// One source for the root provider, tenant palette CSS and both Chakra systems.
import type { ColorMode, ThemeColors } from './themes';

export type SemanticContrastMode = 'normal' | 'high';

const statusPalette = {
  danger: { light: ['#991B1B', '#FEF2F2'], dark: ['#FECACA', '#450A0A'], lightHC: '#7F1D1D', darkHC: '#FECACA' },
  success: { light: ['#166534', '#F0FDF4'], dark: ['#BBF7D0', '#052E16'], lightHC: '#14532D', darkHC: '#BBF7D0' },
  warning: { light: ['#854D0E', '#FFFBEB'], dark: ['#FDE68A', '#422006'], lightHC: '#713F12', darkHC: '#FDE68A' },
  info: { light: ['#1E40AF', '#EFF6FF'], dark: ['#BFDBFE', '#172554'], lightHC: '#1E3A8A', darkHC: '#BFDBFE' },
} as const;

export function getSemanticThemeVars(
  colors: ThemeColors,
  mode: ColorMode,
  contrast: SemanticContrastMode,
): Record<string, string> {
  const high = contrast === 'high';
  const dark = mode === 'dark';
  const mix = (percent: number) => `color-mix(in srgb, ${colors.text} ${percent}%, ${colors.bg} ${100 - percent}%)`;
  const vars: Record<string, string> = {
    '--theme-text-muted': high ? colors.text : mix(85),
    // Quieter than secondary copy, but still readable; never an input's only label.
    '--theme-text-placeholder': high ? colors.text : mix(75),
    '--ui-surface-subtle': high ? colors.bg : mix(dark ? 6 : 4),
    '--ui-border-control': mix(high ? 85 : 70),
    // Normal-mode subtle borders are decorative, never a control's only boundary.
    '--ui-border-subtle': mix(high ? 85 : 15),
    '--ui-overlay-scrim': `rgba(0,0,0,${high ? '.85' : dark ? '.70' : '.60'})`,
    '--ui-shadow-raised': high ? 'none' : `0 1px 3px rgba(0,0,0,${dark ? '.40' : '.12'})`,
  };
  for (const [tone, palette] of Object.entries(statusPalette)) {
    vars[`--status-${tone}-fg`] = high ? palette[dark ? 'darkHC' : 'lightHC'] : palette[mode][0];
    vars[`--status-${tone}-bg`] = high ? dark ? '#000000' : '#FFFFFF' : palette[mode][1];
  }
  return vars;
}

export function semanticThemeDeclarations(colors: ThemeColors, mode: ColorMode, contrast: SemanticContrastMode): string {
  return Object.entries(getSemanticThemeVars(colors, mode, contrast))
    .map(([name, value]) => `${name}: ${value};`).join('\n');
}

export const semanticColorTokens = {
  'theme.textPlaceholder': { value: 'var(--theme-text-placeholder)' },
  'ui.surfaceSubtle': { value: 'var(--ui-surface-subtle)' },
  'ui.borderControl': { value: 'var(--ui-border-control)' },
  'ui.borderSubtle': { value: 'var(--ui-border-subtle)' },
  'ui.overlayScrim': { value: 'var(--ui-overlay-scrim)' },
  ...Object.fromEntries(Object.keys(statusPalette).flatMap(tone => ['fg', 'bg'].map(role => [
    `status.${tone}.${role}`, { value: `var(--status-${tone}-${role})` },
  ]))),
};

export const semanticShadowTokens = {
  'ui.shadowRaised': { value: 'var(--ui-shadow-raised)' },
};

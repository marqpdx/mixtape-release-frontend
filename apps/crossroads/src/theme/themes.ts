// apps/crossroads/src/theme/themes.ts

import { themes as baseThemes } from "@mixtape/ui-tokens";
import type { Theme } from "@mixtape/ui-tokens";

const clamp = (value: number) => Math.max(0, Math.min(255, value));

const adjustHex = (hex: string, amount: number) => {
  if (!/^#([0-9a-fA-F]{6})$/.test(hex)) {
    return hex;
  }
  const raw = hex.slice(1);
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);

  const adjustChannel = (channel: number) =>
    amount >= 0
      ? channel + (255 - channel) * amount
      : channel * (1 + amount);

  const next = [
    clamp(Math.round(adjustChannel(r))),
    clamp(Math.round(adjustChannel(g))),
    clamp(Math.round(adjustChannel(b))),
  ];

  return `#${next
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;
};

const darkenText = (hex: string) => adjustHex(hex, -0.12);
const lightenText = (hex: string) => adjustHex(hex, 0.12);

export const themes: Theme[] = baseThemes.map((theme) => ({
  ...theme,
  light: {
    ...theme.light,
    text: darkenText(theme.light.text),
    textSecondary: darkenText(theme.light.textSecondary),
  },
  dark: {
    ...theme.dark,
    text: lightenText(theme.dark.text),
    textSecondary: lightenText(theme.dark.textSecondary),
  },
}));

export type { Theme, ThemeColors, ColorMode } from "@mixtape/ui-tokens";

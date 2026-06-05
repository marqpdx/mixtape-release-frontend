// Cover gradient system — deterministic, brand-derived, not semantic.
// Hues anchored to brand.main1 (teal ~202), brand.center (yellow-green ~93), brand.main3 (terracotta ~40).

export const COVER_HUES = [202, 168, 133, 93, 56, 30, 10, 340, 270, 230];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function hueForName(name: string, override?: number): number {
  return override ?? COVER_HUES[hashStr(name) % COVER_HUES.length];
}

export function coverGradient(hue: number): string {
  return `linear-gradient(135deg, oklch(0.64 0.105 ${hue}), oklch(0.75 0.085 ${hue + 22}))`;
}

export function coverGradientSoft(hue: number): string {
  return `linear-gradient(135deg, oklch(0.93 0.04 ${hue}), oklch(0.96 0.03 ${hue + 22}))`;
}

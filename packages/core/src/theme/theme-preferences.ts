export type StoredContrastMode = "normal" | "high";
export type StoredFontScale = 0.875 | 1 | 1.125 | 1.25 | 1.5;

export interface StoredThemePreferences {
  contrastMode: StoredContrastMode | null;
  fontScale: StoredFontScale | null;
}

const VALID_FONT_SCALES: readonly StoredFontScale[] = [0.875, 1, 1.125, 1.25, 1.5];

export function getThemePreferenceStorageKeys(prefix: string) {
  return {
    theme: `${prefix}-theme`,
    contrast: `${prefix}-contrast`,
    fontScale: `${prefix}-font-scale`,
  } as const;
}

export function parseStoredContrastMode(value: string | null): StoredContrastMode | null {
  return value === "normal" || value === "high" ? value : null;
}

export function parseStoredFontScale(value: string | null): StoredFontScale | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value);
  return VALID_FONT_SCALES.includes(parsed as StoredFontScale)
    ? (parsed as StoredFontScale)
    : null;
}

export function readStoredThemePreferences(
  storage: Pick<Storage, "getItem">,
  prefix: string,
): StoredThemePreferences {
  const keys = getThemePreferenceStorageKeys(prefix);
  return {
    contrastMode: parseStoredContrastMode(storage.getItem(keys.contrast)),
    fontScale: parseStoredFontScale(storage.getItem(keys.fontScale)),
  };
}

export function applyThemePreferences(
  root: HTMLElement,
  preferences: StoredThemePreferences,
): void {
  const fontScale = preferences.fontScale ?? 1;
  root.style.setProperty("--font-scale", fontScale.toString());
  root.style.fontSize = `${fontScale * 100}%`;
  root.classList.toggle("high-contrast", preferences.contrastMode === "high");
}

export function getThemePreferenceBootstrapScript(prefix: string): string {
  const keys = getThemePreferenceStorageKeys(prefix);
  const validScales = JSON.stringify(VALID_FONT_SCALES);

  return `
    (function () {
      try {
        var root = document.documentElement;
        var scales = ${validScales};
        var rawScale = window.localStorage.getItem(${JSON.stringify(keys.fontScale)});
        var parsedScale = rawScale === null ? 1 : Number.parseFloat(rawScale);
        var scale = scales.indexOf(parsedScale) >= 0 ? parsedScale : 1;
        var savedContrast = window.localStorage.getItem(${JSON.stringify(keys.contrast)});
        var highContrast = savedContrast === "high" ||
          (savedContrast === null && window.matchMedia("(prefers-contrast: high)").matches);

        root.style.setProperty("--font-scale", String(scale));
        root.style.fontSize = String(scale * 100) + "%";
        root.classList.toggle("high-contrast", highContrast);
      } catch (_) {}
    })();
  `;
}

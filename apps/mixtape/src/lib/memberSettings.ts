export const PREF_AUTO_LOAD_MIC = "mixtape-pref-auto-load-mic";

export function getBooleanPreference(key: string, defaultValue = false): boolean {
  if (typeof window === "undefined") return defaultValue;
  const saved = window.localStorage.getItem(key);
  if (saved === null) return defaultValue;
  return saved === "true";
}

export function setBooleanPreference(key: string, value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(value));
}

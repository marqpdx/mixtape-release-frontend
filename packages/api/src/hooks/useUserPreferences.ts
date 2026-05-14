// packages/api/src/hooks/useUserPreferences.ts

import { useCallback, useEffect, useState } from "react";
import { axiosInstance } from "../lib/axiosInstance";

export type UserPreferences = {
  remember_last_work_area?: boolean;
  [key: string]: unknown;
};

const LS_KEY = "userPrefs";

function loadLocalPrefs(): UserPreferences {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as UserPreferences) : {};
  } catch {
    return {};
  }
}

function saveLocalPrefs(prefs: UserPreferences) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY, JSON.stringify(prefs));
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(loadLocalPrefs);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch from backend on mount and merge into local state
  useEffect(() => {
    axiosInstance
      .get<UserPreferences>("/api/members/me/preferences")
      .then((res) => {
        const merged = { ...loadLocalPrefs(), ...res.data };
        setPreferences(merged);
        saveLocalPrefs(merged);
      })
      .catch(() => {
        // Offline or not authenticated — keep whatever is in localStorage
      })
      .finally(() => setIsLoading(false));
  }, []);

  const updatePreference = useCallback(
    async (key: string, value: unknown) => {
      const next = { ...preferences, [key]: value };
      setPreferences(next);
      saveLocalPrefs(next);
      try {
        await axiosInstance.patch("/api/members/me/preferences", { [key]: value });
      } catch {
        // Non-fatal — local state is already updated
      }
    },
    [preferences]
  );

  return { preferences, isLoading, updatePreference };
}

/** Synchronous read of a preference from localStorage — for use in useState initializers. */
export function readPreferenceSync<T>(key: string, fallback: T): T {
  const prefs = loadLocalPrefs();
  return key in prefs ? (prefs[key] as T) : fallback;
}

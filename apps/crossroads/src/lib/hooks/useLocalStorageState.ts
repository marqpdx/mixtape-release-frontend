"use client";

import { useState, useEffect } from "react";

/**
 * SSR-safe localStorage state hook.
 * Returns [value, setValue, hydrated] — hydrated is false on first render
 * (server), true after the localStorage value has been read on the client.
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
): readonly [T, (value: T) => void, boolean] {
  const [state, setState] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) setState(JSON.parse(item));
    } catch {
      // ignore
    }
    setHydrated(true);
  }, [key]);

  const setValue = (value: T) => {
    setState(value);
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  };

  return [state, setValue, hydrated] as const;
}

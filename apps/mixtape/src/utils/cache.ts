// src/utils/cache.ts

// export const setCache = (key: string, value: any, ttl: number) => {
export const setCache = <T>(key: string, value: T, ttl: number): void => {
  const now = Date.now();
  const item = {
    value,
    expiry: now + ttl,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(item));
  }
};

export const getCache = <T>(key: string): T | null => {
  if (typeof window === "undefined") return null;

  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  try {
    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value as T;
  } catch {
    return null;
  }
};


/**
 * Safely retrieves a value from localStorage in a client-side environment.
 */
export const safeGetLocalStorage = (key: string): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem(key);
  }
  return null;
};

/**
 * Safely sets a value in localStorage in a client-side environment.
 */
// export const safeSetLocalStorage = (key: string, value: any): void => {
export const safeSetLocalStorage = <T>(key: string, value: T): void => {

  if (typeof window !== "undefined") {
    localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
  }
};

/**
 * Safely removes a value from localStorage in a client-side environment.
 */
export const safeRemoveLocalStorage = (key: string) => {
  if (typeof window !== "undefined") {
    console.log(`[SafeRemove] Removing key: ${key}`);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`[SafeRemove] Error removing key: ${key}`, error);
    }
  }
};
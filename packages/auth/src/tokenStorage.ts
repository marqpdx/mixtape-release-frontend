// src/providers/auth-provider/tokenStorage.ts

/**
 * In-memory token storage (XSS-safe)
 *
 * Access tokens are stored in memory only, NOT in localStorage.
 * This prevents XSS attacks from stealing tokens.
 *
 * On page refresh, tokens are lost - this is GOOD for security.
 * The axios interceptor will detect 401 errors and automatically
 * refresh using the httpOnly refresh token cookie.
 */

let accessTokenCache: string | null = null;
let accessTokenExpiry: number | null = null;

/**
 * Store access token in memory (NOT localStorage)
 * @param token - JWT access token
 * @param expiryTimestamp - Expiry time in milliseconds (NOT seconds)
 */
export const setAccessToken = (token: string, expiryTimestamp: number) => {
  accessTokenCache = token;
  accessTokenExpiry = expiryTimestamp;
};

/**
 * Get access token from memory if still valid
 * @returns Access token or null if expired/missing
 */
export const getAccessToken = (): string | null => {
  if (!accessTokenCache || !accessTokenExpiry) {
    return null;
  }

  // Check expiry with 30-second buffer
  const bufferMs = 30 * 1000;
  if (Date.now() >= accessTokenExpiry - bufferMs) {
    clearAccessToken();
    return null;
  }

  return accessTokenCache;
};

/**
 * Clear access token from memory
 */
export const clearAccessToken = () => {
  accessTokenCache = null;
  accessTokenExpiry = null;
};

/**
 * Check if access token is valid
 */
export const isTokenValid = (): boolean => {
  return getAccessToken() !== null;
};

/**
 * Get token expiry timestamp
 */
export const getTokenExpiry = (): number | null => {
  return accessTokenExpiry;
};

// src/lib/auth/api.ts

/**
 * Authentication API
 *
 * IMPORTANT: This file uses fetch() instead of axiosInstance by design.
 * Reason: This module manages the authentication flow that initializes axiosInstance.
 * Using axiosInstance here would create a circular dependency. The token refresh logic
 * includes rate limiting and must run before axiosInstance's auth interceptors are ready.
 */

import { AuthResponse, LoginCredentials, RegisterData, UserIdentity, PermissionsData } from '@mixtape/core/types/auth';
import { getAccessToken, setAccessToken, clearAccessToken } from '@mixtape/auth/tokenStorage';
import { checkRateLimit, recordSuccess } from '@mixtape/auth/rateLimiter';
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

const API_BASE = process.env.NEXT_PUBLIC_ROOT_API_URL;

const LOGIN_URL = `${API_BASE}/api/auth/token`;
const REFRESH_URL = `${API_BASE}/api/auth/token/refresh`;
const LOGOUT_URL = `${API_BASE}/api/auth/logout`;
const ME_URL = `${API_BASE}/api/auth/me`;
const ASSUME_URL = `${API_BASE}/api/auth/assume`;
const ASSUME_EXIT_URL = `${API_BASE}/api/auth/assume/exit`;
const REGISTER_URL = `${API_BASE}/api/auth/register`;
const ACCEPT_INVITE_URL = `${API_BASE}/api/auth/accept-invite`;
const CSRF_URL = `${API_BASE}/api/csrf/`;
const PERMISSIONS_REFRESH_URL = `${API_BASE}/api/auth/permissions/refresh`;
const PASSWORD_RESET_URL = `${API_BASE}/api/auth/password-reset`;
const PASSWORD_RESET_CONFIRM_URL = `${API_BASE}/api/auth/password-reset/confirm`;

function logAuthDebug(message: string, extra?: Record<string, unknown>): void {
  console.log('[AuthApi]', message, extra || {});
}

function normalizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    value: String(error),
  };
}

async function probeAuthNetwork(label: string): Promise<void> {
  try {
    logAuthDebug(`Probe start: ${label}`, {
      url: CSRF_URL,
    });

    const response = await fetch(CSRF_URL, {
      method: 'GET',
      credentials: 'include',
    });

    logAuthDebug(`Probe response: ${label}`, {
      ok: response.ok,
      status: response.status,
      url: CSRF_URL,
    });
  } catch (error) {
    logAuthDebug(`Probe failed: ${label}`, {
      url: CSRF_URL,
      error: normalizeError(error),
    });
  }
}

/**
 * CSRF Token Management
 */
let csrfToken: string | null = null;

/**
 * Best-effort refresh cookie clear.
 * Useful when a stale httpOnly refresh cookie keeps auth flow in a bad state.
 */
async function clearRefreshCookieBestEffort(): Promise<void> {
  try {
    logAuthDebug('Clearing refresh cookie before login', {
      url: LOGOUT_URL,
      hasCsrfToken: !!csrfToken,
      apiBase: API_BASE,
    });
    await fetch(LOGOUT_URL, {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
    });
    logAuthDebug('Refresh cookie clear completed', {
      url: LOGOUT_URL,
    });
  } catch (error) {
    logAuthDebug('Refresh cookie clear failed (ignored)', {
      url: LOGOUT_URL,
      error: normalizeError(error),
    });
    // Ignore: this is cleanup-only.
  }
}

/**
 * Get current CSRF token
 */
export function getCsrfToken(): string | null {
  return csrfToken;
}

/**
 * Initialize CSRF protection
 * Fetches CSRF token from backend and stores it for future requests
 * Should be called once on app initialization
 */
export async function initializeCsrf(): Promise<void> {
  try {
    logAuthDebug('Initializing CSRF token', {
      url: CSRF_URL,
      apiBase: API_BASE,
    });
    const response = await fetch(CSRF_URL, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      console.warn('Failed to fetch CSRF token:', response.status);
      return;
    }

    const data = await response.json();

    if (data.csrfToken) {
      csrfToken = data.csrfToken;
      logAuthDebug('CSRF token initialized', {
        hasCsrfToken: true,
      });
    }
  } catch (error) {
    console.error('Error initializing CSRF protection:', error);
  }
}

/**
 * Get headers with CSRF token included
 */
function getHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additionalHeaders,
  };

  // Add CSRF token if available
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }

  return headers;
}

/**
 * Login with username/email and password
 * Stores access token in memory, refresh token managed by httpOnly cookie
 */
export async function login(credentials: LoginCredentials): Promise<UserIdentity> {
  logAuthDebug('Login start', {
    apiBase: API_BASE,
    loginUrl: LOGIN_URL,
    logoutUrl: LOGOUT_URL,
    identifier: credentials.identifier,
    hasCsrfToken: !!csrfToken,
  });

  await probeAuthNetwork('before-login');

  // Check rate limit
  const rateLimitCheck = checkRateLimit('login');
  if (!rateLimitCheck.isAllowed) {
    throw new Error(rateLimitCheck.message || 'Too many login attempts');
  }

  // Defensive cleanup: if a stale refresh cookie exists, clear it before new login.
  // This prevents bad-state loops after server restarts/token invalidation.
  await clearRefreshCookieBestEffort();

  logAuthDebug('Submitting login request', {
    url: LOGIN_URL,
    hasCsrfToken: !!csrfToken,
  });
  let response: Response;

  try {
    response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: getHeaders(), // Includes CSRF token if available
      credentials: 'include', // Critical: enables httpOnly cookie
      body: JSON.stringify({
        identifier: credentials.identifier,
        password: credentials.password,
      }),
    });
  } catch (error) {
    logAuthDebug('Login request threw before response', {
      url: LOGIN_URL,
      error: normalizeError(error),
    });
    throw error;
  }

  logAuthDebug('Login response received', {
    ok: response.ok,
    status: response.status,
    url: LOGIN_URL,
  });
  const data: AuthResponse = await response.json();

  if (!response.ok || !data.success) {
    logAuthDebug('Login response rejected', {
      ok: response.ok,
      status: response.status,
      success: data.success,
      detail: data.detail,
    });
    throw new Error(data.detail || 'Login failed');
  }

  if (!data.access || !data.access_expires) {
    throw new Error('Invalid token response from server');
  }

  // Store access token in memory (NOT localStorage)
  const expiresAt = data.access_expires * 1000; // Convert to milliseconds
  setAccessToken(data.access, expiresAt);
  logAuthDebug('Access token stored', {
    expiresAt,
  });

  // Record successful login (resets rate limit)
  recordSuccess('login');

  // Fetch and return full user identity
  logAuthDebug('Fetching user identity after login', {
    url: ME_URL,
  });
  return await fetchUserIdentity(data.access);
}

/**
 * Register a new user account
 */
export async function register(data: RegisterData): Promise<void> {
  // Check rate limit
  const rateLimitCheck = checkRateLimit('register');
  if (!rateLimitCheck.isAllowed) {
    throw new Error(rateLimitCheck.message || 'Too many registration attempts');
  }

  const response = await fetch(REGISTER_URL, {
    method: 'POST',
    headers: getHeaders(), // Includes CSRF token if available
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.detail || 'Registration failed');
  }

  // Record successful registration (resets rate limit)
  recordSuccess('register');
}

/**
 * Singleton pattern for refresh token to prevent race conditions
 * If multiple requests fail with 401 simultaneously, only one refresh call is made
 */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh access token using httpOnly refresh cookie
 * Uses singleton pattern to prevent concurrent refresh requests
 */
export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {

      const headers = getHeaders();
      delete (headers as any)["Authorization"];

      const response = await fetch(REFRESH_URL, {
        method: "POST",
        headers: headers,
        credentials: "include",
      });

      let data: AuthResponse | null = null;

      try {
        data = await response.json();
      } catch {
        // Non-JSON response; treat as failure
        console.warn("Token refresh returned non-JSON response");
      }

      // Normalize null → {} so we can safely access fields
      const safeData: AuthResponse & { code?: string } = (data || {}) as any;

      if (!response.ok || !safeData.success) {
        const code = safeData.code || "unknown";

        if (code !== "no_refresh_cookie") {
          console.warn("Token refresh failed:", code);
        }

        // Treat all non-success refresh results as terminal
        if (
          [
            "user_not_found",
            "no_refresh_cookie",
            "invalid_refresh_token",
            "user_inactive",
            "token_error",
          ].includes(code)
        ) {
          clearAccessToken();
          await clearRefreshCookieBestEffort();
        }

        return null;
      }

      if (!safeData.access || !safeData.access_expires) {
        console.warn("Token refresh response missing access or access_expires");
        clearAccessToken();
        return null;
      }

      const expiresAt = safeData.access_expires * 1000;
      setAccessToken(safeData.access, expiresAt);

      return safeData.access;
    } catch (error) {
      console.error("Network error during token refresh:", error);
      // On pure network errors, it’s reasonable NOT to clear tokens:
      // user might just be offline.
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Fetch current user identity using access token
 */
export async function fetchUserIdentity(token?: string): Promise<UserIdentity> {
  const accessToken = token || getAccessToken();

  if (!accessToken) {
    throw new Error('No access token available');
  }

  logAuthDebug('Fetching user identity', {
    url: ME_URL,
    usedProvidedToken: !!token,
  });
  const response = await fetch(ME_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });

  logAuthDebug('User identity response received', {
    ok: response.ok,
    status: response.status,
    url: ME_URL,
  });
  if (!response.ok) {
    if (response.status === 401) {
      clearAccessToken();
    }
    throw new Error(`Failed to fetch user identity: ${response.status}`);
  }

  const userData: UserIdentity = await response.json();

  return userData;
}

/**
 * Logout user - clears httpOnly cookie and local tokens
 */
export async function logout(): Promise<void> {
  try {
    // Call backend to clear httpOnly cookie
    await fetch(LOGOUT_URL, {
      method: 'POST',
      headers: getHeaders(), // Includes CSRF token if available
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error calling logout endpoint:', error);
  } finally {
    // Always clear local tokens
    clearAccessToken();

    // 🔥 Clear axios default Authorization header for safety
    delete axiosInstance.defaults.headers.common["Authorization"];

    csrfToken = null; // Clear CSRF token on logout
  }
}

/**
 * Check if user has a valid session
 * Attempts token refresh if access token is missing
 */
export async function checkAuth(): Promise<UserIdentity | null> {
  try {
    // Check if we have an access token in memory
    let accessToken = getAccessToken();

    // If no token, try to refresh from httpOnly cookie
    if (!accessToken) {
      accessToken = await refreshAccessToken();

      if (!accessToken) {
        return null;
      }
    }

    // Fetch user identity with valid token
    return await fetchUserIdentity(accessToken);

  } catch (error) {
    console.error('Auth check failed:', error);
    return null;
  }
}

/**
 * Refresh user permissions
 * Fetches fresh permissions from backend and clears identity cache
 */
export async function refreshPermissions(): Promise<PermissionsData> {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch(PERMISSIONS_REFRESH_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAccessToken();
    }
    throw new Error(`Failed to refresh permissions: ${response.status}`);
  }

  const permissions: PermissionsData = await response.json();

  return permissions;
}

export function applyAuthResponseToSession(data: AuthResponse): void {
  if (!data.access || !data.access_expires) {
    throw new Error("Invalid token response from server");
  }

  const expiresAt = data.access_expires * 1000;
  setAccessToken(data.access, expiresAt);
}

export async function activateInviteSession(data: AuthResponse): Promise<UserIdentity> {
  applyAuthResponseToSession(data);
  return fetchUserIdentity(data.access);
}

export async function acceptInvite(payload: {
  shortcode: string;
  username?: string;
  password?: string;
}): Promise<AuthResponse & {
  user_was_new?: boolean;
  group?: {
    id: string;
    title: string;
    slug: string;
    profile_image_url?: string | null;
  };
}> {
  const response = await fetch(ACCEPT_INVITE_URL, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.detail || data.error || "Could not accept invitation.");
  }

  return data;
}

export async function assumeUser(username: string): Promise<UserIdentity> {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("No access token available");

  const response = await fetch(ASSUME_URL, {
    method: "POST",
    headers: {
      ...getHeaders(),
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
    body: JSON.stringify({ username }),
  });

  const data = (await response.json()) as AuthResponse & { detail?: string };
  if (!response.ok || !data.success) {
    throw new Error(data.detail || "Assume user failed");
  }

  applyAuthResponseToSession(data);
  return fetchUserIdentity(data.access);
}

export async function exitAssumeUser(): Promise<UserIdentity> {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("No access token available");

  const response = await fetch(ASSUME_EXIT_URL, {
    method: "POST",
    headers: {
      ...getHeaders(),
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  const data = (await response.json()) as AuthResponse & { detail?: string };
  if (!response.ok || !data.success) {
    throw new Error(data.detail || "Exit assume failed");
  }

  applyAuthResponseToSession(data);
  return fetchUserIdentity(data.access);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const response = await fetch(PASSWORD_RESET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const data = (await response.json()) as { detail?: string };
    throw new Error(data.detail || "Failed to send reset link.");
  }
}

export async function confirmPasswordReset(
  uid: string,
  token: string,
  newPassword: string
): Promise<void> {
  const response = await fetch(PASSWORD_RESET_CONFIRM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, token, new_password: newPassword }),
  });

  const data = (await response.json()) as { detail?: string };
  if (!response.ok) {
    throw new Error(data.detail || "Failed to reset password.");
  }
}

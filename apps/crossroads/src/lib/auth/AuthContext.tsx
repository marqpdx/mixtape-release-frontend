// apps/crossroads/src/lib/auth/AuthContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { UserIdentity, LoginCredentials } from '@mixtape/core/types/auth';
import * as authApi from '@mixtape/api/clients/auth/api';
import { setAccessToken } from '@mixtape/auth/tokenStorage';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: UserIdentity | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
  assumeUser: (username: string) => Promise<void>;
  exitAssumeUser: () => Promise<void>;
  can: (permission: string) => boolean;
  canInGroup: (permission: string, groupSlug: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const safeRedirect = (value: string | null, fallback?: string) => {
  // Default fallback is My Crossroads — caller should provide username-based path
  const effectiveFallback = fallback || "/";
  // allow only same-site paths
  if (!value) return effectiveFallback;
  try {
    // absolute URL? reject
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return effectiveFallback;
    return url.pathname + url.search + url.hash;
  } catch {
    // relative path is fine if it starts with /
    return value.startsWith("/") ? value : effectiveFallback;
  }
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize CSRF and check authentication status on mount
  useEffect(() => {
    // Catalyst activation handoff: access token delivered via URL hash (#at=<token>&exp=<unix_secs>).
    // Needed in dev because Chrome treats localhost as a public suffix — Domain=.localhost cookies
    // don't propagate from localhost:3011 to *.localhost:3010. Production subdomains work via
    // normal cookie domain sharing and this branch is never reached there.
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#at=')) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      const token = params.get('at') ? decodeURIComponent(params.get('at')!) : null;
      const expSec = params.get('exp');
      const expiresAt = expSec && parseInt(expSec) > 0
        ? parseInt(expSec) * 1000
        : Date.now() + 8 * 60 * 60 * 1000;
      if (token) {
        setAccessToken(token, expiresAt);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }

    // Initialize CSRF protection
    authApi.initializeCsrf();

    // Skip auth check if this is a logout redirect (cookies being deleted)
    // Check both current URL and window.location for the logout flag
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('logout') === 'true') {
        console.log('[AuthContext] Skipping auth check - logout in progress');
        setIsLoading(false);
        return;
      }
    }

    // Check auth status
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const userData = await authApi.checkAuth();
      setUser(userData);
    } catch {
      // Silent fail - user just not authenticated
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      console.log('[AuthContext] Login started');
      const userData = await authApi.login(credentials);
      console.log('[AuthContext] Login successful, setting user:', userData.email);
      setUser(userData);
      console.log('[AuthContext] User state updated');
      // Note: Redirect is handled by the calling component
    } catch (error) {
      console.error('[AuthContext] Login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      setUser(null);
      router.push('/app/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear user state even if API call fails
      setUser(null);
      router.push('/app/login');
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authApi.fetchUserIdentity();
      setUser(userData);
    } catch {
      setUser(null);
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    try {
      const permissions = await authApi.refreshPermissions();
      // Update user with new permissions
      setUser(prevUser => {
        if (!prevUser) return null;
        return {
          ...prevUser,
          permissions
        };
      });
    } catch (error) {
      console.error('Failed to refresh permissions:', error);
    }
  }, []);

  const assumeUser = useCallback(async (username: string) => {
    const identity = await authApi.assumeUser(username);
    setUser(identity);
  }, []);

  const exitAssumeUser = useCallback(async () => {
    const identity = await authApi.exitAssumeUser();
    setUser(identity);
  }, []);

  /**
   * Check if user has a permission globally (across all groups)
   */
  const can = useCallback((permission: string): boolean => {
    if (!user?.permissions) return false;
    return user.permissions.effective.includes(permission);
  }, [user]);

  /**
   * Check if user has a permission within a specific group
   */
  const canInGroup = useCallback((permission: string, groupSlug: string): boolean => {
    if (!user?.permissions) return false;
    const groupPerms = user.permissions.groups[groupSlug];
    if (!groupPerms) return false;
    return groupPerms.permissions.includes(permission);
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    refreshPermissions,
    assumeUser,
    exitAssumeUser,
    can,
    canInGroup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * Must be used within AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

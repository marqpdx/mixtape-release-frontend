// src/hooks/useUsers.ts

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchUsers as apiFetchUsers, fetchUser as apiFetchUser } from '@/lib/user/userApi';
import { UserIdentity } from '@/types/auth';

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [userQueryKeys.all, 'list'] as const,
  list: () => [userQueryKeys.lists()] as const,
  details: () => [userQueryKeys.all, 'detail'] as const,
  detail: (username: string) => [userQueryKeys.details(), username] as const,
};

// ============================================================================
// HOOK RETURN TYPE INTERFACES
// ============================================================================

export interface UseUsersResult {
  users: UserIdentity[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseUserResult {
  user: UserIdentity | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ============================================================================
// PUBLIC HOOKS
// ============================================================================

/**
 * Hook to fetch all users in the system
 * Includes automatic caching and refetch logic
 */
export const useUsers = (): UseUsersResult => {
  const {
    data: users = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: userQueryKeys.list(),
    queryFn: apiFetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    users,
    isLoading,
    error: error as Error | null,
    refetch
  };
};

/**
 * Hook to fetch a single user by username
 */
export const useUser = (username: string | null): UseUserResult => {
  const {
    data: user = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: userQueryKeys.detail(username || ''),
    queryFn: () => apiFetchUser(username!),
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading,
    error: error as Error | null,
    refetch
  };
};

/**
 * Utility hook to filter users excluding the current user
 */
export const useUsersExcludingCurrent = (currentUsername?: string): UseUsersResult => {
  const { users, isLoading, error, refetch } = useUsers();

  const filteredUsers = useMemo(() => {
    if (!currentUsername) return users;
    return users.filter(u => u.username !== currentUsername);
  }, [users, currentUsername]);

  return {
    users: filteredUsers,
    isLoading,
    error,
    refetch
  };
};

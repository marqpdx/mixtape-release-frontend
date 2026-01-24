// packages/api/src/hooks/member/useMemberProfile.ts

/**
 * Member Profile Hooks
 *
 * React Query hooks for fetching and managing member profiles.
 * A "Member" is a user who is part of the Mixtape community.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MemberProfile,
  MemberProfileUpdate,
  UseMemberProfileResult,
  UseMemberProfilesResult,
} from '@mixtape/core/types/memberTypes';
import { fetchMembers, fetchMember, fetchMyProfile, updateMemberProfile } from '../../clients/member/memberApi';

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const memberProfileKeys = {
  all: ['memberProfiles'] as const,
  lists: () => [...memberProfileKeys.all, 'list'] as const,
  list: () => [...memberProfileKeys.lists()] as const,
  details: () => [...memberProfileKeys.all, 'detail'] as const,
  detail: (slug: string) => [...memberProfileKeys.details(), slug] as const,
  me: () => [...memberProfileKeys.all, 'me'] as const,
};

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch all member profiles
 */
export const useMemberProfiles = (): UseMemberProfilesResult => {
  const {
    data: members = [],
    isLoading,
    error,
    refetch,
  } = useQuery<MemberProfile[]>({
    queryKey: memberProfileKeys.list(),
    queryFn: fetchMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    members,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to fetch a single member profile by slug
 */
export const useMemberProfile = (
  username: string | null | undefined
): UseMemberProfileResult => {
  const {
    data: member = null,
    isLoading,
    error,
    refetch,
  } = useQuery<MemberProfile | null>({
    queryKey: memberProfileKeys.detail(username || ''),
    queryFn: () => fetchMember(username!),
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    member,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook to fetch the current user's member profile
 */
export const useMyMemberProfile = (): UseMemberProfileResult => {
  const {
    data: member = null,
    isLoading,
    error,
    refetch,
  } = useQuery<MemberProfile | null>({
    queryKey: memberProfileKeys.me(),
    queryFn: fetchMyProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: false, // Don't retry if /me/ endpoint doesn't exist
  });

  return {
    member,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

/**
 * Hook for updating a member profile
 */
export const useMemberProfileMutation = (username: string) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: MemberProfileUpdate) => updateMemberProfile(username, data),
    // Optimistic update
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: memberProfileKeys.detail(username),
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData<MemberProfile>(
        memberProfileKeys.detail(username)
      );

      // Optimistically update
      if (previous) {
        queryClient.setQueryData<MemberProfile>(
          memberProfileKeys.detail(username),
          { ...previous, ...newData }
        );
      }

      return { previous };
    },

    // Rollback on error
    onError: (err, newData, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          memberProfileKeys.detail(username),
          context.previous
        );
      }
      console.error('Failed to update member profile:', err);
    },

    // Refetch after success
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: memberProfileKeys.detail(username),
      });
      queryClient.invalidateQueries({
        queryKey: memberProfileKeys.me(),
      });
    },
  });

  return {
    update: mutation.mutateAsync,
    isUpdating: mutation.status === 'pending',
    error: mutation.error as Error | null,
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to invalidate member profile queries
 */
export const useInvalidateMemberProfiles = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: memberProfileKeys.all }),
    invalidateList: () =>
      queryClient.invalidateQueries({ queryKey: memberProfileKeys.list() }),
    invalidateMember: (username: string) =>
      queryClient.invalidateQueries({
        queryKey: memberProfileKeys.detail(username),
      }),
    invalidateMe: () =>
      queryClient.invalidateQueries({ queryKey: memberProfileKeys.me() }),
  };
};

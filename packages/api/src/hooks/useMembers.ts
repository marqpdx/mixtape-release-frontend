// src/hooks/useMembers.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  fetchMembers as apiFetchMembers,
  fetchMember as apiFetchMember,
  addMember as apiAddMember,
  updateMember as apiUpdateMember,
  removeMember as apiRemoveMember,
  FetchMembersOptions as ApiFetchMembersOptions,
  AddMemberData,
  UpdateMemberData,
} from '@mixtape/api/clients/group/memberApi';
import { GroupMembership, GroupRole } from '@mixtape/core/types/groupTypes';

// ============================================================================
// RE-EXPORT API TYPES
// ============================================================================

export type FetchMembersOptions = ApiFetchMembersOptions;
export type { AddMemberData, UpdateMemberData };

// ============================================================================
// QUERY KEY FACTORY (for cache consistency)
// ============================================================================

export const memberQueryKeys = {
  all: ['members'] as const,
  lists: () => [memberQueryKeys.all, 'list'] as const,
  list: (groupSlug: string, options: FetchMembersOptions = {}) =>
    [memberQueryKeys.lists(), groupSlug, options] as const,
  details: () => [memberQueryKeys.all, 'detail'] as const,
  detail: (groupSlug: string, memberId: string) =>
    [memberQueryKeys.details(), groupSlug, memberId] as const,
};

// ============================================================================
// HOOK RETURN TYPE INTERFACES
// ============================================================================

export interface UseMembersResult {
  members: GroupMembership[];
  activeMembers: GroupMembership[];
  adminMembers: GroupMembership[];
  stewardMembers: GroupMembership[];
  regularMembers: GroupMembership[];
  pendingMembers: GroupMembership[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseMemberResult {
  member: GroupMembership | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ============================================================================
// INTERNAL FETCH FUNCTIONS (delegate to API layer)
// ============================================================================

/**
 * Fetch all members for a group
 * Delegates to API layer
 */
const fetchMembers = async (
  groupSlug: string,
  options: FetchMembersOptions = {}
): Promise<GroupMembership[]> => {
  return apiFetchMembers(groupSlug, options);
};

/**
 * Fetch single member
 * Delegates to API layer
 */
const fetchMember = async (
  groupSlug: string,
  memberId: string
): Promise<GroupMembership> => {
  return apiFetchMember(groupSlug, memberId);
};

// ============================================================================
// PUBLIC HOOKS
// ============================================================================

/**
 * Hook to fetch all members of a group
 * Includes filtered computed properties (activeMembers, adminMembers, etc.)
 */
export const useMembers = (
  groupSlug: string | null,
  options: FetchMembersOptions = {}
): UseMembersResult => {
  const {
    data: members = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: memberQueryKeys.list(groupSlug || '', options),
    queryFn: () => fetchMembers(groupSlug!, options),
    enabled: !!groupSlug,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  // Computed filtered lists
  const activeMembers = useMemo(
    () => members.filter(m => m.is_active && !m.is_pending),
    [members]
  );

  console.log('members aab ', members);

  const adminMembers = useMemo(
    () => members.filter(m => m.roles.includes('admin')),
    [members]
  );

  const stewardMembers = useMemo(
    () => members.filter(m => m.roles.includes('steward')),
    [members]
  );

  const regularMembers = useMemo(
    () => members.filter(m =>
      m.roles.includes('member') &&
      !m.roles.includes('admin') &&
      !m.roles.includes('steward')
    ),
    [members]
  );

  const pendingMembers = useMemo(
    () => members.filter(m => m.is_pending),
    [members]
  );

  return {
    members,
    activeMembers,
    adminMembers,
    stewardMembers,
    regularMembers,
    pendingMembers,
    isLoading,
    error: error as Error | null,
    refetch
  };
};

/**
 * Hook to fetch a single member
 */
export const useMember = (
  groupSlug: string | null,
  memberId: string | null
): UseMemberResult => {
  const {
    data: member = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: memberQueryKeys.detail(groupSlug || '', memberId || ''),
    queryFn: () => fetchMember(groupSlug!, memberId!),
    enabled: !!groupSlug && !!memberId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    member,
    isLoading,
    error: error as Error | null,
    refetch
  };
};

/**
 * Hook for member mutations (add, update, remove)
 * Provides optimistic updates and automatic cache invalidation
 */
export const useMemberMutations = (groupSlug: string) => {
  const queryClient = useQueryClient();

  // Add member mutation
  const addMutation = useMutation({
    mutationFn: (data: AddMemberData) => apiAddMember(groupSlug, data),

    onSuccess: () => {
      // Invalidate all member lists for this group
      queryClient.invalidateQueries({
        queryKey: memberQueryKeys.lists()
      });
    },
  });

  // Update member mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: ({ memberId, updates }: { memberId: string; updates: UpdateMemberData }) =>
      apiUpdateMember(groupSlug, memberId, updates),

    // Optimistic update
    onMutate: async ({ memberId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: memberQueryKeys.detail(groupSlug, memberId)
      });

      // Snapshot previous value
      const previous = queryClient.getQueryData<GroupMembership>(
        memberQueryKeys.detail(groupSlug, memberId)
      );

      // Optimistically update cache
      if (previous) {
        queryClient.setQueryData<GroupMembership>(
          memberQueryKeys.detail(groupSlug, memberId),
          { ...previous, ...updates }
        );
      }

      return { previous };
    },

    // On error, rollback
    onError: (err, { memberId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          memberQueryKeys.detail(groupSlug, memberId),
          context.previous
        );
      }
      console.error('Update member failed:', err);
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: memberQueryKeys.lists()
      });
    },
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: (memberId: string) => apiRemoveMember(groupSlug, memberId),

    onSuccess: (_, memberId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: memberQueryKeys.detail(groupSlug, memberId)
      });
      queryClient.invalidateQueries({
        queryKey: memberQueryKeys.lists()
      });
    },
  });

  return {
    add: addMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: removeMutation.mutateAsync,
    isAdding: addMutation.status === 'pending',
    isUpdating: updateMutation.status === 'pending',
    isRemoving: removeMutation.status === 'pending',
    addError: addMutation.error as Error | null,
    updateError: updateMutation.error as Error | null,
    removeError: removeMutation.error as Error | null,
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Utility hook to invalidate member queries
 */
export const useInvalidateMembers = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.all }),
    invalidateMemberLists: (groupSlug: string) =>
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.list(groupSlug) }),
    invalidateMember: (groupSlug: string, memberId: string) =>
      queryClient.invalidateQueries({ queryKey: memberQueryKeys.detail(groupSlug, memberId) }),
  };
};

/**
 * Utility hook to get member statistics
 */
export const useMemberStats = (groupSlug: string | null) => {
  const { members, activeMembers, adminMembers, stewardMembers, pendingMembers } = useMembers(groupSlug);

  return useMemo(() => ({
    total: members.length,
    active: activeMembers.length,
    pending: pendingMembers.length,
    admins: adminMembers.length,
    stewards: stewardMembers.length,
  }), [members.length, activeMembers.length, pendingMembers.length, adminMembers.length, stewardMembers.length]);
};

// src/hooks/groups/useGroups.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import * as groupApi from '@/lib/group/groupApi';
import { Group, GroupMembership, UseGroupMembersResult } from '@mixtape/core/types/groupTypes';

// Re-export API types for convenience
export type FetchGroupsOptions = groupApi.FetchGroupsOptions;
export type FetchGroupMembersOptions = groupApi.FetchGroupMembersOptions;

// Query key factories for consistent caching
export const groupsQueryKeys = {
  all: ['groups'] as const,
  lists: () => [...groupsQueryKeys.all, 'list'] as const,
  list: (options: FetchGroupsOptions) => [...groupsQueryKeys.lists(), options] as const,
  userGroups: () => [...groupsQueryKeys.all, 'my'] as const,
  details: () => [...groupsQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupsQueryKeys.details(), id] as const,
  members: (groupSlug: string) => [...groupsQueryKeys.detail(groupSlug), 'members'] as const,
  membersList: (groupSlug: string, options: FetchGroupMembersOptions) =>
    [...groupsQueryKeys.members(groupSlug), options] as const,
  sponsorCircles: (sponsorGroupSlug: string) =>
    [...groupsQueryKeys.all, "sponsor", sponsorGroupSlug, "circles"] as const,
};

// Hook return type interfaces
export interface UseGroupsResult {
  groups: Group[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseGroupResult {
  group: Group | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseGroupMutationsResult {
  updateGroup: (updates: Partial<Group>) => Promise<Group>;
  publishGroup: () => Promise<Group>;
  isUpdating: boolean;
  isPublishing: boolean;
  updateError: Error | null;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch ALL groups (admin/steward view)
 */
export const useGroups = (options: FetchGroupsOptions = {}): UseGroupsResult => {
  const {
    data: groups = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: groupsQueryKeys.list(options),
    queryFn: () => groupApi.fetchGroups(options),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });

  return {
    groups,
    isLoading,
    error: error as Error | null,
    refetch
  };
};

/**
 * Hook to fetch groups where the current user is a member
 */
export const useUserGroups = (): UseGroupsResult => {
  const {
    data: groups = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: groupsQueryKeys.userGroups(),
    queryFn: () => groupApi.fetchUserGroups(),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: false,
  });

  return {
    groups,
    isLoading,
    error: error as Error | null,
    refetch
  };
};

/**
 * Hook to fetch and manage a single group
 */
export const useGroup = (slug: string | null): UseGroupResult => {
  const {
    data: group = null,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: groupsQueryKeys.detail(slug || ''),
    queryFn: () => groupApi.fetchGroup(slug!),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    group,
    isLoading,
    error: error as Error | null,
    refetch
  };
};


/**
 * Hook to fetch a groups' circles (sponsored circles)
 */
export const useGroupCircles = (
  sponsorGroupSlug: string | null,
  options: FetchGroupsOptions = {}
) => {
  const {
    data: circles = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [...groupsQueryKeys.sponsorCircles(sponsorGroupSlug || ""), options],
    queryFn: () => groupApi.fetchGroupCircles(sponsorGroupSlug!, options),
    enabled: !!sponsorGroupSlug,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return { circles, isLoading, error: error as Error | null, refetch };
};


/**
 * Hook for group mutations (update, publish, etc.)
 * Provides optimistic updates and automatic cache invalidation
 */
export const useGroupMutations = (slug: string): UseGroupMutationsResult => {
  const queryClient = useQueryClient();

  // Update mutation with optimistic updates
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Group>) => groupApi.updateGroup(slug, updates),

    // Optimistic update
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: groupsQueryKeys.detail(slug) });

      // Snapshot previous value
      const previousGroup = queryClient.getQueryData<Group>(groupsQueryKeys.detail(slug));

      // Optimistically update cache
      if (previousGroup) {
        queryClient.setQueryData<Group>(
          groupsQueryKeys.detail(slug),
          { ...previousGroup, ...updates }
        );
      }

      return { previousGroup };
    },

    // On error, rollback
    onError: (err, updates, context) => {
      if (context?.previousGroup) {
        queryClient.setQueryData(
          groupsQueryKeys.detail(slug),
          context.previousGroup
        );
      }
      console.error('Update failed:', err);
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: groupsQueryKeys.detail(slug) });
      queryClient.invalidateQueries({ queryKey: groupsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupsQueryKeys.userGroups() });
    },
  });

  // Publish mutation
  const publishMutation = useMutation({
    mutationFn: () => groupApi.publishGroup(slug),

    onSuccess: (updatedGroup) => {
      queryClient.setQueryData(groupsQueryKeys.detail(slug), updatedGroup);
      queryClient.invalidateQueries({ queryKey: groupsQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: groupsQueryKeys.userGroups() });
    },

    onError: (err) => {
      console.error('Publish failed:', err);
    },
  });

  return {
    updateGroup: updateMutation.mutateAsync,
    publishGroup: publishMutation.mutateAsync,
    isUpdating: updateMutation.status === 'pending',
    isPublishing: publishMutation.status === 'pending',
    updateError: updateMutation.error as Error | null,
  };
};

/**
 * Hook for draft/auto-save functionality
 */
export const useGroupDraft = (
  slug: string,
  autoSaveInterval: number = 3000 // 3 seconds
) => {
  const [draftChanges, setDraftChanges] = useState<Partial<Group>>({});
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { updateGroup, isUpdating } = useGroupMutations(slug);

  // Auto-save effect
  useEffect(() => {
    if (!isDraftMode || Object.keys(draftChanges).length === 0) return;

    const timer = setTimeout(async () => {
      try {
        await updateGroup(draftChanges);
        setLastSaved(new Date());
        setDraftChanges({}); // Clear draft after successful save
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [draftChanges, isDraftMode, autoSaveInterval, updateGroup]);

  const updateDraft = (updates: Partial<Group>) => {
    setDraftChanges(prev => ({ ...prev, ...updates }));
  };

  const saveDraft = async () => {
    if (Object.keys(draftChanges).length === 0) return;

    try {
      await updateGroup(draftChanges);
      setLastSaved(new Date());
      setDraftChanges({});
    } catch (error) {
      console.error('Save failed:', error);
      throw error;
    }
  };

  const discardDraft = () => {
    setDraftChanges({});
    setIsDraftMode(false);
  };

  const enterDraftMode = () => {
    setIsDraftMode(true);
  };

  const exitDraftMode = async () => {
    if (Object.keys(draftChanges).length > 0) {
      await saveDraft();
    }
    setIsDraftMode(false);
  };

  return {
    draftChanges,
    isDraftMode,
    lastSaved,
    isAutoSaving: isUpdating,
    hasPendingChanges: Object.keys(draftChanges).length > 0,
    updateDraft,
    saveDraft,
    discardDraft,
    enterDraftMode,
    exitDraftMode,
  };
};

/**
 * Hook to fetch and manage group members
 */
export const useGroupMembers = (
  groupSlug: string | null,
  options: FetchGroupMembersOptions = {}
): UseGroupMembersResult => {
  const {
    data: members = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: groupsQueryKeys.membersList(groupSlug || '', options),
    queryFn: () => groupApi.fetchGroupMembers(groupSlug!, options),
    enabled: !!groupSlug,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Business logic filtering
  const activeMembers = useMemo(() =>
    members.filter(member => member.is_active && !member.is_pending),
    [members]
  );

  const adminMembers = useMemo(() =>
    members.filter(member => {
      if (!member.roles || !Array.isArray(member.roles)) return false;
      return member.roles.includes('admin');
    }),
    [members]
  );

  const stewardMembers = useMemo(() =>
    members.filter(member => {
      if (!member.roles || !Array.isArray(member.roles)) return false;
      return member.roles.includes('steward');
    }),
    [members]
  );

  const pendingMembers = useMemo(() =>
    members.filter(member => member.is_pending),
    [members]
  );

  return {
    members,
    activeMembers,
    adminMembers,
    stewardMembers,
    pendingMembers,
    isLoading,
    error: error as Error | null,
    refetch
  };
};

// Legacy alias for backward compatibility
export const useMyGroups = useUserGroups;

/**
 * Utility hook to invalidate group-related queries
 */
export const useInvalidateGroups = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAllGroups: () => queryClient.invalidateQueries({ queryKey: groupsQueryKeys.all }),
    invalidateUserGroups: () => queryClient.invalidateQueries({ queryKey: groupsQueryKeys.userGroups() }),
    invalidateGroup: (groupSlug: string) =>
      queryClient.invalidateQueries({ queryKey: groupsQueryKeys.detail(groupSlug) }),
    invalidateGroupMembers: (groupSlug: string) =>
      queryClient.invalidateQueries({ queryKey: groupsQueryKeys.members(groupSlug) }),
  };
};
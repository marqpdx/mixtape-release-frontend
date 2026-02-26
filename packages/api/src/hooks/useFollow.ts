// packages/api/src/hooks/useFollow.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as followApi from '../clients/writing/followApi';
import type { Leaf } from '@mixtape/core/types/leaf';

const followKeys = {
  all: ['follows'] as const,
  list: () => [...followKeys.all, 'list'] as const,
  status: (userId: string) => [...followKeys.all, 'status', userId] as const,
  streams: () => ['streams'] as const,
};

export function useFollowingList() {
  return useQuery({
    queryKey: followKeys.list(),
    queryFn: followApi.fetchFollowingList,
    staleTime: 60_000,
  });
}

export function useFollowStatus(userId: string | null) {
  return useQuery({
    queryKey: followKeys.status(userId ?? ''),
    queryFn: () => followApi.fetchFollowStatus(userId!),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useFollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: followApi.followUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: followKeys.all });
      qc.invalidateQueries({ queryKey: followKeys.streams() });
    },
  });
}

export function useUnfollowUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: followApi.unfollowUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: followKeys.all });
      qc.invalidateQueries({ queryKey: followKeys.streams() });
    },
  });
}

export function useStreams() {
  return useQuery({
    queryKey: followKeys.streams(),
    queryFn: () => followApi.fetchStreams(),
    staleTime: 30_000,
  });
}

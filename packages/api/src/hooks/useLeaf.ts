// packages/api/src/hooks/useLeaf.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as leafApi from '../clients/writing/leafApi';
import type { LeafCreateData, LeafCommentCreateData } from '@mixtape/core/types/leaf';

const leafKeys = {
  all: ['leaves'] as const,
  storyline: () => [...leafKeys.all, 'storyline'] as const,
  detail: (id: string) => [...leafKeys.all, 'detail', id] as const,
  comments: (leafId: string) => [...leafKeys.all, 'comments', leafId] as const,
};

export function useStoryline() {
  return useQuery({
    queryKey: leafKeys.storyline(),
    queryFn: () => leafApi.fetchStoryline(),
    staleTime: 30_000,
  });
}

export function useLeafDetail(id: string | null) {
  return useQuery({
    queryKey: leafKeys.detail(id ?? ''),
    queryFn: () => leafApi.fetchLeafDetail(id!),
    enabled: !!id,
    staleTime: 60_000,
  });
}

export function useCreateLeaf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LeafCreateData) => leafApi.createLeaf(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leafKeys.storyline() });
    },
  });
}

export function useLeafComments(leafId: string | null) {
  return useQuery({
    queryKey: leafKeys.comments(leafId ?? ''),
    queryFn: () => leafApi.fetchLeafComments(leafId!),
    enabled: !!leafId,
    staleTime: 30_000,
  });
}

export function useCreateComment(leafId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LeafCommentCreateData) => leafApi.createLeafComment(leafId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leafKeys.comments(leafId) });
      qc.invalidateQueries({ queryKey: leafKeys.storyline() });
    },
  });
}

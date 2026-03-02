// packages/api/src/hooks/useSeed.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as seedApi from '../clients/writing/seedApi';

const seedKeys = {
  all: ['seeds'] as const,
  recent: () => [...seedKeys.all, 'recent'] as const,
};

export function useRecentSeeds(limit = 4) {
  return useQuery({
    queryKey: [...seedKeys.recent(), limit],
    queryFn: () => seedApi.fetchRecentSeeds(limit),
    staleTime: 30_000,
  });
}

export function useCreateSeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: seedApi.createSeed,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: seedKeys.recent() });
    },
  });
}

export function useUpdateSeed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { body_text?: string } }) =>
      seedApi.updateSeed(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: seedKeys.recent() });
    },
  });
}

export function usePromoteSeedToLeaf() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: seedApi.promoteSeedToLeaf,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: seedKeys.recent() });
      qc.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
}

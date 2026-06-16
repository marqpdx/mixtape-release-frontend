// packages/api/src/hooks/drops/useDrops.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchGroupDrops, createGroupDrop, archiveGroupDrop } from '@mixtape/api/clients/drop/dropApi';
import type { DropCreateData } from '@mixtape/core/types/dropTypes';

export const dropsQueryKeys = {
  groupDrops: (groupSlug: string) => ['drops', 'group', groupSlug] as const,
};

export function useGroupDrops(groupSlug: string) {
  return useQuery({
    queryKey: dropsQueryKeys.groupDrops(groupSlug),
    queryFn: () => fetchGroupDrops(groupSlug),
    enabled: !!groupSlug,
    staleTime: 1000 * 30,
  });
}

export function useCreateGroupDrop(groupSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: DropCreateData) => createGroupDrop(groupSlug, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dropsQueryKeys.groupDrops(groupSlug) });
    },
  });
}

export function useArchiveGroupDrop(groupSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dropId: string) => archiveGroupDrop(groupSlug, dropId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dropsQueryKeys.groupDrops(groupSlug) });
    },
  });
}

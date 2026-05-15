'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { patchMyProfile } from '../api/client';
import type { ProfileDTO, ProfilePatch } from '../api/types';

export function useProfilePatch() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (patch: ProfilePatch) => patchMyProfile(patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ['profile-revamp', 'me'] });
      const previous = qc.getQueryData<ProfileDTO>(['profile-revamp', 'me']);
      if (previous) {
        qc.setQueryData<ProfileDTO>(['profile-revamp', 'me'], {
          ...previous,
          ...(patch as Partial<ProfileDTO>),
        });
      }
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(['profile-revamp', 'me'], ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['profile-revamp', 'me'] });
    },
  });
}

'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackEvent } from '@/components/analytics';
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
    onSuccess: (_data, patch) => {
      const prev = qc.getQueryData<ProfileDTO>(['profile-revamp', 'me']);
      if ('theme' in patch) trackEvent('profile_revamp.theme_changed', { from: prev?.theme, to: patch.theme });
      if ('accent' in patch) trackEvent('profile_revamp.accent_changed', { theme: prev?.theme, accent: patch.accent });
      if ('font' in patch) trackEvent('profile_revamp.font_changed', { from: prev?.font, to: patch.font });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['profile-revamp', 'me'] });
    },
  });
}

'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { putSections } from '../api/client';
import type { ProfileDTO, SectionEntry } from '../api/types';

export function useSectionReorder() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (layout: SectionEntry[]) => putSections(layout),
    onMutate: async (layout) => {
      await qc.cancelQueries({ queryKey: ['profile-revamp', 'me'] });
      const previous = qc.getQueryData<ProfileDTO>(['profile-revamp', 'me']);
      if (previous) {
        qc.setQueryData<ProfileDTO>(['profile-revamp', 'me'], {
          ...previous,
          sectionLayout: layout,
        });
      }
      return { previous };
    },
    onError: (_err, _layout, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(['profile-revamp', 'me'], ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['profile-revamp', 'me'] });
    },
  });
}

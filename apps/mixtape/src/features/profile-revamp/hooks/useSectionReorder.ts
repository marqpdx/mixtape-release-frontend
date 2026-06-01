'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trackEvent } from '@/components/analytics';
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
    onSuccess: (_data, layout, ctx) => {
      const prev = (ctx as { previous?: ProfileDTO } | undefined)?.previous?.sectionLayout ?? [];
      layout.forEach((entry, newIdx) => {
        const prevEntry = prev.find(p => p.id === entry.id);
        if (!prevEntry) return;
        const oldIdx = prev.indexOf(prevEntry);
        if (oldIdx !== newIdx) {
          trackEvent('profile_revamp.section_reordered', { id: entry.id, fromIdx: oldIdx, toIdx: newIdx });
        }
        if (prevEntry.visible !== entry.visible) {
          trackEvent('profile_revamp.section_toggled', { id: entry.id, visible: entry.visible });
        }
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['profile-revamp', 'me'] });
    },
  });
}

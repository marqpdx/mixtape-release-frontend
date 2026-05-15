'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyProfile } from '../hooks/useProfile';
import { useProfilePatch } from '../hooks/useProfilePatch';
import { useSectionReorder } from '../hooks/useSectionReorder';
import { publishProfile } from '../api/client';
import Profile from '../components/Profile';
import EditorSidebar from './EditorSidebar';
import type { ProfileDTO, SectionEntry } from '../api/types';
import { computeAccentInk } from '../lib/contrast';

export default function ProfileEditor() {
  const { data: profile, isLoading, error } = useMyProfile();
  const patchMutation = useProfilePatch();
  const reorderMutation = useSectionReorder();
  const qc = useQueryClient();

  const publishMutation = useMutation({
    mutationFn: publishProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile-revamp', 'me'] }),
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--ink-soft)' }}>
        Loading…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--ink-soft)' }}>
        Could not load profile.
      </div>
    );
  }

  function handlePatch(patch: Partial<ProfileDTO>) {
    patchMutation.mutate(patch as Parameters<typeof patchMutation.mutate>[0]);
  }

  function handleLayoutChange(layout: SectionEntry[]) {
    reorderMutation.mutate(layout);
  }

  const accentInk = computeAccentInk(profile.accent);

  return (
    <div
      data-theme={profile.theme}
      data-font={profile.font}
      data-density={profile.density}
      style={{
        display: 'flex',
        minHeight: '100vh',
        '--profile-accent': profile.accent,
        '--profile-accent-ink': accentInk,
      } as React.CSSProperties}
    >
      <EditorSidebar
        profile={profile}
        onPatch={handlePatch}
        onLayoutChange={handleLayoutChange}
        onPublish={() => publishMutation.mutate()}
        isSaving={patchMutation.isPending || reorderMutation.isPending || publishMutation.isPending}
      />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Profile profile={profile} isEditor />
      </main>
    </div>
  );
}

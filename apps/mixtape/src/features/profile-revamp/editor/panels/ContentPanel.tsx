'use client';
import { useId } from 'react';
import type { ProfileDTO } from '../../api/types';
import EditableText from '../inline/EditableText';

interface Props {
  profile: ProfileDTO;
  onPatch: (patch: Partial<ProfileDTO>) => void;
}

export default function ContentPanel({ profile, onPatch }: Props) {
  const labelId = useId();

  function commit(field: string, value: string) {
    const key = field as keyof ProfileDTO;
    onPatch({ [key]: value } as Partial<ProfileDTO>);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <span id={`${labelId}-displayName`} style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>Display name</span>
        <div style={{ marginTop: 6, padding: '8px 10px', border: '1.5px solid var(--rule)', borderRadius: 8, background: 'var(--surface)' }}>
          <EditableText value={profile.displayName} field="displayName" labelledBy={`${labelId}-displayName`} maxLength={48} onCommit={commit} />
        </div>
      </div>
      <div>
        <span id={`${labelId}-status`} style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>Status</span>
        <div style={{ marginTop: 6, padding: '8px 10px', border: '1.5px solid var(--rule)', borderRadius: 8, background: 'var(--surface)' }}>
          <EditableText value={profile.status} field="status" labelledBy={`${labelId}-status`} maxLength={200} onCommit={commit} />
        </div>
      </div>
      <div>
        <span id={`${labelId}-bio`} style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>Bio</span>
        <div style={{ marginTop: 6, padding: '8px 10px', border: '1.5px solid var(--rule)', borderRadius: 8, background: 'var(--surface)', minHeight: 80 }}>
          <EditableText value={profile.bio} field="bio" labelledBy={`${labelId}-bio`} maxLength={2000} multiline onCommit={commit} />
        </div>
      </div>
    </div>
  );
}

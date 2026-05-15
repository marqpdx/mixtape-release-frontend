'use client';
import type { NowDTO } from '../api/types';

interface Props { now: NowDTO }

export default function NowPlaying({ now }: Props) {
  return (
    <section style={{ background: 'var(--surface)', borderRadius: 12, padding: 16, border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ fontSize: 24, color: 'var(--accent)' }}>♪</span>
      <div>
        <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>
          {now.label || 'now playing'}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{now.track}</p>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-soft)' }}>{now.artist}</p>
      </div>
    </section>
  );
}

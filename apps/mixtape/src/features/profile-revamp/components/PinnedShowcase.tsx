import type { PinnedDTO } from '../api/types';

interface Props { pinned: PinnedDTO }

export default function PinnedShowcase({ pinned }: Props) {
  return (
    <section style={{ background: 'var(--surface)', borderRadius: 12, padding: 20, border: '1px solid var(--rule)' }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>
        {pinned.label || `pinned · ${pinned.kind}`}
      </p>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
        {pinned.mark && <span style={{ marginRight: 8 }}>{pinned.mark}</span>}
        {pinned.title}
      </h2>
      {pinned.subtitle && (
        <p style={{ margin: '4px 0 16px', fontSize: 14, color: 'var(--ink-soft)' }}>{pinned.subtitle}</p>
      )}
      {pinned.tracks.length > 0 && (
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pinned.tracks.map(track => (
            <li key={track.position} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', width: 24, flexShrink: 0 }}>
                {String(track.position).padStart(2, '0')}
              </span>
              <span style={{ flex: 1, fontSize: 14, color: 'var(--ink)' }}>{track.name}</span>
              {track.duration && (
                <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{track.duration}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

import type { BadgeDTO } from '../api/types';

interface Props { badges: BadgeDTO[] }

export default function BadgeRow({ badges }: Props) {
  if (!badges.length) return null;
  return (
    <section>
      <h3 style={{ margin: '0 0 12px', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>Badges</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {badges.map(badge => (
          <div
            key={badge.glyph}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              background: badge.featured ? 'var(--accent)' : 'var(--surface)',
              color: badge.featured ? 'var(--accent-ink)' : 'var(--ink)',
              border: badge.featured ? 'none' : '1px solid var(--rule)',
              fontSize: 13,
            }}
          >
            <span>{badge.glyph}</span>
            <span>{badge.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

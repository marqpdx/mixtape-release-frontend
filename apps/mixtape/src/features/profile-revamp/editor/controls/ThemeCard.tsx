'use client';
import type { ThemeKey, ThemeDef } from '../../lib/themes';

interface Props {
  themeKey: ThemeKey;
  def: ThemeDef;
  selected: boolean;
  onSelect: (key: ThemeKey) => void;
}

export default function ThemeCard({ themeKey, def, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(themeKey)}
      aria-pressed={selected}
      style={{
        padding: 12,
        borderRadius: 10,
        border: selected ? '2px solid var(--accent)' : '1.5px solid var(--rule)',
        background: def.tokens['--bg'],
        cursor: 'pointer',
        textAlign: 'left',
        minWidth: 44,
        minHeight: 44,
      }}
    >
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: def.tokens['--ink'] }}>{def.name}</p>
      <p style={{ margin: '2px 0 0', fontSize: 11, color: def.tokens['--ink-soft'] }}>{def.sub}</p>
      <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
        {def.accents.slice(0, 4).map(a => (
          <div key={a} style={{ width: 10, height: 10, borderRadius: '50%', background: a }} />
        ))}
      </div>
    </button>
  );
}

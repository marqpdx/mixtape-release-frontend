'use client';
import type { FontKey, FontPairDef } from '../../lib/themes';

interface Props { fontKey: FontKey; def: FontPairDef; selected: boolean; onSelect: (k: FontKey) => void }

export default function FontCard({ fontKey, def, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(fontKey)}
      aria-pressed={selected}
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        border: selected ? '2px solid var(--accent)' : '1.5px solid var(--rule)',
        background: 'var(--surface)',
        cursor: 'pointer',
        textAlign: 'left',
        minWidth: 44, minHeight: 44,
      }}
    >
      <span style={{ fontFamily: def.display, fontSize: 18, color: 'var(--ink)' }}>{def.sample}</span>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-soft)' }}>{def.name}</p>
    </button>
  );
}

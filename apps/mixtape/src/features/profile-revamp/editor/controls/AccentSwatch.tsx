'use client';
interface Props { color: string; selected: boolean; onSelect: (c: string) => void }

export default function AccentSwatch({ color, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(color)}
      aria-label={`accent color ${color}`}
      aria-pressed={selected}
      style={{
        width: 28, height: 28, borderRadius: '50%',
        background: color,
        border: selected ? '3px solid var(--ink)' : '2px solid transparent',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 2px var(--bg)' : 'none',
        minWidth: 44, minHeight: 44,
        padding: 0,
      }}
    />
  );
}

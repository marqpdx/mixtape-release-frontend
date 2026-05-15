'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SectionId } from '../../api/types';
import { SECTION_NAMES } from '../../lib/themes';

interface Props {
  id: SectionId;
  visible: boolean;
  locked?: boolean;
  onToggle: (id: SectionId, visible: boolean) => void;
}

export default function SectionListItem({ id, visible, locked, onToggle }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: locked });

  return (
    <li
      ref={setNodeRef}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        borderRadius: 8,
        background: isDragging ? 'var(--accent)' : 'var(--surface)',
        color: isDragging ? 'var(--accent-ink)' : 'var(--ink)',
        border: '1px solid var(--rule)',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: visible ? 1 : 0.5,
        listStyle: 'none',
      }}
      {...attributes}
    >
      {!locked && (
        <span {...listeners} style={{ cursor: 'grab', fontSize: 16, color: 'var(--ink-soft)', touchAction: 'none' }} aria-label="drag to reorder">⠿</span>
      )}
      <span style={{ flex: 1, fontSize: 14 }}>{SECTION_NAMES[id]}</span>
      {locked ? (
        <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>locked</span>
      ) : (
        <button
          onClick={() => onToggle(id, !visible)}
          aria-label={visible ? `hide ${SECTION_NAMES[id]}` : `show ${SECTION_NAMES[id]}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--ink-soft)', minWidth: 44, minHeight: 44 }}
        >
          {visible ? '👁' : '🚫'}
        </button>
      )}
    </li>
  );
}

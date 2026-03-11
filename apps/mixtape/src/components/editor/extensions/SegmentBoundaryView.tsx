// extensions/SegmentBoundaryView.tsx
//
// React node view for segmentBoundary nodes.
// Renders a visual divider: ── Event · Birthday Party for Riga ──

import { NodeViewWrapper } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  writingpiece: { bg: '#e6f4ea', text: '#1e7e34', border: '#a3d9a5' },
  event: { bg: '#f3e8fd', text: '#6b21a8', border: '#c4b5fd' },
  course: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  seed: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
};

const TYPE_LABELS: Record<string, string> = {
  writingpiece: 'Writing',
  event: 'Event',
  course: 'Course',
  seed: 'Seed',
};

export function SegmentBoundaryView({ node, selected }: NodeViewProps) {
  const { artifactType, isAnchorReturn, title } = node.attrs;
  const colors = TYPE_COLORS[artifactType] || TYPE_COLORS.writingpiece;
  const typeLabel = isAnchorReturn
    ? 'Return to Anchor'
    : TYPE_LABELS[artifactType] || artifactType;

  return (
    <NodeViewWrapper
      data-segment-boundary=""
      contentEditable={false}
      style={{
        userSelect: 'none',
        margin: '12px 0',
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '4px',
        backgroundColor: colors.bg,
        border: `1px solid ${selected ? '#3b82f6' : colors.border}`,
        cursor: 'default',
        fontSize: '13px',
        lineHeight: '20px',
        color: colors.text,
        outline: selected ? '2px solid #3b82f6' : 'none',
        outlineOffset: '1px',
      }}
    >
      <span
        style={{
          flex: '0 0 auto',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          fontSize: '11px',
        }}
      >
        {typeLabel}
      </span>

      <span
        style={{
          flex: '1 1 auto',
          height: '1px',
          backgroundColor: colors.border,
        }}
      />

      {title && !isAnchorReturn && (
        <span
          style={{
            flex: '0 1 auto',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 500,
          }}
        >
          {title}
        </span>
      )}

      <span
        style={{
          flex: '1 1 auto',
          height: '1px',
          backgroundColor: colors.border,
        }}
      />
    </NodeViewWrapper>
  );
}

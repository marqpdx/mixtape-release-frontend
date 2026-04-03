// extensions/SplitMarkerView.tsx
//
// React node view for splitMarker nodes.
// Renders an orange divider: ✂ Split here · optional title · AI rationale

import { NodeViewWrapper } from '@tiptap/react'
import type { NodeViewProps } from '@tiptap/react'
import { IconScissors } from '@tabler/icons-react'

export function SplitMarkerView({ node, selected }: NodeViewProps) {
  const { source, title, rationale } = node.attrs as {
    source: 'ai' | 'manual'
    title: string | null
    rationale: string | null
  }

  return (
    <NodeViewWrapper
      data-split-marker=""
      contentEditable={false}
      style={{
        userSelect: 'none',
        margin: '12px 0',
        padding: '6px 12px',
        borderRadius: '4px',
        backgroundColor: selected ? '#fff7ed' : '#fffbf7',
        border: `1px solid ${selected ? '#f97316' : '#fed7aa'}`,
        cursor: 'default',
        outline: selected ? '2px solid #f97316' : 'none',
        outlineOffset: '1px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <IconScissors size={13} color="#f97316" style={{ flexShrink: 0 }} />
        <span
          style={{
            fontWeight: 600,
            fontSize: '11px',
            color: '#ea580c',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
          }}
        >
          {source === 'ai' ? 'AI split point' : 'Split here'}
        </span>
        <span style={{ flex: '1 1 auto', height: '1px', backgroundColor: '#fed7aa' }} />
        {title && (
          <>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: '#c2410c',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '220px',
                flexShrink: 0,
              }}
            >
              {title}
            </span>
            <span style={{ flex: '1 1 auto', height: '1px', backgroundColor: '#fed7aa' }} />
          </>
        )}
      </div>
      {rationale && (
        <div
          style={{
            marginTop: '4px',
            paddingLeft: '21px',
            fontSize: '11px',
            color: '#9a3412',
            fontStyle: 'italic',
          }}
        >
          {rationale}
        </div>
      )}
    </NodeViewWrapper>
  )
}

'use client';

import { useState } from 'react';

interface TagCloudProps {
  heading: string;
  tags: string[];
}

export function TagCloud({ heading, tags }: TagCloudProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!tags || tags.length === 0) return null;

  return (
    <div className="p200-tagcloud-root">
      <h3 style={{
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
        marginBottom: 12,
        marginTop: 0,
      }}>
        {heading}
      </h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((tag, i) => (
          <span
            key={tag}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              padding: '7px 13px',
              background: hovered === i ? 'var(--surface)' : 'var(--surface-2)',
              border: `1px solid ${hovered === i ? 'var(--accent)' : 'var(--line)'}`,
              borderRadius: 999,
              fontSize: 13.5,
              fontWeight: 500,
              color: hovered === i ? 'var(--accent)' : 'var(--ink-2)',
              transform: hovered === i ? 'translateY(-1px)' : 'none',
              transition: 'color 0.15s, border-color 0.15s, background 0.15s, transform 0.15s',
              cursor: 'default',
              userSelect: 'none',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IconChevronDown } from '@tabler/icons-react';

interface FullBioProps {
  bio: string;
}

const mdComponents = {
  p: ({ children }: { children?: React.ReactNode }) => (
    <p style={{ margin: '0 0 1em 0', lineHeight: 1.62 }}>{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em>{children}</em>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote style={{
      borderLeft: '3px solid var(--accent)',
      fontStyle: 'italic',
      color: 'var(--ink)',
      paddingLeft: 18,
      margin: '1em 0',
    }}>
      {children}
    </blockquote>
  ),
};

export function FullBio({ bio }: FullBioProps) {
  const [expanded, setExpanded] = useState(false);

  if (!bio) return null;

  return (
    <>
      <style>{`
        @keyframes p200-bio-expand {
          from { max-height: 172px; }
          to   { max-height: 2000px; }
        }
        .p200-bio-body {
          font-family: var(--font-read);
          font-size: 17px;
          line-height: 1.62;
          color: var(--ink-2);
          overflow: hidden;
          position: relative;
          transition: max-height 0.4s ease;
        }
        .p200-bio-body.collapsed { max-height: 172px; }
        .p200-bio-body.expanded  { max-height: 2000px; }
      `}</style>
      <div className="p200-fullbio-root">
        <h3 style={{
          fontSize: 12.5,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--ink-3)',
          marginBottom: 12,
          marginTop: 0,
        }}>
          Full bio
        </h3>
        <div style={{ position: 'relative' }}>
          <div className={`p200-bio-body ${expanded ? 'expanded' : 'collapsed'}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents as object}>
              {bio}
            </ReactMarkdown>
          </div>
          {!expanded && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 64,
              background: 'linear-gradient(to bottom, transparent, var(--bg))',
              pointerEvents: 'none',
            }} />
          )}
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            marginTop: 12,
            background: 'none',
            border: 'none',
            padding: 0,
            color: 'var(--accent)',
            fontWeight: 600,
            fontSize: 14.5,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            whiteSpace: 'nowrap',
          }}
        >
          {expanded ? 'Show less' : 'Read full bio'}
          <IconChevronDown
            size={16}
            style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}
          />
        </button>
      </div>
    </>
  );
}

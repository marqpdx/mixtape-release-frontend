'use client';

import { useState } from 'react';
import { IconWorld, IconLeaf, IconArrowRight, IconLink } from '@tabler/icons-react';
import type { LinkDTO } from '../../api/types';

interface QuickLinks200Props {
  links: LinkDTO[];
  quickLink?: string;
}

const KIND_ICON: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  globe: IconWorld,
  leaf:  IconLeaf,
};

function LinkRow({ link, isFirst }: { link: LinkDTO; isFirst: boolean }) {
  const [hovered, setHovered] = useState(false);
  const Icon = KIND_ICON[link.icon] ?? IconLink;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '13px 2px',
        borderTop: isFirst ? 'none' : '1px solid var(--line)',
        fontSize: 14.5,
        fontWeight: 500,
        color: hovered ? 'var(--accent)' : 'var(--ink-2)',
        textDecoration: 'none',
        transition: 'color 0.15s',
      }}
    >
      <Icon size={17} style={{ color: 'var(--accent)', flexShrink: 0 }} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {link.title}
      </span>
      <IconArrowRight
        size={15}
        style={{
          flexShrink: 0,
          opacity: hovered ? 1 : 0,
          transform: hovered ? 'translateX(0)' : 'translateX(-4px)',
          transition: 'opacity 0.15s, transform 0.15s',
        }}
      />
    </a>
  );
}

export function QuickLinks200({ links, quickLink }: QuickLinks200Props) {
  const allLinks: LinkDTO[] = [
    ...(quickLink ? [{ position: -1, icon: 'globe', title: quickLink, sub: '', url: quickLink }] : []),
    ...links,
  ];

  if (allLinks.length === 0) return null;

  return (
    <div className="p200-quicklinks-root">
      <h3 style={{
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--ink-3)',
        marginBottom: 4,
        marginTop: 0,
      }}>
        Links
      </h3>
      {allLinks.map((link, i) => (
        <LinkRow key={link.url + i} link={link} isFirst={i === 0} />
      ))}
    </div>
  );
}

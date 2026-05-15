'use client';
import { useState } from 'react';
import type { ProfileDTO, SectionEntry } from '../api/types';
import StylePanel from './panels/StylePanel';
import LayoutPanel from './panels/LayoutPanel';
import ContentPanel from './panels/ContentPanel';

type PanelTab = 'style' | 'layout' | 'content';

interface Props {
  profile: ProfileDTO;
  onPatch: (patch: Partial<ProfileDTO>) => void;
  onLayoutChange: (layout: SectionEntry[]) => void;
  onPublish: () => void;
  isSaving?: boolean;
}

export default function EditorSidebar({ profile, onPatch, onLayoutChange, onPublish, isSaving }: Props) {
  const [tab, setTab] = useState<PanelTab>('style');

  const tabs: { key: PanelTab; label: string }[] = [
    { key: 'style',   label: 'Style' },
    { key: 'layout',  label: 'Layout' },
    { key: 'content', label: 'Content' },
  ];

  return (
    <aside
      style={{
        width: 280, flexShrink: 0,
        height: '100vh', overflowY: 'auto',
        background: 'var(--surface)',
        borderRight: '1px solid var(--rule)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0,
      }}
    >
      <div style={{ padding: '16px 16px 0', borderBottom: '1px solid var(--rule)', display: 'flex', gap: 4 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            style={{
              flex: 1, padding: '8px 4px', fontSize: 13, fontWeight: tab === t.key ? 700 : 400,
              border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink)',
              borderBottom: tab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              minHeight: 44,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: 16, overflowY: 'auto' }}>
        {tab === 'style'   && <StylePanel   profile={profile} onPatch={onPatch} />}
        {tab === 'layout'  && <LayoutPanel  profile={profile} onLayoutChange={onLayoutChange} />}
        {tab === 'content' && <ContentPanel profile={profile} onPatch={onPatch} />}
      </div>

      <div style={{ padding: 16, borderTop: '1px solid var(--rule)' }}>
        <button
          onClick={onPublish}
          disabled={isSaving}
          style={{
            width: '100%', padding: '12px 0', borderRadius: 'var(--btn-radius)',
            background: 'var(--accent)', color: 'var(--accent-ink)',
            border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            opacity: isSaving ? 0.6 : 1, minHeight: 44,
          }}
        >
          {isSaving ? 'Saving…' : 'Publish'}
        </button>
      </div>
    </aside>
  );
}

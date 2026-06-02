'use client';

import { useState } from 'react';
import type { ProfileDTO, SectionId } from '../api/types';
import { computeAccentInk } from '../lib/contrast';
import { THEMES, FONT_PAIRS, ROW_GAP } from '../lib/themes';
import ProfileHeader from './ProfileHeader';
import PinnedShowcase from './PinnedShowcase';
import NowPlaying from './NowPlaying';
import ActivityFeed from './ActivityFeed';
import FriendsGrid from './FriendsGrid';
import AboutQA from './AboutQA';
import BadgeRow from './BadgeRow';
import FeaturedLinks from './FeaturedLinks';
import PaperBg from './backgrounds/PaperBg';
import GridBg from './backgrounds/GridBg';
import LeavesBg from './backgrounds/LeavesBg';
import SunsetBg from './backgrounds/SunsetBg';
import HalftoneBg from './backgrounds/HalftoneBg';

// Future tab slots — Storyline and Writing will replace these stubs
// when those components are ported from crossroads / packages/api hooks are wired.

export type ProfileTabId = 'storyline' | 'profile' | 'writing';

const TABS: { id: ProfileTabId; label: string }[] = [
  { id: 'storyline', label: 'Storyline' },
  { id: 'profile',   label: 'Profile' },
  { id: 'writing',   label: 'Writing' },
];

const BG_COMPONENTS: Record<string, React.ComponentType | null> = {
  none:     null,
  paper:    PaperBg,
  grid:     GridBg,
  leaves:   LeavesBg,
  sunset:   SunsetBg,
  halftone: HalftoneBg,
};

function SectionContent({ id, profile }: { id: SectionId; profile: ProfileDTO }) {
  switch (id) {
    case 'pinned':   return profile.pinned ? <PinnedShowcase pinned={profile.pinned} /> : null;
    case 'now':      return profile.nowPlaying ? <NowPlaying now={profile.nowPlaying} /> : null;
    case 'activity': return <ActivityFeed activity={profile.activity} />;
    case 'friends':  return <FriendsGrid friends={profile.friends} />;
    case 'qa':       return <AboutQA qa={profile.qa} />;
    case 'badges':   return <BadgeRow badges={profile.badges} />;
    case 'links':    return <FeaturedLinks links={profile.links} />;
    default:         return null;
  }
}

interface Props {
  profile: ProfileDTO;
  initialTab?: ProfileTabId;
}

export function ProfileTabShell({ profile, initialTab = 'profile' }: Props) {
  const [tab, setTab] = useState<ProfileTabId>(initialTab);

  const { theme, accent, font, background, density, sectionLayout } = profile;
  const BgComp = BG_COMPONENTS[background ?? 'none'];
  const rowGap = ROW_GAP[density ?? 'cozy'];
  const fontPair = FONT_PAIRS[font ?? 'editorial'];

  const cssVars: Record<string, string> = {
    ...THEMES[theme ?? 'paper'].tokens,
    '--accent':       accent,
    '--accent-ink':   computeAccentInk(accent),
    '--font-display': fontPair.display,
    '--font-body':    fontPair.body,
  };

  const profileSections = (sectionLayout ?? []).filter(s => s.visible && s.id !== 'header');

  return (
    <div
      data-theme={theme}
      data-font={font}
      data-density={density}
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
        ...cssVars,
      }}
    >
      {BgComp && <BgComp />}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto' }}>

        {/* Identity card — always visible above tabs */}
        <ProfileHeader profile={profile} />

        {/* Tab navigation */}
        <div style={{ borderBottom: '1px solid var(--rule)', display: 'flex', paddingLeft: 8 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1,
                background: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: tab === t.id ? 600 : 400,
                color: tab === t.id ? 'var(--ink)' : 'var(--ink-soft)',
                fontFamily: 'var(--font-body)',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '28px 20px 48px', display: 'flex', flexDirection: 'column', gap: rowGap }}>

          {tab === 'storyline' && (
            // @stub — will mount WritingSection (StorylineFeed + StreamsFeed + ComposerPane)
            // once crossroads Storyline components are lifted into a shared location.
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-soft)', fontSize: 15 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Storyline</p>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>Coming soon — Leaf posts and Streams will appear here.</p>
            </div>
          )}

          {tab === 'profile' && profileSections.map(entry => (
            <SectionContent key={entry.id} id={entry.id as SectionId} profile={profile} />
          ))}

          {tab === 'writing' && (
            // @stub — will mount the member's published writing list (WritingPiece, shelves).
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-soft)', fontSize: 15 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Writing</p>
              <p style={{ margin: '8px 0 0', fontSize: 13 }}>Published pieces and shelves will appear here.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

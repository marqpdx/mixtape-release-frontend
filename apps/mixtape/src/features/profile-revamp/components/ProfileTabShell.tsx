'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WritingSection, ComposerProvider, ComposerPane } from '@mixtape/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import type { ProfileDTO, SectionId, SectionEntry } from '../api/types';
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
import { useProfilePatch } from '../hooks/useProfilePatch';
import { useSectionReorder } from '../hooks/useSectionReorder';
import * as stackroomApi from '@mixtape/api/clients/stackroom/stackroomApi';
import { AboutSection }       from './profile200/AboutSection';
import { RightNowSection }    from './profile200/RightNowSection';
import { VoicePlayer200 }     from './profile200/VoicePlayer200';
import { TagCloud }           from './profile200/TagCloud';
import { PromptCards }        from './profile200/PromptCards';
import { FullBio }            from './profile200/FullBio';
import { QuickLinks200 }      from './profile200/QuickLinks200';

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

// ── Writing tab ──────────────────────────────────────────────────────────────

function WritingTab({ username }: { username: string }) {
  const { data: shelves = [], isLoading } = useQuery({
    queryKey: ['stackroom', 'libraries', 'public', username],
    queryFn: () => stackroomApi.fetchPublicLibrariesByUsername(username, 'writing'),
    staleTime: 2 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-soft)', fontSize: 14 }}>
        Loading writing…
      </div>
    );
  }

  if (!shelves.length) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-soft)', fontSize: 15 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>Nothing published yet.</p>
        <p style={{ margin: '8px 0 0', fontSize: 13 }}>Check back later for published writing and shelves.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {shelves.map(shelf => (
        <a
          key={shelf.id}
          href={`/member/${username}/library/${shelf.slug}`}
          style={{
            display: 'block',
            padding: '14px 18px',
            borderRadius: 8,
            border: '1px solid var(--rule)',
            background: 'var(--surface)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'border-color 0.15s',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{shelf.title}</div>
          {shelf.summary && (
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4, lineHeight: 1.45 }}>
              {shelf.summary}
            </div>
          )}
        </a>
      ))}
    </div>
  );
}

// ── Visibility badge (owner-only) ────────────────────────────────────────────

function VisibilityBadge({
  entry,
  onToggle,
}: {
  entry: SectionEntry;
  onToggle: (id: string, next: 'public' | 'members') => void;
}) {
  const v = entry.visibility ?? 'public';
  return (
    <button
      onClick={() => onToggle(entry.id, v === 'public' ? 'members' : 'public')}
      title={
        v === 'public'
          ? 'Public — click to restrict to members only'
          : 'Members only — click to make public'
      }
      style={{
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 10,
        border: '1px solid var(--rule)',
        background: v === 'members' ? 'var(--surface)' : 'transparent',
        color: 'var(--ink-soft)',
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
      }}
    >
      {v === 'public' ? '🌐 Public' : '🔒 Members'}
    </button>
  );
}

// ── Shell ────────────────────────────────────────────────────────────────────

interface Props {
  profile: ProfileDTO;
  initialTab?: ProfileTabId;
}

export function ProfileTabShell({ profile, initialTab = 'profile' }: Props) {
  const [tab, setTab] = useState<ProfileTabId>(initialTab);
  const { user } = useAuth();
  const isOwner = user?.username === profile.username;

  // Local layout state — lets visibility toggles reflect immediately without a page reload.
  const [localLayout, setLocalLayout] = useState<SectionEntry[]>(profile.sectionLayout ?? []);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'error' | null>(null);

  const patchMutation = useProfilePatch();
  const reorderMutation = useSectionReorder();

  function handlePatch(patch: Partial<ProfileDTO>) {
    patchMutation.mutate(patch as Parameters<typeof patchMutation.mutate>[0], {
      onSuccess: () => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      },
      onError: () => {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 3000);
      },
    });
  }

  function handleVisibilityToggle(id: string, next: 'public' | 'members') {
    const updated = localLayout.map(s => s.id === id ? { ...s, visibility: next } : s);
    setLocalLayout(updated);
    reorderMutation.mutate(updated, {
      onSuccess: () => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 2000);
      },
    });
  }

  const { theme, accent, font, background, density } = profile;
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

  // Determine which sections to show based on auth + ownership
  const visibleSections = localLayout.filter(s => {
    if (!s.visible || s.id === 'header') return false;
    if (isOwner) return true;
    if (s.visibility === 'members') return !!user; // authenticated members only
    return true; // 'public' or undefined
  });

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
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto' }}>

        {/* Identity card — always visible above tabs */}
        <ProfileHeader
          profile={profile}
          isEditor={isOwner}
          onPatch={isOwner ? handlePatch : undefined}
        />

        {/* Tab navigation + save indicator */}
        <div style={{ borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
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
          {saveStatus && (
            <span
              style={{
                marginLeft: 'auto',
                marginRight: 12,
                fontSize: 12,
                color: saveStatus === 'saved' ? 'var(--accent)' : '#c0392b',
                transition: 'opacity 0.3s',
              }}
            >
              {saveStatus === 'saved' ? '✓ Saved' : '✗ Error saving'}
            </span>
          )}
        </div>

        {/* Tab content */}
        <div style={{ padding: '28px 20px 48px', display: 'flex', flexDirection: 'column', gap: rowGap }}>

          {tab === 'storyline' && (
            <ComposerProvider>
              <WritingSection
                isOwner={isOwner}
                showStreams={isOwner}
                showFollowButton={!isOwner && !!user}
                userId={profile.username}
                currentUsername={user?.username}
              />
              {isOwner && <ComposerPane />}
            </ComposerProvider>
          )}

          {tab === 'profile' && (
            <div
              className="p200-content-root"
              style={{
                '--bg':       '#e8eadf',
                '--ink':      '#1b2a20',
                '--ink-2':    '#3f5246',
                '--ink-3':    '#6f7d72',
                '--surface':  '#f4f5ec',
                '--surface-2':'#edefe3',
                '--line':     'color-mix(in oklab, #1b2a20 13%, transparent)',
                '--accent':   '#b4561f',
                '--warm':     '#f4ecd6',
                '--radius':   '16px',
                background:   'var(--bg)',
                maxWidth:     664,
                margin:       '0 auto',
                padding:      '32px 0 64px',
                display:      'flex',
                flexDirection:'column',
                gap:          30,
              } as React.CSSProperties}
            >
              {profile.quickIntro   && <AboutSection quickIntro={profile.quickIntro} />}
              {profile.status       && <RightNowSection status={profile.status} />}
              {profile.introVoiceUrl && (
                <VoicePlayer200 src={profile.introVoiceUrl} displayName={profile.displayName} />
              )}
              {(profile.skills.length > 0 || profile.workAreas.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 22 }}>
                  {profile.skills.length     > 0 && <TagCloud heading="Skills"       tags={profile.skills} />}
                  {profile.workAreas.length  > 0 && <TagCloud heading="Focus areas"  tags={profile.workAreas} />}
                </div>
              )}
              {(profile.whoAreYou || profile.whyAreYouHere) && (
                <PromptCards whoAreYou={profile.whoAreYou} whyAreYouHere={profile.whyAreYouHere} />
              )}
              {profile.bio && <FullBio bio={profile.bio} />}
              {(profile.links.length > 0 || profile.quickLink) && (
                <QuickLinks200 links={profile.links} quickLink={profile.quickLink || undefined} />
              )}
            </div>
          )}

          {tab === 'writing' && <WritingTab username={profile.username} />}

        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { WritingSection, ComposerProvider, ComposerPane } from '@mixtape/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import type { ProfileDTO } from '../api/types';
import { ROW_GAP } from '../lib/themes';
import * as stackroomApi from '@mixtape/api/clients/stackroom/stackroomApi';
import { ProfileBanner200 }   from './profile200/ProfileBanner200';
import { ProfileIdentity200 } from './profile200/ProfileIdentity200';
import { ProfileEditButton }  from './ProfileEditButton';
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

// ── Shell ────────────────────────────────────────────────────────────────────

interface Props {
  profile: ProfileDTO;
  initialTab?: ProfileTabId;
  username?: string;
}

export function ProfileTabShell({ profile, initialTab = 'profile', username }: Props) {
  const [tab, setTab] = useState<ProfileTabId>(initialTab);
  const { user } = useAuth();
  const isOwner = user?.username === profile.username;

  const { density } = profile;
  const rowGap = ROW_GAP[density ?? 'cozy'];

  // role = "Practice Area · Location" from serializer — split for identity display
  const roleParts  = (profile.role ?? '').split(' · ');
  const practiceArea = roleParts[0] || undefined;
  const location     = roleParts[1] || undefined;

  const p200Vars: React.CSSProperties = {
    '--bg':        '#e8eadf',
    '--ink':       '#1b2a20',
    '--ink-2':     '#3f5246',
    '--ink-3':     '#6f7d72',
    '--surface':   '#f4f5ec',
    '--surface-2': '#edefe3',
    '--line':      'color-mix(in oklab, #1b2a20 13%, transparent)',
    '--accent':    '#b4561f',
    '--warm':      '#f4ecd6',
    '--radius':    '16px',
  } as React.CSSProperties;

  return (
    <div
      className="p200-shell"
      style={{
        ...p200Vars,
        position:   'relative',
        minHeight:  '100vh',
        background: 'var(--bg)',
        color:      'var(--ink)',
        fontFamily: 'var(--font-head)',
      }}
    >
      {/* Full-bleed banner */}
      <ProfileBanner200 backgroundImageUrl={profile.backgroundImageUrl} />

      {/* Page content — max-width container */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 44px' }}>

        {/* Identity — avatar overlaps banner with negative margin; edit button pinned bottom-right */}
        <div style={{ marginTop: -58, position: 'relative' }}>
          <ProfileIdentity200
            displayName={profile.displayName}
            practiceArea={practiceArea}
            location={location}
            avatarUrl={profile.avatarUrl}
            isOwner={isOwner}
            username={profile.username}
          />
          {username && (
            <div style={{ position: 'absolute', bottom: -12, right: 0 }}>
              <ProfileEditButton username={username} />
            </div>
          )}
        </div>

        {/* Tab navigation */}
        <div style={{ marginTop: 24, borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center' }}>
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
                color: tab === t.id ? 'var(--ink)' : 'var(--ink-3)',
                fontFamily: 'var(--font-head)',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '0 0 48px', display: 'flex', flexDirection: 'column', gap: rowGap }}>

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
                maxWidth:      780,
                margin:        '0 auto',
                padding:       '32px 0 64px',
                display:       'flex',
                flexDirection: 'column',
                gap:           30,
                width:         '100%',
              }}
            >
              {profile.quickIntro    && <AboutSection quickIntro={profile.quickIntro} />}
              {profile.status        && <RightNowSection status={profile.status} />}
              {profile.introVoiceUrl && (
                <VoicePlayer200 src={profile.introVoiceUrl} displayName={profile.displayName} />
              )}
              {((profile.skills?.length ?? 0) > 0 || (profile.workAreas?.length ?? 0) > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 22 }}>
                  {(profile.skills?.length ?? 0)    > 0 && <TagCloud heading="Skills"      tags={profile.skills} />}
                  {(profile.workAreas?.length ?? 0) > 0 && <TagCloud heading="Focus areas" tags={profile.workAreas} />}
                </div>
              )}
              {(profile.whoAreYou || profile.whyAreYouHere) && (
                <PromptCards whoAreYou={profile.whoAreYou} whyAreYouHere={profile.whyAreYouHere} />
              )}
              {profile.bio && <FullBio bio={profile.bio} />}
              {((profile.links?.length ?? 0) > 0 || profile.quickLink) && (
                <QuickLinks200 links={profile.links ?? []} quickLink={profile.quickLink || undefined} />
              )}
            </div>
          )}

          {tab === 'writing' && (
            <div style={{ paddingTop: 28 }}>
              <WritingTab username={profile.username} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// OG image for /member/handle/{username}
// Rendered at 1200×630 via next/og. Fetches profile data server-side.

import { ImageResponse } from 'next/og';
import { fetchPublicProfile } from '@/features/profile-revamp/api/client';
import { THEMES } from '@/features/profile-revamp/lib/themes';

export const runtime = 'edge';
export const alt = 'Mixtape member profile';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

type Params = Promise<{ username: string }>;

export default async function ProfileOGImage({ params }: { params: Params }) {
  const { username } = await params;

  let displayName = username;
  let role = '';
  let bio = '';
  let avatarUrl: string | null = null;
  let themeKey: keyof typeof THEMES = 'paper';
  let accent = '#c2410c';
  let accentInk = '#fff7ed';

  try {
    const profile = await fetchPublicProfile(username);
    displayName = profile.displayName || username;
    role = profile.role || '';
    bio = profile.bio ? profile.bio.slice(0, 120) : '';
    avatarUrl = profile.avatarUrl || null;
    themeKey = (profile.theme as keyof typeof THEMES) ?? 'paper';
    accent = profile.accent ?? '#c2410c';
    const lum = (() => {
      const h = accent.replace('#', '');
      const n = parseInt(h, 16);
      const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      const lin = (c: number) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    })();
    accentInk = lum > 0.62 ? '#0e0d0a' : '#fff7ed';
  } catch {
    // fall through to defaults
  }

  const tokens = THEMES[themeKey].tokens;
  const bg      = tokens['--bg'];
  const surface = tokens['--surface'];
  const ink     = tokens['--ink'];
  const inkSoft = tokens['--ink-soft'];
  const rule    = tokens['--rule'];

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: bg,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '56px 72px',
          position: 'relative',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* accent bar top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: accent, display: 'flex' }} />

        {/* avatar */}
        {avatarUrl && (
          <img
            src={avatarUrl}
            width={96}
            height={96}
            style={{
              position: 'absolute',
              top: 56,
              right: 72,
              borderRadius: '50%',
              objectFit: 'cover',
              border: `3px solid ${rule}`,
            }}
          />
        )}

        {/* wordmark */}
        <div style={{ position: 'absolute', top: 56, left: 72, fontSize: 14, letterSpacing: '0.15em', textTransform: 'uppercase', color: inkSoft, display: 'flex' }}>
          Mixtape
        </div>

        {/* content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 800 }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: ink, lineHeight: 1.05, display: 'flex' }}>
            {displayName}
          </div>
          {role && (
            <div style={{ fontSize: 18, color: inkSoft, display: 'flex' }}>
              {role}
            </div>
          )}
          {bio && (
            <div style={{ fontSize: 18, color: ink, lineHeight: 1.4, marginTop: 8, display: 'flex' }}>
              {bio}{bio.length >= 120 ? '…' : ''}
            </div>
          )}
        </div>

        {/* follow chip */}
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            right: 72,
            background: accent,
            color: accentInk,
            borderRadius: 999,
            padding: '10px 24px',
            fontSize: 15,
            fontWeight: 700,
            display: 'flex',
          }}
        >
          Follow on Mixtape
        </div>

        {/* surface card underlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: surface,
            display: 'flex',
          }}
        />
      </div>
    ),
    { ...size }
  );
}

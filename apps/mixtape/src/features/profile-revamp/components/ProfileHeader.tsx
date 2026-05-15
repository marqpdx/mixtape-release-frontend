import Image from 'next/image';
import type { ProfileDTO } from '../api/types';

interface Props {
  profile: ProfileDTO;
  isEditor?: boolean;
}

export default function ProfileHeader({ profile, isEditor }: Props) {
  const { displayName, role, bio, status, avatarUrl, avatarSticker, stats, avatarShape } = profile;

  const avatarBorderRadius = {
    rounded: '24px',
    circle:  '50%',
    square:  '0px',
    blob:    '60% 40% 55% 45% / 45% 55% 45% 55%',
  }[avatarShape ?? 'rounded'];

  return (
    <header style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: 96, height: 96,
            borderRadius: avatarBorderRadius,
            overflow: 'hidden',
            background: 'var(--surface)',
            border: '2px solid var(--rule)',
          }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} width={96} height={96} style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'var(--ink-soft)' }}>
              {displayName?.[0] ?? '?'}
            </div>
          )}
        </div>
        {avatarSticker && (
          <span style={{ position: 'absolute', bottom: -4, right: -4, fontSize: 20, lineHeight: 1 }}>{avatarSticker}</span>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 200 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>
          {isEditor ? (
            <span contentEditable suppressContentEditableWarning data-field="displayName">{displayName}</span>
          ) : displayName}
        </h1>
        {role && <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--ink-soft)' }}>{role}</p>}
        {status && (
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink)', fontStyle: 'italic' }}>
            {isEditor ? (
              <span contentEditable suppressContentEditableWarning data-field="status">{status}</span>
            ) : status}
          </p>
        )}
        {bio && (
          <p style={{ margin: '10px 0 0', fontSize: 15, color: 'var(--ink)', lineHeight: 1.55 }}>
            {isEditor ? (
              <span contentEditable suppressContentEditableWarning data-field="bio">{bio}</span>
            ) : bio}
          </p>
        )}

        <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'followers', value: stats.followers },
            { label: 'following', value: stats.following },
            { label: 'mixtapes',  value: String(stats.mixtapes) },
            { label: 'joined',    value: stats.joined },
          ].map(stat => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{stat.value}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{stat.label}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            style={{
              padding: '8px 20px',
              borderRadius: 'var(--btn-radius)',
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              border: 'none',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              minWidth: 44, minHeight: 44,
            }}
          >
            Follow
          </button>
          <button style={{ padding: '8px 20px', borderRadius: 'var(--btn-radius)', background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--rule)', fontWeight: 600, fontSize: 14, cursor: 'pointer', minWidth: 44, minHeight: 44 }}>Message</button>
          <button style={{ padding: '8px 16px', borderRadius: 'var(--btn-radius)', background: 'transparent', color: 'var(--ink)', border: '1.5px solid var(--rule)', fontWeight: 600, fontSize: 14, cursor: 'pointer', minWidth: 44, minHeight: 44 }}>Share</button>
        </div>
      </div>
    </header>
  );
}

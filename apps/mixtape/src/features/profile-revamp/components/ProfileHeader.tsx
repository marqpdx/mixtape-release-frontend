'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { ProfileDTO } from '../api/types';
import EditableText from '../editor/inline/EditableText';

interface Props {
  profile: ProfileDTO;
  isEditor?: boolean;
  onPatch?: (patch: Partial<ProfileDTO>) => void;
}

export default function ProfileHeader({ profile, isEditor, onPatch }: Props) {
  const { displayName, role, bio, status, avatarUrl, backgroundImageUrl, introVoiceUrl, introVoiceTranscript, avatarSticker, stats, avatarShape } = profile;
  const [transcriptOpen, setTranscriptOpen] = useState(false);

  function commit(field: string, value: string) {
    onPatch?.({ [field]: value } as Partial<ProfileDTO>);
  }

  const avatarBorderRadius = {
    rounded: '24px',
    circle:  '50%',
    square:  '0px',
    blob:    '60% 40% 55% 45% / 45% 55% 45% 55%',
  }[avatarShape ?? 'rounded'];

  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Banner */}
      <div
        style={{
          width: '100%',
          height: 160,
          background: backgroundImageUrl ? undefined : 'var(--surface)',
          borderBottom: backgroundImageUrl ? 'none' : '1px solid var(--rule)',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {backgroundImageUrl && (
          <Image
            src={backgroundImageUrl}
            alt=""
            fill
            style={{ objectFit: 'cover' }}
            priority
          />
        )}
        {/* accent bar overlay at bottom of banner */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--accent)' }} />
      </div>

      {/* Avatar + content row */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start', padding: '0 24px 24px', marginTop: -48 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: 96, height: 96,
              borderRadius: avatarBorderRadius,
              overflow: 'hidden',
              background: 'var(--surface)',
              border: '3px solid var(--bg)',
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

        <div style={{ flex: 1, minWidth: 200, paddingTop: 52 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--ink)' }}>
            {isEditor ? (
              <EditableText value={displayName} field="displayName" maxLength={48} onCommit={commit} />
            ) : displayName}
          </h1>
          {role && <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--ink-soft)' }}>{role}</p>}
          {(status || isEditor) && (
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink)', fontStyle: 'italic' }}>
              {isEditor ? (
                <EditableText value={status || ''} field="status" maxLength={200} onCommit={commit} style={{ fontStyle: 'italic' }} />
              ) : status}
            </p>
          )}
          {(bio || isEditor) && (
            <p style={{ margin: '10px 0 0', fontSize: 15, color: 'var(--ink)', lineHeight: 1.55 }}>
              {isEditor ? (
                <EditableText value={bio || ''} field="bio" maxLength={2000} multiline onCommit={commit} />
              ) : bio}
            </p>
          )}

          {introVoiceUrl && (
            <div style={{ marginTop: 12 }}>
              <audio
                controls
                src={introVoiceUrl}
                style={{ width: '100%', maxWidth: 340, height: 36, accentColor: 'var(--accent)' }}
              />
              {introVoiceTranscript && (
                <div style={{ marginTop: 4 }}>
                  <button
                    onClick={() => setTranscriptOpen(o => !o)}
                    style={{ fontSize: 12, color: 'var(--ink-soft)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                  >
                    {transcriptOpen ? 'Hide transcript' : 'Show transcript'}
                  </button>
                  {transcriptOpen && (
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, fontStyle: 'italic' }}>
                      {introVoiceTranscript}
                    </p>
                  )}
                </div>
              )}
            </div>
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
      </div>
    </header>
  );
}

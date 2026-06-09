'use client';

import { useState } from 'react';
import Image from 'next/image';
import { IconMapPin } from '@tabler/icons-react';

interface ProfileIdentity200Props {
  displayName: string;
  practiceArea?: string;
  location?: string;
  avatarUrl: string | null;
  isOwner?: boolean;
  username: string;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function ProfileIdentity200({
  displayName,
  practiceArea,
  location,
  avatarUrl,
  isOwner,
  username,
}: ProfileIdentity200Props) {
  const [editHovered, setEditHovered] = useState(false);

  return (
    <div className="p200-identity-root" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Avatar — pulled up into banner via margin-top on the parent layout */}
      <div style={{
        width: 98,
        height: 98,
        borderRadius: 26,
        border: '4px solid var(--surface)',
        boxShadow: '0 7px 20px rgba(0,0,0,.16)',
        overflow: 'hidden',
        flexShrink: 0,
        background: 'linear-gradient(150deg, #5d6f50, #384a35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            fill
            style={{ objectFit: 'cover' }}
            sizes="98px"
          />
        ) : (
          <span style={{
            fontFamily: 'var(--font-head)',
            fontWeight: 800,
            fontSize: 31,
            color: '#f1efe2',
            userSelect: 'none',
          }}>
            {initials(displayName)}
          </span>
        )}
      </div>

      {/* Name */}
      <h1 style={{
        fontFamily: 'var(--font-head)',
        fontWeight: 800,
        fontSize: 34,
        letterSpacing: '-0.012em',
        lineHeight: 1.05,
        color: 'var(--ink)',
        margin: '16px 0 0 0',
      }}>
        {displayName}
      </h1>

      {/* Practice area */}
      {practiceArea && (
        <p style={{
          fontWeight: 600,
          fontSize: 16.5,
          color: 'var(--ink-2)',
          marginTop: 7,
          marginBottom: 0,
        }}>
          {practiceArea}
        </p>
      )}

      {/* Location badge */}
      {location && (
        <div style={{
          marginTop: 12,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: 'var(--surface-2)',
          border: '1px solid var(--line)',
          borderRadius: 999,
          padding: '5px 13px 5px 10px',
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--ink-2)',
          whiteSpace: 'nowrap',
          alignSelf: 'flex-start',
        }}>
          <IconMapPin size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          {location}
        </div>
      )}

      {/* Edit profile button — owner only */}
      {isOwner && (
        <a
          href={`/member/${username}/edit`}
          onMouseEnter={() => setEditHovered(true)}
          onMouseLeave={() => setEditHovered(false)}
          style={{
            marginTop: 18,
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            background: editHovered ? '#fff' : 'var(--surface)',
            border: `1px solid ${editHovered ? 'var(--accent)' : 'color-mix(in srgb, var(--ink) 20%, transparent)'}`,
            borderRadius: 999,
            padding: '10px 22px',
            fontWeight: 600,
            fontSize: 14.5,
            color: editHovered ? 'var(--accent)' : 'var(--ink)',
            textDecoration: 'none',
            transition: 'color 0.15s, border-color 0.15s, background 0.15s',
            cursor: 'pointer',
          }}
        >
          Edit profile
        </a>
      )}
    </div>
  );
}

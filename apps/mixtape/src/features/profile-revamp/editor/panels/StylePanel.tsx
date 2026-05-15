'use client';
import type { ProfileDTO, ThemeKey, FontKey } from '../../api/types';
import { THEMES, FONT_PAIRS } from '../../lib/themes';
import ThemeCard from '../controls/ThemeCard';
import AccentSwatch from '../controls/AccentSwatch';
import FontCard from '../controls/FontCard';

interface Props {
  profile: ProfileDTO;
  onPatch: (patch: Partial<ProfileDTO>) => void;
}

export default function StylePanel({ profile, onPatch }: Props) {
  const themeAccents = THEMES[profile.theme]?.accents ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 2px' }}>
      <section>
        <h4 style={{ margin: '0 0 10px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>Theme</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(Object.keys(THEMES) as ThemeKey[]).map(key => (
            <ThemeCard
              key={key}
              themeKey={key}
              def={THEMES[key]}
              selected={profile.theme === key}
              onSelect={t => onPatch({ theme: t })}
            />
          ))}
        </div>
      </section>

      <section>
        <h4 style={{ margin: '0 0 10px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>Accent</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {themeAccents.map(color => (
            <AccentSwatch
              key={color}
              color={color}
              selected={profile.accent === color}
              onSelect={a => onPatch({ accent: a })}
            />
          ))}
        </div>
      </section>

      <section>
        <h4 style={{ margin: '0 0 10px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>Font</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {(Object.keys(FONT_PAIRS) as FontKey[]).map(key => (
            <FontCard
              key={key}
              fontKey={key}
              def={FONT_PAIRS[key]}
              selected={profile.font === key}
              onSelect={f => onPatch({ font: f })}
            />
          ))}
        </div>
      </section>

      <section>
        <h4 style={{ margin: '0 0 10px', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-soft)' }}>Density</h4>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['compact', 'cozy', 'roomy'] as const).map(d => (
            <button
              key={d}
              onClick={() => onPatch({ density: d })}
              aria-pressed={profile.density === d}
              style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, cursor: 'pointer',
                border: profile.density === d ? '2px solid var(--accent)' : '1.5px solid var(--rule)',
                background: profile.density === d ? 'var(--accent)' : 'transparent',
                color: profile.density === d ? 'var(--accent-ink)' : 'var(--ink)',
                minWidth: 44, minHeight: 44,
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

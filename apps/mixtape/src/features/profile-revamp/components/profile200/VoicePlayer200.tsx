'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { IconPlayerPlayFilled, IconPlayerPauseFilled } from '@tabler/icons-react';

interface VoicePlayer200Props {
  src: string;
  displayName: string;
}

const BAR_COUNT = 54;

// Stable pseudo-random envelope — deterministic per index, tapered at ends
function barHeight(i: number): number {
  const center = (BAR_COUNT - 1) / 2;
  const taper = 1 - Math.pow((i - center) / center, 4) * 0.6;
  const noise = Math.abs(Math.sin(i * 2.3 + i * i * 0.07 + 1.4)) * 0.7 +
                Math.abs(Math.sin(i * 1.1 + 0.9)) * 0.3;
  return Math.max(0.08, Math.min(1, noise * taper));
}

const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => barHeight(i));

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoicePlayer200({ src, displayName }: VoicePlayer200Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const [duration, setDuration] = useState(0);
  const [current, setCurrent]   = useState(0);
  const [btnHovered, setBtnHovered] = useState(false);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else         { a.play(); setPlaying(true); }
  }, [playing]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => {
      if (a.duration) {
        setProgress(a.currentTime / a.duration);
        setCurrent(a.currentTime);
      }
    };
    const onMeta  = () => setDuration(a.duration);
    const onEnded = () => { setPlaying(false); setProgress(0); setCurrent(0); };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnded);
    };
  }, []);

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    a.currentTime = ratio * a.duration;
    setProgress(ratio);
  }

  const playHead = Math.round(progress * BAR_COUNT);

  return (
    <>
      <style>{`
        @keyframes p200-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes p200-eq {
          0%, 100% { transform: scaleY(0.78); }
          50%       { transform: scaleY(1.06); }
        }
        @media (prefers-reduced-motion: reduce) {
          .p200-vp-ring { animation: none !important; }
          .p200-vp-bar  { animation: none !important; }
        }
      `}</style>
      <audio ref={audioRef} src={src} preload="metadata" />
      <div
        className="p200-voiceplayer-root"
        style={{
          display: 'flex',
          gap: 18,
          alignItems: 'center',
          background: 'var(--surface)',
          border: `1px solid ${playing
            ? 'color-mix(in srgb, var(--accent) 45%, var(--line))'
            : 'var(--line)'}`,
          borderRadius: 'calc(var(--radius) + 4px)',
          padding: '18px 22px',
          boxShadow: playing ? '0 6px 22px rgba(27,42,32,.07)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Play button */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={toggle}
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            aria-label={playing ? 'Pause' : 'Play'}
            style={{
              width: 62,
              height: 62,
              borderRadius: '50%',
              background: 'var(--accent)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f7f1e6',
              transform: btnHovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.15s',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {playing
              ? <IconPlayerPauseFilled size={24} />
              : <IconPlayerPlayFilled size={24} />
            }
          </button>
          {playing && (
            <div
              className="p200-vp-ring"
              style={{
                position: 'absolute',
                inset: -4,
                borderRadius: '50%',
                border: '2px solid var(--accent)',
                animation: 'p200-ring 1.8s ease-out infinite',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Right: title + time + waveform */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{
              fontFamily: 'var(--font-head)',
              fontWeight: 700,
              fontSize: 15.5,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: 'var(--ink)',
            }}>
              Hear from {displayName}
            </span>
            <span style={{
              fontVariantNumeric: 'tabular-nums',
              fontSize: 12.5,
              color: 'var(--ink-3)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {fmt(current)} / {fmt(duration)}
            </span>
          </div>

          {/* Waveform */}
          <div
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            onClick={seek}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 3,
              height: 42,
              cursor: 'pointer',
            }}
          >
            {BAR_HEIGHTS.map((h, i) => {
              const played = i < playHead;
              return (
                <div
                  key={i}
                  className={played && playing ? 'p200-vp-bar' : undefined}
                  style={{
                    flex: 1,
                    height: `${h * 100}%`,
                    borderRadius: 2,
                    background: played
                      ? 'var(--accent)'
                      : 'color-mix(in srgb, var(--ink) 20%, transparent)',
                    transformOrigin: 'bottom',
                    animation: (played && playing)
                      ? `p200-eq 1.1s ease-in-out ${(i * 0.02).toFixed(2)}s infinite alternate`
                      : 'none',
                    transition: 'background 0.1s',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

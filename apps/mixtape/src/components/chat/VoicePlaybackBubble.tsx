'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { IconPlayerPlayFilled, IconPlayerPauseFilled } from '@tabler/icons-react';
import { decryptBlob } from '@mixtape/core/crypto/primitives';

interface VoicePlaybackBubbleProps {
  audioUrl: string;
  durationSeconds: number | null;
  transcript?: string | null;
  transcriptStatus?: 'pending' | 'done' | 'failed' | null;
  variant?: 'sent' | 'received' | 'neutral';
  /** LW-C3: base64 AES-GCM IV — set when audioUrl points at E2E ciphertext. */
  audioIv?: string | null;
  /** LW-C4: conversation key version that encrypted the audio. Defaults to 1. */
  audioKeyVersion?: number | null;
  /** Resolves the conversation key for a given version. Required when audioIv is set. */
  getKeyForVersion?: (version: number) => Promise<CryptoKey | null>;
}

const BAR_COUNT = 10;

function barHeight(i: number): number {
  return Math.max(0.15, Math.abs(Math.sin(i * 1.7 + 0.9)) * 0.65 + Math.abs(Math.sin(i * 0.5 + 1.4)) * 0.35);
}

const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => barHeight(i));

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoicePlaybackBubble({
  audioUrl,
  durationSeconds,
  transcript,
  transcriptStatus,
  variant = 'received',
  audioIv,
  audioKeyVersion,
  getKeyForVersion,
}: VoicePlaybackBubbleProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState(false);

  // LW-C3/C4: fetch ciphertext, resolve the key version that encrypted it
  // (may predate the conversation's current rotation), and decrypt to a
  // local blob: URL before <audio> can play it.
  useEffect(() => {
    if (!audioIv || !getKeyForVersion) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      try {
        const key = await getKeyForVersion(audioKeyVersion ?? 1);
        if (!key) throw new Error("No key available for this audio's key version");
        const res = await fetch(audioUrl);
        const ciphertext = await res.blob();
        const plain = await decryptBlob(key, ciphertext, audioIv);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(plain);
        setDecryptedUrl(objectUrl);
      } catch {
        if (!cancelled) setDecryptError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [audioUrl, audioIv, audioKeyVersion, getKeyForVersion]);

  const playableUrl = audioIv ? decryptedUrl : audioUrl;

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setCurrent(a.currentTime);
    const onMeta = () => { if (a.duration && isFinite(a.duration)) setDuration(a.duration); };
    const onEnded = () => { setPlaying(false); setCurrent(0); };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnded);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnded);
    };
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !playableUrl) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { void a.play(); setPlaying(true); }
  }, [playing, playableUrl]);

  const isSent = variant === 'sent';
  const isNeutral = variant === 'neutral';

  const bubbleBg = isSent
    ? 'var(--theme-accent)'
    : isNeutral
    ? 'var(--theme-surface)'
    : 'var(--theme-bg)';
  const bubbleBorder = isSent ? 'none' : '1px solid var(--theme-border)';
  const textColor = isSent ? 'var(--theme-accent-text)' : 'var(--theme-text)';
  const dimColor = isSent
    ? 'color-mix(in srgb, var(--theme-accent-text) 65%, transparent)'
    : 'var(--theme-text-secondary)';
  const btnBg = isSent
    ? 'color-mix(in srgb, var(--theme-accent-text) 22%, transparent)'
    : 'var(--theme-accent)';
  const barPlayed = isSent
    ? 'color-mix(in srgb, var(--theme-accent-text) 90%, transparent)'
    : 'var(--theme-accent)';
  const barUnplayed = isSent
    ? 'color-mix(in srgb, var(--theme-accent-text) 35%, transparent)'
    : 'var(--theme-border)';

  const playHead = duration > 0 ? Math.round((current / duration) * BAR_COUNT) : 0;
  const timeLabel = playing || current > 0 ? fmt(current) : fmt(duration);

  return (
    <Box
      className="vpb-root"
      display="inline-block"
      bg={bubbleBg}
      border={bubbleBorder}
      borderRadius="18px"
      borderBottomRightRadius={isSent ? '4px' : '18px'}
      borderBottomLeftRadius={!isSent && !isNeutral ? '4px' : '18px'}
      px={3}
      py="10px"
      maxW="260px"
      minW="180px"
    >
      {playableUrl && <audio ref={audioRef} src={playableUrl} preload="metadata" />}

      <HStack gap={2} align="center">
        <button
          onClick={toggle}
          disabled={!playableUrl}
          aria-label={playing ? 'Pause voice message' : 'Play voice message'}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: btnBg,
            border: 'none',
            cursor: playableUrl ? 'pointer' : 'default',
            opacity: playableUrl ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSent ? 'var(--theme-accent-text)' : 'var(--theme-bg)',
            flexShrink: 0,
          }}
        >
          {playing
            ? <IconPlayerPauseFilled size={15} />
            : <IconPlayerPlayFilled size={15} />
          }
        </button>

        <Box flex={1} minW={0}>
          {/* Waveform */}
          <Box display="flex" alignItems="flex-end" gap="2.5px" height="26px" mb="4px">
            {BAR_HEIGHTS.map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h * 100}%`,
                  borderRadius: 2,
                  background: i < playHead ? barPlayed : barUnplayed,
                  transition: 'background var(--transition-duration, 0.1s)',
                }}
              />
            ))}
          </Box>
          <Text
            fontSize="11px"
            color={dimColor}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {audioIv && !playableUrl ? (decryptError ? 'Decryption failed' : 'Decrypting…') : timeLabel}
          </Text>
        </Box>
      </HStack>

      {/* Transcript row */}
      {transcriptStatus === 'pending' && (
        <Text fontSize="12px" color={dimColor} fontStyle="italic" mt={1}>
          Transcribing…
        </Text>
      )}
      {transcriptStatus === 'done' && transcript && (
        <Box mt={1}>
          <Text
            as="span"
            fontSize="11px"
            color={dimColor}
            cursor="pointer"
            textDecoration="underline"
            onClick={() => setShowTranscript((v) => !v)}
          >
            {showTranscript ? 'Hide transcript' : 'Show transcript'}
          </Text>
          {showTranscript && (
            <Text fontSize="13px" color={textColor} fontStyle="italic" mt="4px" lineHeight="1.4">
              {transcript}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}

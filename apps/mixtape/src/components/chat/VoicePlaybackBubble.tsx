'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';
import { IconPlayerPlayFilled, IconPlayerPauseFilled } from '@tabler/icons-react';

interface VoicePlaybackBubbleProps {
  audioUrl: string;
  durationSeconds: number | null;
  transcript?: string | null;
  transcriptStatus?: 'pending' | 'done' | 'failed' | null;
  variant?: 'sent' | 'received' | 'neutral';
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
}: VoicePlaybackBubbleProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [showTranscript, setShowTranscript] = useState(false);

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
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { void a.play(); setPlaying(true); }
  }, [playing]);

  const isSent = variant === 'sent';
  const isNeutral = variant === 'neutral';

  const bubbleBg = isSent ? '#0E5AA7' : isNeutral ? '#ECF4FB' : '#FFFFFF';
  const bubbleBorder = isSent ? 'none' : '1px solid #E0EAF3';
  const textColor = isSent ? '#FFFFFF' : '#13293D';
  const dimColor = isSent ? 'rgba(255,255,255,0.65)' : '#8A9BAB';
  const btnBg = isSent ? 'rgba(255,255,255,0.22)' : '#0E5AA7';
  const barPlayed = isSent ? 'rgba(255,255,255,0.9)' : '#0E5AA7';
  const barUnplayed = isSent ? 'rgba(255,255,255,0.35)' : '#B7C7D6';

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
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <HStack gap={2} align="center">
        <button
          onClick={toggle}
          aria-label={playing ? 'Pause voice message' : 'Play voice message'}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: btnBg,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
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
                  transition: 'background 0.1s',
                }}
              />
            ))}
          </Box>
          <Text
            fontSize="11px"
            color={dimColor}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {timeLabel}
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

import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';

interface VoicePlaybackBubbleProps {
  audioUrl: string;
  durationSeconds: number | null;
  transcript?: string | null;
  transcriptStatus?: 'pending' | 'done' | 'failed' | null;
  variant?: 'sent' | 'received' | 'neutral';
}

const WAVEFORM_HEIGHTS = [8, 14, 10, 18, 12, 16, 9, 14, 11, 17, 8, 13];

function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VoicePlaybackBubble({
  audioUrl,
  durationSeconds,
  transcript,
  transcriptStatus,
  variant = 'received',
}: VoicePlaybackBubbleProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
    };
  }, []);

  const togglePlayback = async () => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          (status) => {
            if (!status.isLoaded) return;
            setPosition(status.positionMillis / 1000);
            setIsPlaying(status.isPlaying ?? false);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
              soundRef.current?.setPositionAsync(0).catch(() => {});
            }
          }
        );
        soundRef.current = sound;
        setIsPlaying(true);
      } else if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch {
      // Silently fail — audio may be unavailable in this context
    }
  };

  const isSent = variant === 'sent';
  const displayDuration = isPlaying || position > 0
    ? formatDuration(position)
    : formatDuration(durationSeconds);

  return (
    <View style={[
      styles.bubble,
      variant === 'sent' && styles.bubbleSent,
      variant === 'received' && styles.bubbleReceived,
      variant === 'neutral' && styles.bubbleNeutral,
    ]}>
      {/* Playback row */}
      <View style={styles.playRow}>
        <TouchableOpacity onPress={togglePlayback} style={styles.playButton} activeOpacity={0.75}>
          <Text style={[styles.playIcon, isSent && styles.playIconSent]}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* Decorative waveform */}
        <View style={styles.waveform}>
          {WAVEFORM_HEIGHTS.map((h, i) => (
            <View
              key={i}
              style={[
                styles.bar,
                { height: h },
                isSent ? styles.barSent : styles.barReceived,
                isPlaying && i < Math.floor((position / (durationSeconds || 1)) * WAVEFORM_HEIGHTS.length) && styles.barPlayed,
              ]}
            />
          ))}
        </View>

        <Text style={[styles.duration, isSent && styles.durationSent]}>{displayDuration}</Text>
      </View>

      {/* Transcript section */}
      {transcriptStatus === 'pending' ? (
        <View style={styles.transcriptRow}>
          <ActivityIndicator size="small" color={isSent ? 'rgba(255,255,255,0.7)' : '#9AABBA'} />
          <Text style={[styles.transcriptLabel, isSent && styles.transcriptLabelSent]}>
            Transcribing…
          </Text>
        </View>
      ) : transcriptStatus === 'done' && transcript ? (
        <TouchableOpacity
          onPress={() => setTranscriptExpanded((v) => !v)}
          activeOpacity={0.75}
          style={styles.transcriptToggle}
        >
          <Text style={[styles.transcriptToggleText, isSent && styles.transcriptToggleTextSent]}>
            {transcriptExpanded ? '▲ Hide transcript' : '▼ Show transcript'}
          </Text>
          {transcriptExpanded ? (
            <Text style={[styles.transcriptText, isSent && styles.transcriptTextSent]}>
              {transcript}
            </Text>
          ) : null}
        </TouchableOpacity>
      ) : transcriptStatus === 'failed' ? (
        null // Silent per ADR — no error state shown to user
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    maxWidth: '80%',
  },
  bubbleSent: {
    backgroundColor: '#0E5AA7',
    borderBottomRightRadius: 4,
    alignSelf: 'flex-end',
  },
  bubbleReceived: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    alignSelf: 'flex-start',
  },
  bubbleNeutral: {
    backgroundColor: '#ECF4FB',
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 14,
    color: '#13293D',
  },
  playIconSent: {
    color: '#FFFFFF',
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 20,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#C9D4DE',
  },
  barSent: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  barReceived: {
    backgroundColor: '#B8C8D8',
  },
  barPlayed: {
    backgroundColor: '#FFFFFF',
    opacity: 0.9,
  },
  duration: {
    fontSize: 11,
    color: '#526170',
    minWidth: 32,
    textAlign: 'right',
  },
  durationSent: {
    color: 'rgba(255,255,255,0.75)',
  },
  transcriptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  transcriptLabel: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#7A8B99',
  },
  transcriptLabelSent: {
    color: 'rgba(255,255,255,0.6)',
  },
  transcriptToggle: {
    gap: 4,
  },
  transcriptToggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7A8B99',
  },
  transcriptToggleTextSent: {
    color: 'rgba(255,255,255,0.65)',
  },
  transcriptText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    color: '#526170',
  },
  transcriptTextSent: {
    color: 'rgba(255,255,255,0.8)',
  },
});

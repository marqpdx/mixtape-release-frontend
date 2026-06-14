import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNativeVoiceRecorder } from '../../hooks/useNativeVoiceRecorder';
import type { RecordedClip } from '../../hooks/useNativeVoiceRecorder';

export type { RecordedClip };

interface VoiceCaptureBarProps {
  onComplete: (clip: RecordedClip) => Promise<void> | void;
  onActiveChange?: (active: boolean) => void;
  submitLabel?: string;
  trailingIdleContent?: React.ReactNode;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const METER_THRESHOLDS = [0.2, 0.4, 0.6, 0.8];

export function VoiceCaptureBar({
  onComplete,
  onActiveChange,
  submitLabel = 'Voice',
  trailingIdleContent,
}: VoiceCaptureBarProps) {
  const [isSending, setIsSending] = useState(false);

  const {
    isPreparing,
    isRecording,
    isPaused,
    recordingSeconds,
    meterLevel,
    micError,
    canOpenSettings,
    maxDurationReached,
    startRecording,
    pauseRecording,
    resumeRecording,
    finalizeRecording,
    clearRecording,
  } = useNativeVoiceRecorder();

  const isActive = isRecording || isPaused || isPreparing || isSending;

  useEffect(() => {
    onActiveChange?.(isActive);
  }, [isActive, onActiveChange]);

  const handleSend = useCallback(async () => {
    if (!isRecording && !isPaused) return;
    const clip = await finalizeRecording();
    if (!clip) return;
    setIsSending(true);
    try {
      await onComplete(clip);
    } finally {
      setIsSending(false);
    }
  }, [finalizeRecording, isRecording, isPaused, onComplete]);

  const handleDiscard = useCallback(async () => {
    await clearRecording();
  }, [clearRecording]);

  if (isSending) {
    return (
      <View style={styles.bar}>
        <View style={styles.sendingRow}>
          <ActivityIndicator size="small" color="#0E5AA7" />
          <Text style={styles.sendingText}>Sending…</Text>
        </View>
      </View>
    );
  }

  if (isActive) {
    return (
      <View style={styles.bar}>
        {isPaused ? (
          <View style={styles.pausedCluster}>
            <TouchableOpacity
              onPress={handleDiscard}
              activeOpacity={0.85}
              style={styles.trashButton}
            >
              <Text style={styles.trashIcon}>🗑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void resumeRecording()}
              activeOpacity={0.85}
              style={[styles.secondaryButton, isPreparing && styles.buttonDisabled]}
              disabled={isPreparing}
            >
              <Text style={styles.secondaryButtonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => void pauseRecording()}
            activeOpacity={0.85}
            style={[styles.secondaryButton, isPreparing && styles.buttonDisabled]}
            disabled={isPreparing}
          >
            <Text style={styles.secondaryButtonText}>
              {isPreparing ? 'Starting…' : 'Pause'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.statusCenter}>
          <Text style={styles.timerText}>
            {maxDurationReached ? '5:00 · max reached' : formatDuration(recordingSeconds)}
          </Text>
          {isRecording ? (
            <View style={styles.meter}>
              {METER_THRESHOLDS.map((threshold, index) => (
                <View
                  key={threshold}
                  style={[
                    styles.meterBar,
                    meterLevel >= threshold && styles.meterBarActive,
                    meterLevel >= threshold && { height: 8 + index * 2 + meterLevel * 4 },
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => void handleSend()}
          activeOpacity={0.85}
          style={styles.sendButton}
        >
          <Text style={styles.sendButtonText}>➤ {submitLabel}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Idle state
  return (
    <>
      <View style={styles.bar}>
        <TouchableOpacity
          onPress={() => void startRecording()}
          activeOpacity={0.85}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>Record</Text>
        </TouchableOpacity>
        <View style={styles.spacer} />
        {trailingIdleContent ?? null}
      </View>
      {micError ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>{micError}</Text>
          {canOpenSettings ? (
            <TouchableOpacity onPress={() => void Linking.openSettings()} activeOpacity={0.8}>
              <Text style={styles.settingsLink}>Open settings</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 42,
    marginTop: 6,
  },
  pausedCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryButton: {
    minWidth: 116,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F6FB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#244867',
    fontSize: 14,
    fontWeight: '700',
  },
  trashButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashIcon: {
    fontSize: 16,
  },
  statusCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  timerText: {
    fontSize: 12,
    color: '#34516B',
    fontWeight: '600',
  },
  meter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 18,
  },
  meterBar: {
    width: 5,
    height: 8,
    borderRadius: 3,
    backgroundColor: '#B7C7D6',
    maxHeight: 18,
  },
  meterBarActive: {
    backgroundColor: '#0E5AA7',
  },
  sendButton: {
    minWidth: 108,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#0E5AA7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sendingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sendingText: {
    fontSize: 14,
    color: '#526170',
    fontWeight: '600',
  },
  spacer: {
    flex: 1,
  },
  errorRow: {
    gap: 4,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#8F3341',
  },
  settingsLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0E5AA7',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});

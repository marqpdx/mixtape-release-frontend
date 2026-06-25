// components/shared/CaptureDock.tsx
//
// Generic capture dock — text input + voice recording + draft persistence.
// This is the "PocketNotebook" shell from ADR-0048 (Mobile UX): same dock
// reused across Notebook, Lists, and Build, with only labels/colors/slots
// differing per screen. Used by SeedNotebook (personal seeds) and OpsScreen
// (HubCapture). Callers supply submit handlers; all input/voice/draft
// mechanics live here.

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNativeVoiceRecorder } from '../../hooks/useNativeVoiceRecorder';
import type { RecordedClip } from '../../hooks/useNativeVoiceRecorder';

export interface CaptureDockProps {
  draftStorageKey: string;
  placeholder?: string;
  kickerLabel?: string;
  kickerSub?: string;
  submitLabel?: string;
  onSubmitText: (text: string) => Promise<void>;
  onSubmitVoice: (clip: RecordedClip) => Promise<void>;
  /** Called immediately after the recording is finalized, before upload begins.
   *  Use this to persist the clip URI for resilience (OP-4). */
  onRecordingFinalized?: (clip: RecordedClip) => void;
  onFocusChange?: (focused: boolean) => void;
  isSubmittingText?: boolean;
  isSubmittingVoice?: boolean;
  /** Drives the send button and active voice meter. Defaults to the standard blue. */
  accentColor?: string;
  /** Highlights the text input border/background, e.g. while a caller-specific command mode is active. */
  isInputHighlighted?: boolean;
  /** Full override of text-change handling — receives the raw value and the dock's own
   *  setter, so callers can intercept (e.g. parse a command) or just forward to setText. */
  onChangeTextOverride?: (value: string, setText: (next: string) => void) => void;
  /** Rendered between the text input and the footer row, e.g. mention suggestions or an inline error. */
  belowInputContent?: ReactNode;
  /** Rendered after the draft-status line, e.g. a "Saved" confirmation prompt. */
  footerExtraContent?: ReactNode;
}

export interface CaptureDockHandle {
  getText: () => string;
  setText: (next: string) => void;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const CaptureDock = forwardRef<CaptureDockHandle, CaptureDockProps>(function CaptureDock({
  draftStorageKey,
  placeholder = 'Type here...',
  kickerLabel = 'Capture',
  kickerSub,
  submitLabel,
  onSubmitText,
  onSubmitVoice,
  onRecordingFinalized,
  onFocusChange,
  isSubmittingText = false,
  isSubmittingVoice = false,
  accentColor = '#0E5AA7',
  isInputHighlighted = false,
  onChangeTextOverride,
  belowInputContent,
  footerExtraContent,
}, ref) {
  const [captureText, setCaptureText] = useState('');
  const [captureFocused, setCaptureFocused] = useState(false);
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const captureInputRef = useRef<TextInput | null>(null);
  const retainFocusRef = useRef(false);
  const draftSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    isPreparing,
    isRecording,
    isPaused,
    recordingSeconds,
    meterLevel,
    micError,
    canOpenSettings,
    startRecording,
    pauseRecording,
    resumeRecording,
    finalizeRecording,
    clearRecording,
  } = useNativeVoiceRecorder();

  const showVoiceStatus = isRecording || isPaused;
  const voiceSessionActive = isRecording || isPaused;

  useImperativeHandle(ref, () => ({
    getText: () => captureText,
    setText: setCaptureText,
  }), [captureText]);

  // Restore draft on mount
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(draftStorageKey).then((value) => {
      if (!active || !value) return;
      setCaptureText(value);
      setDraftStatus('saved');
    });
    return () => { active = false; };
  }, [draftStorageKey]);

  // Autosave draft on text change
  useEffect(() => {
    if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);
    setDraftStatus(captureText.trim() ? 'saving' : 'idle');

    draftSaveTimeoutRef.current = setTimeout(() => {
      const next = captureText;
      const op = next.trim()
        ? AsyncStorage.setItem(draftStorageKey, next)
        : AsyncStorage.removeItem(draftStorageKey);
      void op.then(() => setDraftStatus(next.trim() ? 'saved' : 'idle'));
    }, 600);

    return () => {
      if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);
    };
  }, [captureText, draftStorageKey]);

  const handleSubmitText = async () => {
    const text = captureText.trim();
    if (!text || isSubmittingText) return;

    retainFocusRef.current = true;
    await onSubmitText(text);
    setCaptureText('');
    setDraftStatus('idle');
    void AsyncStorage.removeItem(draftStorageKey);

    requestAnimationFrame(() => {
      setTimeout(() => {
        captureInputRef.current?.focus();
        retainFocusRef.current = false;
      }, 10);
    });
  };

  const handleSubmitVoice = async () => {
    if ((!isRecording && !isPaused) || isSubmittingVoice) return;
    const clip = await finalizeRecording();
    if (!clip) return;
    onRecordingFinalized?.(clip);  // OP-4: caller can persist URI before upload
    await onSubmitVoice(clip);
  };

  return (
    <View style={styles.captureCard}>
      <View style={styles.kickerRow}>
        <Text style={styles.kicker}>{kickerLabel}</Text>
        {kickerSub ? <Text style={styles.kickerSub}> · {kickerSub}</Text> : null}
      </View>

      <TextInput
        ref={captureInputRef}
        style={[styles.captureInput, isInputHighlighted && styles.captureInputHighlighted]}
        autoFocus={false}
        multiline
        placeholder={placeholder}
        placeholderTextColor="#738292"
        value={captureText}
        onChangeText={(value) => {
          if (onChangeTextOverride) {
            onChangeTextOverride(value, setCaptureText);
          } else {
            setCaptureText(value);
          }
        }}
        textAlignVertical="top"
        onFocus={() => {
          setCaptureFocused(true);
          onFocusChange?.(true);
        }}
        onBlur={() => {
          if (retainFocusRef.current) {
            requestAnimationFrame(() => captureInputRef.current?.focus());
            return;
          }
          setCaptureFocused(false);
          onFocusChange?.(false);
        }}
      />

      {belowInputContent}

      <View style={styles.captureFooter}>
        {isPaused ? (
          <View style={styles.voiceControlCluster}>
            <TouchableOpacity
              onPress={() => void clearRecording()}
              activeOpacity={0.85}
              style={styles.voiceTrashButton}
            >
              <Text style={styles.voiceTrashIcon}>🗑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => void resumeRecording()}
              activeOpacity={0.85}
              style={[styles.voiceSecondaryButton, isPreparing && styles.buttonDisabled]}
              disabled={isPreparing}
            >
              <Text style={styles.voiceSecondaryButtonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => { isRecording ? void pauseRecording() : void startRecording(); }}
            activeOpacity={0.85}
            style={[styles.voiceSecondaryButton, isPreparing && styles.buttonDisabled]}
            disabled={isPreparing}
          >
            <Text style={styles.voiceSecondaryButtonText}>
              {showVoiceStatus ? 'Pause' : 'Record'}
            </Text>
          </TouchableOpacity>
        )}

        {showVoiceStatus ? (
          <View style={styles.voiceInlineStatus}>
            <Text style={styles.voiceStatus}>{formatDuration(recordingSeconds)}</Text>
            {isRecording ? (
              <View style={styles.voiceMeter}>
                {[0.2, 0.4, 0.6, 0.8].map((threshold, index) => (
                  <View
                    key={threshold}
                    style={[
                      styles.voiceMeterBar,
                      meterLevel >= threshold && { backgroundColor: accentColor },
                      meterLevel >= threshold && { height: 8 + index * 2 + meterLevel * 4 },
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.captureFooterSpacer} />
        )}

        {voiceSessionActive ? (
          <TouchableOpacity
            onPress={() => void handleSubmitVoice()}
            activeOpacity={0.85}
            style={[
              styles.sendButton,
              { backgroundColor: accentColor },
              isSubmittingVoice && styles.buttonDisabled,
            ]}
            disabled={isSubmittingVoice}
          >
            {isSubmittingVoice
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.sendButtonText}>➤ Voice</Text>}
          </TouchableOpacity>
        ) : (
          <Pressable
            style={[
              styles.sendButton,
              { backgroundColor: accentColor },
              (!captureText.trim() || isSubmittingText) && styles.buttonDisabled,
            ]}
            onPressIn={() => {
              retainFocusRef.current = true;
              captureInputRef.current?.focus();
            }}
            onPress={() => void handleSubmitText()}
            disabled={!captureText.trim() || isSubmittingText}
          >
            {isSubmittingText
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.sendButtonText}>{submitLabel ? `➤ ${submitLabel}` : '➤'}</Text>}
          </Pressable>
        )}
      </View>

      {micError ? (
        <View style={styles.voiceErrorRow}>
          <Text style={styles.voiceError}>{micError}</Text>
          {canOpenSettings ? (
            <TouchableOpacity onPress={() => void Linking.openSettings()} activeOpacity={0.8}>
              <Text style={styles.voiceSettingsLink}>Open settings</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.draftStatus}>
        {draftStatus === 'saving' ? 'Saving draft...' : draftStatus === 'saved' ? 'Draft saved' : ' '}
      </Text>

      {footerExtraContent}
    </View>
  );
});

const styles = StyleSheet.create({
  captureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: '#D7E0EA',
    gap: 8,
    marginBottom: 4,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  kicker: {
    color: '#315E87',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  kickerSub: {
    color: '#6A8DA8',
    fontSize: 12,
    fontWeight: '500',
  },
  captureInput: {
    minHeight: 96,
    maxHeight: 148,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#C9D4DE',
    color: '#13293D',
    fontSize: 16,
    lineHeight: 22,
  },
  captureInputHighlighted: {
    borderColor: '#0E5AA7',
    backgroundColor: '#F0F7FF',
  },
  captureFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
    minHeight: 42,
  },
  voiceControlCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  captureFooterSpacer: { flex: 1 },
  voiceInlineStatus: {
    flex: 1,
    minHeight: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  voiceStatus: { fontSize: 12, color: '#34516B', fontWeight: '600' },
  voiceMeter: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 18,
  },
  voiceMeterBar: {
    width: 5,
    height: 8,
    borderRadius: 3,
    backgroundColor: '#B7C7D6',
    maxHeight: 18,
  },
  voiceSecondaryButton: {
    minWidth: 116,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F6FB',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  voiceTrashButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F6FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceTrashIcon: { fontSize: 16 },
  voiceSecondaryButtonText: {
    color: '#244867',
    fontSize: 14,
    fontWeight: '700',
  },
  voiceErrorRow: { gap: 4 },
  voiceError: { fontSize: 12, color: '#8F3341' },
  voiceSettingsLink: { fontSize: 12, fontWeight: '700', color: '#0E5AA7' },
  sendButton: {
    minWidth: 108,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#0E5AA7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  sendButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  buttonDisabled: { opacity: 0.55 },
  draftStatus: { minHeight: 12, fontSize: 12, color: '#6A7785', marginTop: -2 },
});

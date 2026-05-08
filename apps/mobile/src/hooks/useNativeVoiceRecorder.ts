import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export interface RecordedClip {
  uri: string;
  durationSeconds: number;
  mimeType: string;
  fileName: string;
}

interface UseNativeVoiceRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  isPreparing: boolean;
  recordingSeconds: number;
  meterLevel: number;
  micError: string | null;
  canOpenSettings: boolean;
  maxDurationReached: boolean;  // true when recording auto-stopped at MAX_RECORDING_SECONDS
  startRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  finalizeRecording: () => Promise<RecordedClip | null>;
  clearRecording: () => Promise<void>;
}

const MAX_RECORDING_SECONDS = 300; // 5 minutes — per Puddlejump OQ-2 decision

export function useNativeVoiceRecorder(): UseNativeVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [meterLevel, setMeterLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [canOpenSettings, setCanOpenSettings] = useState(false);
  const [maxDurationReached, setMaxDurationReached] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        void recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
        recordingRef.current = null;
      }
      void Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      }).catch(() => undefined);
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording || isPaused || isPreparing) {
      return;
    }

    try {
      setIsPreparing(true);
      setMicError(null);
      setCanOpenSettings(false);

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setMicError(
          permission.canAskAgain
            ? 'Microphone permission is required for voice Seeds. Please allow microphone access.'
            : 'Microphone access is blocked. Open settings and enable microphone access for Mixtape.'
        );
        setCanOpenSettings(!permission.canAskAgain);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const recording = new Audio.Recording();
      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        android: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
          isMeteringEnabled: true,
        },
        ios: {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
          isMeteringEnabled: true,
        },
      };
      recording.setOnRecordingStatusUpdate((status) => {
        const secs = Math.max(0, Math.round((status.durationMillis || 0) / 1000));
        setRecordingSeconds(secs);

        // Hard cap — auto-pause at 5 minutes
        if (secs >= MAX_RECORDING_SECONDS && status.isRecording) {
          void recording.pauseAsync().catch(() => undefined);
          setIsRecording(false);
          setIsPaused(true);
          setMeterLevel(0);
          setMaxDurationReached(true);
          return;
        }

        if (status.isRecording) {
          setIsRecording(true);
          setIsPaused(false);
        } else if (status.canRecord) {
          setIsRecording(false);
          setIsPaused(true);
        }

        if (!status.isRecording || typeof status.metering !== 'number') {
          setMeterLevel(0);
          return;
        }

        // Metering is typically in dBFS from about -160..0. Normalize to 0..1.
        const normalized = Math.max(0, Math.min(1, (status.metering + 60) / 60));
        setMeterLevel(normalized);
      });
      recording.setProgressUpdateInterval(150);
      await recording.prepareToRecordAsync(recordingOptions);
      await recording.startAsync();

      recordingRef.current = recording;
      setRecordingSeconds(0);
      setMeterLevel(0);
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      const err = error as Error | undefined;
      setMicError(err?.message || 'Unable to start recording.');
      setMeterLevel(0);
    } finally {
      setIsPreparing(false);
    }
  }, [isPaused, isPreparing, isRecording]);

  const pauseRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording || !isRecording) {
      return;
    }

    try {
      await recording.pauseAsync();
      setIsRecording(false);
      setIsPaused(true);
      setMeterLevel(0);
    } catch (error) {
      const err = error as Error | undefined;
      setMicError(err?.message || 'Unable to pause recording.');
    }
  }, [isRecording]);

  const resumeRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording || !isPaused || isPreparing) {
      return;
    }

    try {
      setMicError(null);
      await recording.startAsync();
      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      const err = error as Error | undefined;
      setMicError(err?.message || 'Unable to resume recording.');
      setIsRecording(false);
      setIsPaused(true);
    }
  }, [isPaused, isPreparing]);

  const finalizeRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording || (!isRecording && !isPaused)) {
      return null;
    }

    try {
      const status = await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) {
        return null;
      }

      return {
        uri,
        durationSeconds: Math.max(1, Math.round((status.durationMillis || 0) / 1000)),
        mimeType: 'audio/m4a',
        fileName: 'seed-voice.m4a',
      };
    } catch (error) {
      const err = error as Error | undefined;
      setMicError(err?.message || 'Unable to finalize recording.');
      return null;
    } finally {
      recordingRef.current = null;
      setIsRecording(false);
      setIsPaused(false);
      setMeterLevel(0);
      void Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      }).catch(() => undefined);
    }
  }, [isPaused, isRecording]);

  const clearRecording = useCallback(async () => {
    if (recordingRef.current) {
      await recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
      recordingRef.current = null;
    }

    setRecordingSeconds(0);
    setMeterLevel(0);
    setMicError(null);
    setCanOpenSettings(false);
    setIsRecording(false);
    setIsPaused(false);
    setMaxDurationReached(false);
    void Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    }).catch(() => undefined);
  }, []);

  return {
    isRecording,
    isPaused,
    isPreparing,
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
  };
}

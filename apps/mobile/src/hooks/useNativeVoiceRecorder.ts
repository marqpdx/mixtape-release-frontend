import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';

interface RecordedClip {
  uri: string;
  durationSeconds: number;
  mimeType: string;
  fileName: string;
}

interface UseNativeVoiceRecorderReturn {
  isRecording: boolean;
  isPreparing: boolean;
  recordingSeconds: number;
  meterLevel: number;
  micError: string | null;
  canOpenSettings: boolean;
  recordedClip: RecordedClip | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
}

export function useNativeVoiceRecorder(): UseNativeVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [meterLevel, setMeterLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [canOpenSettings, setCanOpenSettings] = useState(false);
  const [recordedClip, setRecordedClip] = useState<RecordedClip | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
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
    if (isRecording || isPreparing) {
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
      setRecordedClip(null);
      setRecordingSeconds(0);
      setMeterLevel(0);
      setIsRecording(true);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        setRecordingSeconds((value) => value + 1);
      }, 1000);
    } catch (error) {
      const err = error as Error | undefined;
      setMicError(err?.message || 'Unable to start recording.');
      setMeterLevel(0);
    } finally {
      setIsPreparing(false);
    }
  }, [isPreparing, isRecording]);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording || !isRecording) {
      return;
    }

    try {
      await recording.stopAndUnloadAsync();
      const status = await recording.getStatusAsync();
      const uri = recording.getURI();

      if (uri) {
        setRecordedClip({
          uri,
          durationSeconds: Math.max(1, Math.round((status.durationMillis || 0) / 1000)),
          mimeType: 'audio/m4a',
          fileName: 'seed-voice.m4a',
        });
      }
    } catch (error) {
      const err = error as Error | undefined;
      setMicError(err?.message || 'Unable to stop recording.');
    } finally {
      recordingRef.current = null;
      setIsRecording(false);
      setMeterLevel(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      void Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      }).catch(() => undefined);
    }
  }, [isRecording]);

  const clearRecording = useCallback(() => {
    setRecordedClip(null);
    setRecordingSeconds(0);
    setMeterLevel(0);
    setMicError(null);
    setCanOpenSettings(false);
  }, []);

  return {
    isRecording,
    isPreparing,
    recordingSeconds,
    meterLevel,
    micError,
    canOpenSettings,
    recordedClip,
    startRecording,
    stopRecording,
    clearRecording,
  };
}

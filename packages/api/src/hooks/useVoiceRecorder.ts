// hooks/useVoiceRecorder.ts
//
// Shared voice recording hook. Handles:
// - MediaRecorder setup with MIME type detection
// - Mic prewarming (desktop) + idle shutdown (60s)
// - Recording timer
// - Upload via FormData to /api/writing/seeds
// - Returns blob on stop for caller to handle upload

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseVoiceRecorderOptions {
  /** Prewarm mic on mount (desktop only). Default: true */
  prewarm?: boolean;
  /** Idle shutdown delay in ms. Default: 60000 */
  idleTimeout?: number;
}

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isPreparingMic: boolean;
  recordingSeconds: number;
  micError: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  /** Clean up streams/timers. Called automatically on unmount. */
  cleanup: () => void;
}

const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/ogg',
  'audio/mp4',
];

export function useVoiceRecorder(
  onRecordingComplete: (blob: Blob) => void,
  options: UseVoiceRecorderOptions = {}
): UseVoiceRecorderReturn {
  const { prewarm = true, idleTimeout = 60000 } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [isPreparingMic, setIsPreparingMic] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const micIdleTimerRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onRecordingComplete);

  // Keep callback ref current
  useEffect(() => {
    onCompleteRef.current = onRecordingComplete;
  }, [onRecordingComplete]);

  const scheduleMicIdleShutdown = useCallback(() => {
    if (micIdleTimerRef.current) {
      window.clearTimeout(micIdleTimerRef.current);
    }
    micIdleTimerRef.current = window.setTimeout(() => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }, idleTimeout);
  }, [idleTimeout]);

  // Prewarm mic on mount (desktop only)
  useEffect(() => {
    if (!prewarm || typeof window === 'undefined') return;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) return;

    let cancelled = false;
    const warmup = async () => {
      try {
        setIsPreparingMic(true);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        mediaStreamRef.current = stream;
        scheduleMicIdleShutdown();
      } catch {
        // ignore; user can trigger via button
      } finally {
        if (!cancelled) setIsPreparingMic(false);
      }
    };
    void warmup();
    return () => { cancelled = true; };
  }, [prewarm, scheduleMicIdleShutdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
      if (micIdleTimerRef.current) window.clearTimeout(micIdleTimerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      const needsStream = !mediaStreamRef.current;
      if (needsStream) setIsPreparingMic(true);

      const stream =
        mediaStreamRef.current || (await navigator.mediaDevices.getUserMedia({ audio: true }));
      mediaStreamRef.current = stream;
      setMicError(null);
      scheduleMicIdleShutdown();

      const chosenMime =
        typeof MediaRecorder !== 'undefined'
          ? MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type))
          : undefined;

      const recorder = new MediaRecorder(stream, chosenMime ? { mimeType: chosenMime } : undefined);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          });
          if (blob.size > 0) {
            onCompleteRef.current(blob);
          }
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      if (needsStream) setIsPreparingMic(false);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      setIsPreparingMic(false);
      const err = error as { name?: string; message?: string } | undefined;
      let message = 'Microphone permission blocked.';
      if (err?.name === 'NotAllowedError') {
        message = 'Microphone blocked. Check your browser permissions.';
      } else if (err?.name === 'NotFoundError') {
        message = 'No microphone found. Connect or enable a mic and try again.';
      } else if (err?.message) {
        message = err.message;
      }
      setMicError(message);
    }
  }, [isRecording, scheduleMicIdleShutdown]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    scheduleMicIdleShutdown();
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, [isRecording, scheduleMicIdleShutdown]);

  const cleanup = useCallback(() => {
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    if (micIdleTimerRef.current) window.clearTimeout(micIdleTimerRef.current);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  return {
    isRecording,
    isPreparingMic,
    recordingSeconds,
    micError,
    startRecording,
    stopRecording,
    cleanup,
  };
}

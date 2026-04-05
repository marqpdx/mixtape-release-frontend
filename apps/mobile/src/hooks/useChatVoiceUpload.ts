import { useCallback, useState } from 'react';
import { uploadVoiceMessage } from '@mixtape/api/clients/chat/chatApi';
import { useNativeVoiceRecorder } from './useNativeVoiceRecorder';
import type { Message } from '@mixtape/core/types/chatTypes';

interface UseChatVoiceUploadReturn {
  // recorder state
  isRecording: boolean;
  isPaused: boolean;
  isPreparing: boolean;
  recordingSeconds: number;
  meterLevel: number;
  micError: string | null;
  maxDurationReached: boolean;
  // upload state
  isUploading: boolean;
  uploadError: string | null;
  // actions
  startRecording: () => Promise<void>;
  cancelRecording: () => Promise<void>;
  sendRecording: () => Promise<Message | null>;
}

export function useChatVoiceUpload(conversationSlug: string): UseChatVoiceUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const {
    isRecording,
    isPaused,
    isPreparing,
    recordingSeconds,
    meterLevel,
    micError,
    maxDurationReached,
    startRecording,
    finalizeRecording,
    clearRecording,
  } = useNativeVoiceRecorder();

  const cancelRecording = useCallback(async () => {
    setUploadError(null);
    await clearRecording();
  }, [clearRecording]);

  const sendRecording = useCallback(async (): Promise<Message | null> => {
    setUploadError(null);
    const clip = await finalizeRecording();
    if (!clip) {
      return null;
    }

    setIsUploading(true);
    try {
      const message = await uploadVoiceMessage(
        conversationSlug,
        clip.uri,
        clip.mimeType,
        clip.fileName,
        clip.durationSeconds
      );
      return message;
    } catch (err) {
      const e = err as Error | undefined;
      setUploadError(e?.message || 'Failed to send voice message.');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [conversationSlug, finalizeRecording]);

  return {
    isRecording,
    isPaused,
    isPreparing,
    recordingSeconds,
    meterLevel,
    micError,
    maxDurationReached,
    isUploading,
    uploadError,
    startRecording,
    cancelRecording,
    sendRecording,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadMemberVoiceClip, deleteMemberVoice, fetchMyProfile } from '@mixtape/api/clients/member/memberApi';
import { pollWithBackoff } from '../services/polling/pollWithBackoff';
import type { RecordedClip } from '../components/shared/VoiceCaptureBar';

interface UseUploadIntroVoiceResult {
  isUploading: boolean;
  isTranscribing: boolean;
  voiceUrl: string | null;
  transcript: string;
  handleClipComplete: (clip: RecordedClip) => Promise<void>;
  deleteVoice: () => Promise<void>;
}

export function useUploadIntroVoice(
  initialVoiceUrl?: string | null,
  initialTranscript?: string
): UseUploadIntroVoiceResult {
  const [isUploading, setIsUploading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(initialVoiceUrl ?? null);
  const [transcript, setTranscript] = useState<string>(initialTranscript ?? '');

  const pollCancelledRef = useRef(false);

  const stopPolling = useCallback(() => {
    pollCancelledRef.current = true;
  }, []);

  const startPolling = useCallback(() => {
    pollCancelledRef.current = false;
    setIsTranscribing(true);

    void pollWithBackoff(async () => {
      try {
        const profile = await fetchMyProfile();
        if (profile.intro_voice_transcript) {
          return { done: true, value: profile.intro_voice_transcript };
        }
      } catch {
        // ignore transient poll errors
      }
      return { done: false };
    }, { isCancelled: () => pollCancelledRef.current }).then((transcript) => {
      if (pollCancelledRef.current) return;
      if (transcript) setTranscript(transcript);
      setIsTranscribing(false);
    });
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const handleClipComplete = useCallback(async (clip: RecordedClip) => {
    setIsUploading(true);
    try {
      const result = await uploadMemberVoiceClip(clip.uri, clip.mimeType, clip.fileName);
      setVoiceUrl(result.url);
      setTranscript('');
      startPolling();
    } finally {
      setIsUploading(false);
    }
  }, [startPolling]);

  const deleteVoice = useCallback(async () => {
    stopPolling();
    await deleteMemberVoice();
    setVoiceUrl(null);
    setTranscript('');
    setIsTranscribing(false);
  }, [stopPolling]);

  return {
    isUploading,
    isTranscribing,
    voiceUrl,
    transcript,
    handleClipComplete,
    deleteVoice,
  };
}

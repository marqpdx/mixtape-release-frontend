import { useCallback, useEffect, useRef, useState } from 'react';
import { uploadMemberVoiceClip, deleteMemberVoice, fetchMyProfile } from '@mixtape/api/clients/member/memberApi';
import type { RecordedClip } from '../components/shared/VoiceCaptureBar';

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 60000;

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

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollStartRef = useRef<number>(0);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollStartRef.current = Date.now();
    setIsTranscribing(true);

    const tick = async () => {
      if (Date.now() - pollStartRef.current >= POLL_TIMEOUT_MS) {
        setIsTranscribing(false);
        return;
      }
      try {
        const profile = await fetchMyProfile();
        if (profile.intro_voice_transcript) {
          setTranscript(profile.intro_voice_transcript);
          setIsTranscribing(false);
          return;
        }
      } catch {
        // ignore transient poll errors
      }
      pollTimerRef.current = setTimeout(() => { void tick(); }, POLL_INTERVAL_MS);
    };

    pollTimerRef.current = setTimeout(() => { void tick(); }, POLL_INTERVAL_MS);
  }, [stopPolling]);

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

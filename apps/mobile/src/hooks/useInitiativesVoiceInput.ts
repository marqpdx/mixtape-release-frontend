import { useCallback } from 'react';
import { useInitiativesStore } from '../stores/initiativesStore';
import { createVoiceProcessingItem } from '../services/initiatives/commandService';
import { getInitiativesCommandClient } from '../services/initiatives/commandClient';
import { pollWithBackoff } from '../services/polling/pollWithBackoff';
import { useNativeVoiceRecorder } from './useNativeVoiceRecorder';

const commandClient = getInitiativesCommandClient();

async function pollUntilDone(
  jobId: string
): Promise<{ transcriptionText?: string; failed?: boolean; failureReason?: string }> {
  let failed = false;
  let failureReason: string | undefined;

  const transcriptionText = await pollWithBackoff(async () => {
    const result = await commandClient.pollTranscribeJob(jobId);

    if (result.status === 'complete') {
      return { done: true, value: result.transcriptionText };
    }
    if (result.status === 'failed') {
      failed = true;
      failureReason = result.failureReason || 'Transcription failed.';
      return { done: true };
    }
    return { done: false };
  });

  if (failed) {
    return { failed: true, failureReason };
  }
  if (!transcriptionText) {
    return { failed: true, failureReason: 'Transcription timed out.' };
  }
  return { transcriptionText };
}

export function useInitiativesVoiceInput() {
  const addSessionItem = useInitiativesStore((state) => state.addSessionItem);
  const updateSessionItem = useInitiativesStore((state) => state.updateSessionItem);
  const appendTranscript = useInitiativesStore((state) => state.appendTranscript);
  const setComposerState = useInitiativesStore((state) => state.setComposerState);
  const recorder = useNativeVoiceRecorder();

  const startVoiceCapture = useCallback(async () => {
    await recorder.startRecording();
  }, [recorder]);

  const pauseVoiceCapture = useCallback(async () => {
    await recorder.pauseRecording();
  }, [recorder]);

  const resumeVoiceCapture = useCallback(async () => {
    await recorder.resumeRecording();
  }, [recorder]);

  const cancelVoiceCapture = useCallback(async () => {
    await recorder.clearRecording();
    setComposerState('idle');
  }, [recorder, setComposerState]);

  const submitVoiceCapture = useCallback(async () => {
    const clip = await recorder.finalizeRecording();
    if (!clip) {
      return;
    }

    const processingItem = createVoiceProcessingItem();
    addSessionItem(processingItem);
    setComposerState('processing_voice');

    try {
      const { jobId } = await commandClient.transcribeVoice(clip.uri, clip.mimeType);
      const outcome = await pollUntilDone(jobId);

      if (outcome.failed || !outcome.transcriptionText) {
        updateSessionItem(processingItem.id, {
          kind: 'error',
          tone: 'error',
          title: 'Voice transcription failed',
          body: outcome.failureReason || 'Unable to transcribe voice command.',
        });
        setComposerState('idle');
        return;
      }

      appendTranscript(outcome.transcriptionText);
      updateSessionItem(processingItem.id, {
        kind: 'command',
        tone: 'neutral',
        title: 'Voice transcribed',
        body: outcome.transcriptionText,
      });
      setComposerState('editing');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to reach transcription service.';
      updateSessionItem(processingItem.id, {
        kind: 'error',
        tone: 'error',
        title: 'Voice transcription failed',
        body: message,
      });
      setComposerState('idle');
    }
  }, [addSessionItem, appendTranscript, recorder, setComposerState, updateSessionItem]);

  return {
    ...recorder,
    startVoiceCapture,
    pauseVoiceCapture,
    resumeVoiceCapture,
    cancelVoiceCapture,
    submitVoiceCapture,
  };
}

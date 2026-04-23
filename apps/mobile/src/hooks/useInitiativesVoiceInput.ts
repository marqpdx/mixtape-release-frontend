import { useCallback } from 'react';
import { useInitiativesStore } from '../stores/initiativesStore';
import { createVoiceProcessingItem } from '../services/initiatives/commandService';
import { useNativeVoiceRecorder } from './useNativeVoiceRecorder';

export function useInitiativesVoiceInput() {
  const addSessionItem = useInitiativesStore((state) => state.addSessionItem);
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

    addSessionItem({
      ...createVoiceProcessingItem(),
      body: `Recorded ${clip.durationSeconds}s voice command. Server transcription fallback still needs a dedicated Initiatives contract.`,
    });
    setComposerState('processing_voice');
  }, [addSessionItem, recorder, setComposerState]);

  return {
    ...recorder,
    startVoiceCapture,
    pauseVoiceCapture,
    resumeVoiceCapture,
    cancelVoiceCapture,
    submitVoiceCapture,
  };
}

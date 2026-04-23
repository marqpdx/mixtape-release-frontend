import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useInitiativesStore } from '../stores/initiativesStore';
import { useAuthStore } from '../stores/authStore';
import {
  createErrorItem,
  createPendingCommandItem,
  createResultItem,
} from '../services/initiatives/commandService';
import { getInitiativesCommandClient } from '../services/initiatives/commandClient';

const INITIATIVES_DRAFT_KEY = 'mixtape.mobile.initiatives.draft';
const STT_SAMPLE = 'note that the compressor made noise again at 4pm';
const commandClient = getInitiativesCommandClient();

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'data' in error.response &&
    typeof error.response.data === 'object' &&
    error.response.data !== null &&
    'detail' in error.response.data &&
    typeof error.response.data.detail === 'string'
  ) {
    return error.response.data.detail;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function useInitiativesCommand() {
  const currentUser = useAuthStore((state) => state.user);
  const draftText = useInitiativesStore((state) => state.draftText);
  const pendingParse = useInitiativesStore((state) => state.pendingParse);
  const setDraftText = useInitiativesStore((state) => state.setDraftText);
  const appendTranscript = useInitiativesStore((state) => state.appendTranscript);
  const setComposerState = useInitiativesStore((state) => state.setComposerState);
  const setPendingParse = useInitiativesStore((state) => state.setPendingParse);
  const addSessionItem = useInitiativesStore((state) => state.addSessionItem);
  const clearDraft = useInitiativesStore((state) => state.clearDraft);
  const [editableGeneratedText, setEditableGeneratedText] = useState('');
  const defaultSponsor = currentUser?.groups?.[0]
    ? {
        sponsorModel: 'group',
        sponsorId: currentUser.groups[0].id,
      }
    : null;

  const persistDraft = useCallback(async (text: string) => {
    if (text.trim()) {
      await AsyncStorage.setItem(INITIATIVES_DRAFT_KEY, text);
    } else {
      await AsyncStorage.removeItem(INITIATIVES_DRAFT_KEY);
    }
  }, []);

  const handleDraftChange = useCallback((text: string) => {
    setDraftText(text);
    void persistDraft(text).catch(() => undefined);
  }, [persistDraft, setDraftText]);

  const hydrateDraft = useCallback(() => {
    void AsyncStorage.getItem(INITIATIVES_DRAFT_KEY).then((value) => {
      if (value) {
        setDraftText(value);
      }
    });
  }, [setDraftText]);

  const submitDraft = useCallback(async () => {
    const trimmed = draftText.trim();
    if (!trimmed) {
      return;
    }
    if (!defaultSponsor) {
      addSessionItem(
        createErrorItem(
          'No command target available',
          'Initiatives commands need a sponsor group before they can be parsed on the backend.'
        )
      );
      return;
    }

    addSessionItem(createPendingCommandItem(trimmed));
    try {
      const { parsed } = await commandClient.parseCommand({
        input: trimmed,
        sponsorModel: defaultSponsor.sponsorModel,
        sponsorId: defaultSponsor.sponsorId,
      });
      setPendingParse(parsed);
      setEditableGeneratedText(parsed.generatedText || '');
      setComposerState('confirming');
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to parse the command right now.');
      addSessionItem(createErrorItem('Parse failed', message));
      setComposerState('editing');
    }
  }, [addSessionItem, defaultSponsor, draftText, setComposerState, setPendingParse]);

  const returnToEdit = useCallback(() => {
    if (!pendingParse) {
      return;
    }

    setDraftText(pendingParse.rawInput);
    void persistDraft(pendingParse.rawInput).catch(() => undefined);
    setPendingParse(null);
    setComposerState('editing');
  }, [pendingParse, persistDraft, setComposerState, setDraftText, setPendingParse]);

  const confirmParsedCommand = useCallback(async () => {
    if (!pendingParse) {
      return;
    }

    const fields =
      pendingParse.verb === 'draft' || pendingParse.verb === 'summarize'
        ? { generated_text: editableGeneratedText }
        : {};

    try {
      const { parsed: resolvedParse } = await commandClient.confirmCommand({
        parsed: pendingParse,
        fields,
      });

      addSessionItem(createResultItem(resolvedParse));
      setPendingParse(null);
      clearDraft();
      setComposerState('result');
      void AsyncStorage.removeItem(INITIATIVES_DRAFT_KEY).catch(() => undefined);
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to confirm the command right now.');
      addSessionItem(createErrorItem('Confirm failed', message, pendingParse.verb));
      setComposerState('confirming');
    }
  }, [
    addSessionItem,
    clearDraft,
    editableGeneratedText,
    pendingParse,
    setComposerState,
    setPendingParse,
  ]);

  const appendVoiceSample = useCallback(() => {
    appendTranscript(STT_SAMPLE);
    const nextDraft = draftText.trim()
      ? `${draftText.trimEnd()} ${STT_SAMPLE}`.trim()
      : STT_SAMPLE;
    void persistDraft(nextDraft).catch(() => undefined);
    setComposerState('editing');
  }, [appendTranscript, draftText, persistDraft, setComposerState]);

  return {
    editableGeneratedText,
    setEditableGeneratedText,
    hydrateDraft,
    handleDraftChange,
    submitDraft,
    returnToEdit,
    confirmParsedCommand,
    appendVoiceSample,
    hasBackendTarget: Boolean(defaultSponsor),
  };
}

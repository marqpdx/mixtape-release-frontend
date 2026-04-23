import { create } from 'zustand';
import type {
  InitiativeComposerState,
  InitiativeSessionItem,
  ParsedInitiativeCommand,
} from '../types/initiatives';

interface InitiativesStore {
  draftText: string;
  composerState: InitiativeComposerState;
  pendingParse: ParsedInitiativeCommand | null;
  sessionHistory: InitiativeSessionItem[];
  setDraftText: (text: string) => void;
  appendTranscript: (text: string) => void;
  setComposerState: (state: InitiativeComposerState) => void;
  setPendingParse: (value: ParsedInitiativeCommand | null) => void;
  addSessionItem: (item: InitiativeSessionItem) => void;
  clearDraft: () => void;
}

export const useInitiativesStore = create<InitiativesStore>((set) => ({
  draftText: '',
  composerState: 'idle',
  pendingParse: null,
  sessionHistory: [],
  setDraftText: (draftText) =>
    set({
      draftText,
      composerState: draftText.trim() ? 'editing' : 'idle',
    }),
  appendTranscript: (text) =>
    set((state) => {
      const nextDraft = state.draftText.trim()
        ? `${state.draftText.trimEnd()} ${text.trim()}`.trim()
        : text.trim();
      return {
        draftText: nextDraft,
        composerState: nextDraft ? 'editing' : 'idle',
      };
    }),
  setComposerState: (composerState) => set({ composerState }),
  setPendingParse: (pendingParse) => set({ pendingParse }),
  addSessionItem: (item) =>
    set((state) => ({
      sessionHistory: [item, ...state.sessionHistory].slice(0, 12),
    })),
  clearDraft: () => set({ draftText: '', composerState: 'idle' }),
}));

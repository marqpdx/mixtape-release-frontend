// src/hooks/useSpellCorrection.ts
/**
 * useSpellCorrection Hook
 *
 * Combines the spell dictionary with popup state management.
 * Provides everything needed to integrate spell correction into TipTap.
 *
 * Part of PocketTools - Spelling Helpers
 */

import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { useSpellDictionary } from './useSpellDictionary';
import type { SpellCorrectionState } from '@/components/editor/extensions/SpellCorrection';

export interface UseSpellCorrectionOptions {
  editor: Editor | null;
}

export function useSpellCorrection({ editor }: UseSpellCorrectionOptions) {
  const [popupState, setPopupState] = useState<SpellCorrectionState | null>(null);
  const dictionary = useSpellDictionary();

  // Open popup (called by SpellCorrection extension)
  const handleOpen = useCallback((state: SpellCorrectionState) => {
    setPopupState(state);
  }, []);

  // Close popup
  const handleClose = useCallback(() => {
    setPopupState(null);
    // Return focus to editor
    editor?.commands.focus();
  }, [editor]);

  // Apply correction
  const handleApply = useCallback((originalWord: string, correction: string) => {
    if (!editor || !popupState) return;

    // Replace the word in the editor
    const { from, to } = popupState;
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .insertContent(correction)
      .run();

    // Add to dictionary
    dictionary.addCorrection(originalWord, correction);

    // Close popup
    setPopupState(null);
  }, [editor, popupState, dictionary]);

  // Extension config to pass to SpellCorrection.configure()
  const extensionConfig = {
    onOpen: handleOpen,
    onClose: handleClose,
    modifierKey: 'meta' as const,
  };

  return {
    // Popup state
    popupState,
    handleOpen,
    handleClose,
    handleApply,

    // Extension config
    extensionConfig,

    // Dictionary access
    dictionary,
    getCorrection: dictionary.getCorrection,
    addCorrection: dictionary.addCorrection,
    corrections: dictionary.corrections,
  };
}

export default useSpellCorrection;

// src/components/write/hooks/useTextSelection.ts

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TextSelection {
  text: string;
  from: number;
  to: number;
  isEmpty: boolean;
  isSingleWord: boolean;
  wordCount: number;
}

export interface UseTextSelectionOptions {
  debounceMs?: number;
  minSelectionLength?: number;
}

export interface UseTextSelectionReturn {
  selection: TextSelection | null;
  hasSelection: boolean;
  isSelecting: boolean;
  clearSelection: () => void;
}

const EMPTY_SELECTION: TextSelection = {
  text: '',
  from: 0,
  to: 0,
  isEmpty: true,
  isSingleWord: false,
  wordCount: 0
};

export function useTextSelection(
  editorRef: React.RefObject<any>,
  options: UseTextSelectionOptions = {}
): UseTextSelectionReturn {
  const {
    debounceMs = 300,
    minSelectionLength = 1
  } = options;

  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const extractSelection = useCallback((editor: any): TextSelection => {
    if (!editor?.state) return EMPTY_SELECTION;

    const { state } = editor;
    const { selection: editorSelection } = state;

    if (!editorSelection) return EMPTY_SELECTION;

    const text = state.doc.textBetween(
      editorSelection.from,
      editorSelection.to
    ).trim();

    if (text.length < minSelectionLength) {
      return EMPTY_SELECTION;
    }

    const words = text.split(/\s+/).filter((w: string) => w.length > 0);

    return {
      text,
      from: editorSelection.from,
      to: editorSelection.to,
      isEmpty: text.length === 0,
      isSingleWord: words.length === 1,
      wordCount: words.length
    };
  }, [minSelectionLength]);

  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current) {
      console.log("🔍 Selection change - no editor ref");
      return;
    }

    console.log("🔍 Selection change detected, editorRef.current:", !!editorRef.current);
    setIsSelecting(true);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce the selection processing
    debounceTimer.current = setTimeout(() => {
      const newSelection = extractSelection(editorRef.current);
      console.log("🔍 Extracted selection:", newSelection);

      if (newSelection.isEmpty) {
        console.log("🔍 Selection is empty, setting to null");
        setSelection(null);
      } else {
        console.log("🔍 Selection has content, setting selection");
        setSelection(newSelection);
      }

      setIsSelecting(false);
    }, debounceMs);
  }, [editorRef, extractSelection, debounceMs]);

  const clearSelection = useCallback(() => {
    setSelection(null);
    setIsSelecting(false);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  // Set up editor selection listener
  useEffect(() => {
    const editor = editorRef.current;
    console.log("🔍 useTextSelection effect - editor:", editor);
    console.log("🔍 Editor type:", typeof editor);
    console.log("🔍 Editor has 'on' method:", editor && typeof editor.on === 'function');

    if (!editor) {
      console.log("🔍 No editor found, skipping event listeners");
      return;
    }

    // Listen for selection updates
    const handleUpdate = () => {
      console.log("🔍 TipTap editor event fired");
      handleSelectionChange();
    };

    // TipTap editor event listeners
    try {
      editor.on('selectionUpdate', handleUpdate);
      editor.on('update', handleUpdate);
      console.log("🔍 Event listeners attached successfully");
    } catch (error) {
      console.error("🔍 Failed to attach event listeners:", error);
    }

    return () => {
      try {
        editor.off('selectionUpdate', handleUpdate);
        editor.off('update', handleUpdate);
        console.log("🔍 Event listeners removed");
      } catch (error) {
        console.error("🔍 Failed to remove event listeners:", error);
      }

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [editorRef.current, handleSelectionChange]); // Watch for editorRef.current changes

  // Clear selection when editor loses focus
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleBlur = () => {
      // Small delay to allow for selection-based actions
      setTimeout(() => {
        // Only clear if user isn't actively using Copy Desk
        if (!document.querySelector('.copy-desk-agent:hover')) {
          clearSelection();
        }
      }, 150);
    };

    const editorElement = editor.view?.dom;
    if (editorElement) {
      editorElement.addEventListener('blur', handleBlur);
      return () => editorElement.removeEventListener('blur', handleBlur);
    }
  }, [editorRef, clearSelection]);

  const hasSelection = selection !== null && !selection.isEmpty;

  return {
    selection,
    hasSelection,
    isSelecting,
    clearSelection
  };
}
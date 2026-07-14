// src/components/editor/extensions/SpellCorrection.ts
/**
 * SpellCorrection Extension
 *
 * Enables Cmd/Ctrl+double-click on a word to open a quick correction popup.
 * The popup shows the word and allows typing a correction.
 * On Enter, the word is replaced and the pair is added to the dictionary.
 *
 * Part of PocketTools - Spelling Helpers
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { TextSelection } from '@tiptap/pm/state';

export interface SpellCorrectionState {
  isOpen: boolean;
  word: string;
  from: number;
  to: number;
  position: { x: number; y: number };
}

export interface SpellCorrectionOptions {
  /**
   * Callback when correction popup should open
   */
  onOpen?: (state: SpellCorrectionState) => void;

  /**
   * Callback when correction popup should close
   */
  onClose?: () => void;

  /**
   * Modifier key to use with double-click
   * @default 'meta' (Cmd on Mac, Ctrl on Windows)
   */
  modifierKey?: 'meta' | 'alt' | 'ctrl';

  /**
   * Lookup function for automatic replacement on word boundary.
   */
  getCorrection?: (word: string) => string | null;

  /**
   * Optional usage callback when an automatic replacement is applied.
   */
  recordUsage?: (wrongWord: string) => void;
}

export const SpellCorrection = Extension.create<SpellCorrectionOptions>({
  name: 'spellCorrection',

  addOptions() {
    return {
      onOpen: undefined,
      onClose: undefined,
      modifierKey: 'meta',
      getCorrection: undefined,
      recordUsage: undefined,
    };
  },

  addProseMirrorPlugins() {
    const { onOpen, modifierKey, getCorrection, recordUsage } = this.options;

    // Tracks the most recent autocorrect so backspace can undo it.
    // Cleared on any keydown that isn't Backspace.
    let lastAutoCorrect: {
      original: string;
      from: number;
      correctionEnd: number;
    } | null = null;

    return [
      new Plugin({
        key: new PluginKey('spellCorrection'),

        props: {
          handleDOMEvents: {
            keydown(view, event) {
              // If Backspace fires immediately after an autocorrect and the
              // cursor is still at the end of the replacement, undo it.
              if (event.key === 'Backspace' && lastAutoCorrect) {
                const { state } = view;
                const cursorPos = state.selection.from;
                const { original, from, correctionEnd } = lastAutoCorrect;
                lastAutoCorrect = null;

                if (cursorPos === correctionEnd) {
                  event.preventDefault();
                  const tr = state.tr.insertText(original, from, correctionEnd);
                  view.dispatch(tr);
                  return true;
                }
                return false;
              }

              // Any other key clears the undo window.
              lastAutoCorrect = null;
              return false;
            },

            keyup(view, event) {
              if (!getCorrection) return false;
              if (event.isComposing) return false;

              // Non-boundary key: undo window already cleared by keydown.
              const boundaryChars = new Set([
                ' ', 'Enter', 'Tab', '.', ',', ';', ':', '!', '?', ')', ']', '}', '"', "'",
              ]);
              if (!boundaryChars.has(event.key)) return false;

              const { state } = view;
              const { from } = state.selection;
              const $pos = state.doc.resolve(from);
              const text = $pos.parent.textContent;
              if (!text) return false;

              let end = $pos.parentOffset;
              while (end > 0 && /[\s.,!?;:)\]}\"']/.test(text[end - 1])) {
                end--;
              }
              let start = end;
              // Walk back through word chars, also crossing a single '/' when
              // the char before it is also a word char (catches b/c, w/, and/or).
              while (start > 0) {
                const ch = text[start - 1];
                if (/\w/.test(ch)) { start--; continue; }
                if (ch === '/' && start >= 2 && /\w/.test(text[start - 2])) { start--; continue; }
                break;
              }
              const word = text.slice(start, end);
              if (!word || word.length < 2) return false;

              const correction = getCorrection(word);
              if (!correction || correction === word) return false;

              const parentStart = $pos.start();
              const absoluteFrom = parentStart + start;
              const absoluteTo = parentStart + end;

              const tr = state.tr.insertText(correction, absoluteFrom, absoluteTo);
              view.dispatch(tr);
              recordUsage?.(word);

              // Record undo window. After insertText the cursor lands at
              // absoluteFrom + correction.length.
              lastAutoCorrect = {
                original: word,
                from: absoluteFrom,
                correctionEnd: absoluteFrom + correction.length,
              };

              return false;
            },
            dblclick(view, event) {
              // Check for modifier key
              const hasModifier =
                modifierKey === 'meta' ? event.metaKey || event.ctrlKey :
                modifierKey === 'alt' ? event.altKey :
                event.ctrlKey;

              if (!hasModifier) return false;

              const { state } = view;
              // Get position from click coordinates
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (!pos) return false;

              // Resolve the position to find word boundaries
              const $pos = state.doc.resolve(pos.pos);
              const { parent, parentOffset } = $pos;

              // Get the text content
              const text = parent.textContent;
              if (!text) return false;

              // Find word boundaries at click position
              let wordStart = parentOffset;
              let wordEnd = parentOffset;

              // Expand backwards to find word start
              while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
                wordStart--;
              }

              // Expand forwards to find word end
              while (wordEnd < text.length && /\w/.test(text[wordEnd])) {
                wordEnd++;
              }

              // Extract the word
              const word = text.slice(wordStart, wordEnd);
              if (!word || word.length < 2) return false;

              // Calculate absolute positions
              const startOfParent = $pos.start();
              const absoluteFrom = startOfParent + wordStart;
              const absoluteTo = startOfParent + wordEnd;

              // Get screen position for popup
              const coords = view.coordsAtPos(absoluteFrom);

              // Select the word
              const tr = state.tr.setSelection(
                TextSelection.create(state.doc, absoluteFrom, absoluteTo)
              );
              view.dispatch(tr);

              // Call the open callback
              if (onOpen) {
                onOpen({
                  isOpen: true,
                  word,
                  from: absoluteFrom,
                  to: absoluteTo,
                  position: {
                    x: coords.left,
                    y: coords.bottom + 5,
                  },
                });
              }

              event.preventDefault();
              return true;
            },
          },
        },
      }),
    ];
  },
});

export default SpellCorrection;

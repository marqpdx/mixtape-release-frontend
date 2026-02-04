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
}

export const SpellCorrection = Extension.create<SpellCorrectionOptions>({
  name: 'spellCorrection',

  addOptions() {
    return {
      onOpen: undefined,
      onClose: undefined,
      modifierKey: 'meta',
    };
  },

  addProseMirrorPlugins() {
    const { onOpen, modifierKey } = this.options;

    return [
      new Plugin({
        key: new PluginKey('spellCorrection'),

        props: {
          handleDOMEvents: {
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

// extensions/OutlineMarker.ts
//
// Invisible inline marker node for anchoring outline sections.
// Inserted at cursor when user creates a persistent outline node.
// The marker's `nodeId` matches DispatchOutlineNode.anchor_target.

import { Node, mergeAttributes } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    outlineMarker: {
      /** Insert an outline marker at the current cursor position */
      insertOutlineMarker: (nodeId: string) => ReturnType;
      /** Remove an outline marker by its nodeId */
      removeOutlineMarker: (nodeId: string) => ReturnType;
    };
  }
}

export const OutlineMarker = Node.create({
  name: 'outlineMarker',

  group: 'inline',
  inline: true,
  atom: true, // Not editable, treated as a single unit
  selectable: false,

  addAttributes() {
    return {
      nodeId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-outline-marker'),
        renderHTML: (attributes) => ({
          'data-outline-marker': attributes.nodeId,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-outline-marker]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'outline-marker',
        style: 'display:inline;width:0;height:0;overflow:hidden;font-size:0;line-height:0;',
      }),
    ];
  },

  addCommands() {
    return {
      insertOutlineMarker:
        (nodeId: string) =>
        ({ chain }) => {
          return chain().insertContent({
            type: this.name,
            attrs: { nodeId },
          }).run();
        },

      removeOutlineMarker:
        (nodeId: string) =>
        ({ state, tr, dispatch }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'outlineMarker' && node.attrs.nodeId === nodeId) {
              if (dispatch) {
                tr.delete(pos, pos + node.nodeSize);
              }
              found = true;
              return false; // stop traversal
            }
          });
          if (found && dispatch) {
            dispatch(tr);
          }
          return found;
        },
    };
  },
});

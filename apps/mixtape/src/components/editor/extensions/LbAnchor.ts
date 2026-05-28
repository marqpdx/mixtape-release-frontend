// extensions/LbAnchor.ts
//
// Inline atom node marking a Living Book branch anchor in the trunk document.
// Carries only the UUID that matches Branch.anchor_node_id in Django.
// All branch metadata (prompt, due date) lives in the backend — not here.
//
// Pattern mirrors OutlineMarker.ts — same file, same directory.

import { Node, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lbAnchor: {
      insertLbAnchor: (anchorId: string) => ReturnType
      removeLbAnchor: (anchorId: string) => ReturnType
    }
  }
}

export const LbAnchor = Node.create({
  name: 'lbAnchor',

  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      anchorId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-lb-anchor'),
        renderHTML: (attributes) => ({
          'data-lb-anchor': attributes.anchorId,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-lb-anchor]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: 'lb-anchor-marker',
        // Visible teal glyph — replaced by NodeView in the collab editor
        style: 'display:inline-flex;align-items:center;cursor:pointer;color:#2C7A7B;font-size:0.85em;user-select:none;',
      }),
      '🌿',
    ]
  },

  addCommands() {
    return {
      insertLbAnchor:
        (anchorId: string) =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name, attrs: { anchorId } })
            .run()
        },

      removeLbAnchor:
        (anchorId: string) =>
        ({ state, tr, dispatch }) => {
          let found = false
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'lbAnchor' && node.attrs.anchorId === anchorId) {
              if (dispatch) tr.delete(pos, pos + node.nodeSize)
              found = true
              return false
            }
          })
          if (found && dispatch) dispatch(tr)
          return found
        },
    }
  },
})

// extensions/SplitMarker.ts
//
// Custom TipTap block node for split markers in the Copy Desk editor.
// Inserted by the /split grist command (manual) or AI suggestion acceptance.
// Lives in WorkingDocument.body_json; autosaved normally.
//
// Phase 3: markers are visible and manageable in the editor.
// Phase 4: executing markers creates a new WritingPiece + WorkSession.

import { Node, mergeAttributes } from '@tiptap/core'
import { NodeSelection } from '@tiptap/pm/state'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { SplitMarkerView } from './SplitMarkerView'

export interface SplitMarkerAttrs {
  markerId: string
  source: 'ai' | 'manual'
  title: string | null
  rationale: string | null
}

export interface AISplitPoint {
  after_paragraph_index: number
  rationale: string
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    splitMarker: {
      insertSplitMarker: (
        attrs: Partial<SplitMarkerAttrs> & { source: 'ai' | 'manual' }
      ) => ReturnType
      removeSplitMarker: (markerId: string) => ReturnType
      insertSplitMarkersFromAI: (splitPoints: AISplitPoint[]) => ReturnType
    }
  }
}

export const SplitMarker = Node.create({
  name: 'splitMarker',

  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      markerId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-marker-id'),
        renderHTML: (attrs) => ({ 'data-marker-id': attrs.markerId }),
      },
      source: {
        default: 'manual',
        parseHTML: (el) => el.getAttribute('data-source'),
        renderHTML: (attrs) => ({ 'data-source': attrs.source }),
      },
      title: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-title'),
        renderHTML: (attrs) => ({ 'data-title': attrs.title }),
      },
      rationale: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-rationale'),
        renderHTML: (attrs) => ({ 'data-rationale': attrs.rationale }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-split-marker]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-split-marker': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(SplitMarkerView)
  },

  addCommands() {
    return {
      insertSplitMarker:
        (attrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                markerId: attrs.markerId ?? crypto.randomUUID(),
                source: attrs.source,
                title: attrs.title ?? null,
                rationale: attrs.rationale ?? null,
              },
            })
            .run()
        },

      removeSplitMarker:
        (markerId) =>
        ({ state, tr, dispatch }) => {
          let found = false
          state.doc.descendants((node, pos) => {
            if (node.type.name === 'splitMarker' && node.attrs.markerId === markerId) {
              if (dispatch) tr.delete(pos, pos + node.nodeSize)
              found = true
              return false
            }
          })
          if (found && dispatch) dispatch(tr)
          return found
        },

      insertSplitMarkersFromAI:
        (splitPoints) =>
        ({ state, tr, dispatch }) => {
          if (!splitPoints.length) return false

          // Collect the end-position of every top-level block node.
          // This mirrors the paragraph indexing used by extract_text_from_prosemirror()
          // on the backend, so after_paragraph_index 0 = after the first top-level block.
          const blockEnds: number[] = []
          state.doc.forEach((node, offset) => {
            blockEnds.push(offset + node.nodeSize)
          })

          // Process in reverse index order so earlier insertions don't shift later positions.
          const sorted = [...splitPoints].sort(
            (a, b) => b.after_paragraph_index - a.after_paragraph_index
          )

          for (const sp of sorted) {
            const insertPos = blockEnds[sp.after_paragraph_index]
            if (insertPos === undefined) continue
            const markerNode = state.schema.nodes.splitMarker.create({
              markerId: crypto.randomUUID(),
              source: 'ai',
              title: null,
              rationale: sp.rationale,
            })
            tr.insert(insertPos, markerNode)
          }

          if (dispatch) dispatch(tr)
          return true
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { selection } = editor.state
        if (
          !(selection instanceof NodeSelection) ||
          selection.node.type.name !== 'splitMarker'
        ) {
          return false
        }
        editor.commands.removeSplitMarker(selection.node.attrs.markerId)
        return true
      },
      Delete: ({ editor }) => {
        const { selection } = editor.state
        if (
          !(selection instanceof NodeSelection) ||
          selection.node.type.name !== 'splitMarker'
        ) {
          return false
        }
        editor.commands.removeSplitMarker(selection.node.attrs.markerId)
        return true
      },
    }
  },
})

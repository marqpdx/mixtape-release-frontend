// extensions/CommentMark.ts
// Inline mark that highlights text anchored to a DispatchComment.
// Stores the comment's UUID as a data attribute; highlight moves with the text
// as Yjs applies collaborative edits.

import { Mark, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    commentMark: {
      setCommentMark: (commentId: string) => ReturnType
      unsetCommentMark: (commentId: string) => ReturnType
    }
  }
}

export const CommentMark = Mark.create({
  name: 'commentMark',
  inclusive: false,
  spanning: true,

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-comment-id'),
        renderHTML: (attrs) =>
          attrs.commentId ? { 'data-comment-id': attrs.commentId } : {},
      },
    }
  },

  parseHTML() {
    return [{ tag: 'mark[data-comment-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'mark',
      mergeAttributes(HTMLAttributes, { class: 'dc-comment-mark' }),
      0,
    ]
  },

  addCommands() {
    return {
      setCommentMark:
        (commentId: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { commentId }),

      unsetCommentMark:
        (commentId: string) =>
        ({ state, tr, dispatch }) => {
          state.doc.descendants((node, pos) => {
            node.marks.forEach((mark) => {
              if (mark.type.name === this.name && mark.attrs.commentId === commentId) {
                if (dispatch) {
                  tr.removeMark(pos, pos + node.nodeSize, mark.type)
                }
              }
            })
          })
          if (dispatch) dispatch(tr)
          return true
        },
    }
  },
})

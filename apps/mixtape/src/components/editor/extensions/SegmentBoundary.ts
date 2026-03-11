// extensions/SegmentBoundary.ts
//
// Custom TipTap node for artifact stream segment boundaries.
// Inserted by /new and /renew commands. Renders as a visual divider
// showing artifact type and title. Deletion triggers merge confirmation.

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SegmentBoundaryView } from './SegmentBoundaryView';

export interface SegmentBoundaryOptions {
  onDelete?: (attrs: SegmentBoundaryAttrs) => Promise<boolean>;
}

export interface SegmentBoundaryAttrs {
  segmentId: string;
  artifactType: string;
  artifactId: string;
  isAnchorReturn: boolean;
  title: string | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    segmentBoundary: {
      insertSegmentBoundary: (attrs: SegmentBoundaryAttrs) => ReturnType;
      removeSegmentBoundary: (segmentId: string) => ReturnType;
    };
  }
}

export const SegmentBoundary = Node.create<SegmentBoundaryOptions>({
  name: 'segmentBoundary',

  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,

  addOptions() {
    return {
      onDelete: undefined,
    };
  },

  addAttributes() {
    return {
      segmentId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-segment-id'),
        renderHTML: (attrs) => ({ 'data-segment-id': attrs.segmentId }),
      },
      artifactType: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-artifact-type'),
        renderHTML: (attrs) => ({ 'data-artifact-type': attrs.artifactType }),
      },
      artifactId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-artifact-id'),
        renderHTML: (attrs) => ({ 'data-artifact-id': attrs.artifactId }),
      },
      isAnchorReturn: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-anchor-return') === 'true',
        renderHTML: (attrs) => ({ 'data-anchor-return': String(attrs.isAnchorReturn) }),
      },
      title: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-title'),
        renderHTML: (attrs) => ({ 'data-title': attrs.title }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-segment-boundary]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-segment-boundary': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SegmentBoundaryView);
  },

  addCommands() {
    return {
      insertSegmentBoundary:
        (attrs: SegmentBoundaryAttrs) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs,
            })
            .run();
        },

      removeSegmentBoundary:
        (segmentId: string) =>
        ({ state, tr, dispatch }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (
              node.type.name === 'segmentBoundary' &&
              node.attrs.segmentId === segmentId
            ) {
              if (dispatch) {
                tr.delete(pos, pos + node.nodeSize);
              }
              found = true;
              return false;
            }
          });
          if (found && dispatch) {
            dispatch(tr);
          }
          return found;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;

        // Only handle when a segmentBoundary node is selected
        if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'segmentBoundary') {
          return false;
        }

        const attrs = selection.node.attrs as SegmentBoundaryAttrs;
        const onDelete = this.options.onDelete;

        if (onDelete) {
          // Ask for confirmation asynchronously
          onDelete(attrs).then((confirmed) => {
            if (confirmed) {
              editor.commands.removeSegmentBoundary(attrs.segmentId);
            }
          });
          return true; // Prevent default deletion
        }

        return false;
      },
      Delete: ({ editor }) => {
        const { state } = editor;
        const { selection } = state;

        if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'segmentBoundary') {
          return false;
        }

        const attrs = selection.node.attrs as SegmentBoundaryAttrs;
        const onDelete = this.options.onDelete;

        if (onDelete) {
          onDelete(attrs).then((confirmed) => {
            if (confirmed) {
              editor.commands.removeSegmentBoundary(attrs.segmentId);
            }
          });
          return true;
        }

        return false;
      },
    };
  },
});

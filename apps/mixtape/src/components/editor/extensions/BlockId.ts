import { Extension } from "@tiptap/core";
import { v4 as uuid } from "uuid";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    blockId: {
      /** Ensure every block node has a stable blockId attribute */
      ensureBlockIds: () => ReturnType;
    };
  }
}

export const BlockId = Extension.create({
  name: "blockId",

  addGlobalAttributes() {
    return [
      {
        // Only list node types you actually use from your schema/extensions
        types: [
          "paragraph",
          "heading",
          "bulletList",
          "orderedList",
          "listItem",
          "blockquote",
          "codeBlock",
        ],
        attributes: {
          blockId: {
            default: null,
            parseHTML: (el) => el.getAttribute?.("data-block-id") ?? null,
            renderHTML: (attrs) =>
              attrs.blockId ? { "data-block-id": attrs.blockId } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      ensureBlockIds:
        () =>
        ({ state, tr, dispatch }) => {
          let changed = false;
          state.doc.descendants((node, pos) => {
            if (node.isBlock && node.attrs && node.attrs.blockId == null) {
              tr.setNodeMarkup(pos, node.type, { ...node.attrs, blockId: uuid() }, node.marks);
              changed = true;
            }
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },

  onCreate() {
    this.editor.commands.ensureBlockIds();
  },

  onUpdate() {
    this.editor.commands.ensureBlockIds();
  },
});

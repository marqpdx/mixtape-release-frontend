// extensions/WritingExtras.ts
// Inline nodes behind the toolbar's Extras row. Their look lives in
// @mixtape/content/writingExtras so the editor and the reader match.
//   colorCircle   { hex }                       - a circle one capital letter tall
//   dialogueAside { label, request, response }  - a phrase that opens an exchange

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { colorCircleStyle, dialogueAsidePreview, normaliseHex } from "@mixtape/content/writingExtras";
import { DialogueAsideView } from "./DialogueAsideView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    colorCircle: { insertColorCircle: (hex: string) => ReturnType };
    dialogueAside: {
      insertDialogueAside: (attrs: { label: string; request: string; response: string }) => ReturnType;
    };
  }
}

export const ColorCircle = Node.create({
  name: "colorCircle",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      hex: {
        default: null,
        parseHTML: (el) => normaliseHex(el.getAttribute("data-color-circle")),
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-color-circle]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const hex = normaliseHex(node.attrs.hex) ?? "#000000";
    return ["span", mergeAttributes(HTMLAttributes, {
      class: "wx-color-circle",
      "data-color-circle": hex,
      title: hex,
      role: "img",
      "aria-label": `Colour ${hex}`,
      style: colorCircleStyle(hex),
    })];
  },

  renderText: ({ node }) => `● ${node.attrs.hex ?? ""}`.trim(),

  addCommands() {
    return {
      insertColorCircle: (hex) => ({ commands }) => {
        const color = normaliseHex(hex);
        return color ? commands.insertContent({ type: this.name, attrs: { hex: color } }) : false;
      },
    };
  },
});

export const DialogueAside = Node.create({
  name: "dialogueAside",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    const text = (name: string) => ({
      default: "",
      parseHTML: (el: HTMLElement) => el.getAttribute(`data-${name}`) ?? "",
      renderHTML: () => ({}),
    });
    return { label: text("label"), request: text("request"), response: text("response") };
  },

  parseHTML() {
    return [{ tag: "span[data-dialogue-aside]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, {
      class: "wx-dialogue-aside",
      "data-dialogue-aside": "",
      "data-label": node.attrs.label,
      "data-request": node.attrs.request,
      "data-response": node.attrs.response,
      title: dialogueAsidePreview(node.attrs.request ?? ""),
    }), node.attrs.label || "aside"];
  },

  renderText: ({ node }) => node.attrs.label ?? "",

  addNodeView() {
    return ReactNodeViewRenderer(DialogueAsideView, { as: "span" });
  },

  addCommands() {
    return {
      insertDialogueAside: (attrs) => ({ commands }) =>
        commands.insertContent({ type: this.name, attrs }),
    };
  },
});

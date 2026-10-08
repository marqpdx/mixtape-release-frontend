import Blockquote from "@tiptap/extension-blockquote";

export type ConversationRole = "querent" | "respondent";

export const ConversationBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      role: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const role = element.getAttribute("data-chat-role");
          return role === "querent" || role === "respondent" ? role : null;
        },
        renderHTML: (attributes: { role?: ConversationRole | null }) =>
          attributes.role ? { "data-chat-role": attributes.role } : {},
      },
    };
  },
});

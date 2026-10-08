// apps/mixtape/src/components/editor/TipTapCollabEditor.tsx
//
// Option A (recommended):
// - Seed happens ONLY after server-ack sync (ydoc.__serverSynced === true).
// - Seed only if the Yjs doc is still empty AFTER sync.
// - emitUpdate: true so the seed becomes a real Yjs update (broadcast + persisted by Node).
// - No client PATCH here (Node dispatch owns canonical yjs_state persistence).
//
// Notes:
// - This file assumes useYjsSocketProvider sets (ydoc as any).__serverSynced = true
//   when it receives the server "yjs-synced" ack (deterministic gate).
// - We keep lightweight logs; trim later if you want.

"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import StarterKit from "@tiptap/starter-kit";
import Paragraph from "@tiptap/extension-paragraph";
import * as Y from "yjs";
import { Box } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { Prose } from "@components/ui/prose";
import TipTapToolbar from "./TipTapToolbar";
import { LbAnchor } from "./extensions/LbAnchor";
import { CommentMark } from "./extensions/CommentMark";
import { ConversationBlockquote } from "./extensions/ConversationBlockquote";

const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      blockId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-block-id"),
        renderHTML: (attributes) => {
          if (!attributes.blockId) return {};
          return { "data-block-id": attributes.blockId };
        },
      },
    };
  },
});

const CollabStarterKit = StarterKit.configure({
  undoRedo: false,
  paragraph: false,
  blockquote: false,
  link: { openOnClick: false },
});

interface TipTapCollabEditorProps {
  initialContent?: JSONContent | string;
  yjsProvider: Record<string, unknown>;
  ydoc: Y.Doc;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  minimalChrome?: boolean;
}

type YDocWithMeta = Y.Doc & {
  __serverSynced?: boolean;
  __didSeed?: boolean;
  __initialContent?: JSONContent | string;
  __forceOverwrite?: boolean;
};

const TipTapCollabEditor = forwardRef<ReturnType<typeof useEditor>, TipTapCollabEditorProps>(
  (
    {
      initialContent = "",
      yjsProvider,
      ydoc,
      editable = true,
      placeholder = "Type here...",
      className = "",
      minimalChrome = false,
    },
    ref
  ) => {
    const bgColorEditor = useColorModeValue("#FBFBFA", "gray.800");
    const toolbarBorderColor = useColorModeValue("gray.200", "gray.700");
    const textColor = useColorModeValue("gray.900", "gray.50");
    void initialContent;
    void yjsProvider;

    // Heuristic: if state has any meaningful bytes, treat as non-empty
    function ydocLooksEmpty(doc: Y.Doc) {
      const state = Y.encodeStateAsUpdate(doc);
      if (state.length > 8) return false; // non-empty enough to skip seed
      const frag = doc.getXmlFragment("default");
      return frag.length === 0;
    }

    const extensions = useMemo(() => {
      console.log("🔧 [CollabEditor] Creating extensions w/ Y.Doc:", ydoc.clientID);
      return [
        CollabStarterKit,
        ConversationBlockquote,
        CustomParagraph,
        LbAnchor,
        CommentMark,
        Collaboration.configure({
          document: ydoc,
          field: "default",
        }),
      ];
    }, [ydoc]);

    const editor = useEditor({
      extensions,
      // IMPORTANT: don't rely on `content: initialContent` under collaboration
      content: "",
      editable,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class: "editor-content",
          placeholder,
          spellcheck: "true",
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useImperativeHandle(ref, () => editor as any, [editor]);

    // Ensure editor respects editable prop changes
    useEffect(() => {
      if (!editor) return;
      editor.setEditable(!!editable);
    }, [editor, editable]);

    /**
     * ✅ Seed only AFTER server-ack sync, and ONLY if the Yjs doc is still empty.
     * This prevents "seed then remote state arrives" ballooning/duplication.
     *
     * IMPORTANT:
     * - We DO NOT use a fallback timer for sync.
     * - We wait for (ydoc as any).__serverSynced === true, which is set by useYjsSocketProvider
     *   when it receives the server "yjs-synced" ack.
     */
    useEffect(() => {
      if (!editor) return;
      if (!ydoc) return;

      // Already handled for this Y.Doc instance
      const ydocWithMeta = ydoc as YDocWithMeta;
      if (ydocWithMeta.__didSeed) return;

      const hasInitialContent = !!ydocWithMeta.__initialContent;
      if (!hasInitialContent) return;

      const contentToSeed = ydocWithMeta.__initialContent;

      let cancelled = false;

      async function maybeSeedAfterServerSync() {
        // Wait for authoritative server sync ack.
        // Tight poll; cheap and deterministic.
        for (let i = 0; i < 200; i++) {
          if (cancelled) return;
          if (ydocWithMeta.__serverSynced) break;
          await new Promise((r) => setTimeout(r, 25));
        }
        if (cancelled) return;

        if (!ydocWithMeta.__serverSynced) {
          // If we never saw the sync ack, do NOT seed.
          // Seeding without sync is the classic way to create duplication.
          console.warn("⚠️ [CollabEditor] Never saw __serverSynced; skipping seed to avoid duplication");
          return;
        }

        // Force-overwrite path: yjs_state was cleared by an external save (DualPanelEditor).
        // The Livewire room may be alive in memory with stale content — override it.
        if (ydocWithMeta.__forceOverwrite && contentToSeed) {
          console.log("🔥 [CollabEditor] Force-overwriting stale Yjs room state with content_snapshot");
          editor?.commands.setContent(contentToSeed, { emitUpdate: true });
          ydocWithMeta.__didSeed = true;
          delete ydocWithMeta.__initialContent;
          delete ydocWithMeta.__forceOverwrite;
          return;
        }

        // After sync: if doc already has content, DO NOT seed.
        if (!ydocLooksEmpty(ydoc)) {
          console.log("✅ [CollabEditor] Doc not empty after server sync; skipping seed");
          ydocWithMeta.__didSeed = true;
          delete ydocWithMeta.__initialContent;
          return;
        }

        console.log("🌱 [CollabEditor] Seeding EMPTY doc after server sync");

        // Option A:
        // emitUpdate=true writes into Yjs so it can sync + be persisted by Node dispatch server.
        if (contentToSeed) {
          editor?.commands.setContent(contentToSeed, { emitUpdate: true });
        }

        ydocWithMeta.__didSeed = true;
        delete ydocWithMeta.__initialContent;
      }

      void maybeSeedAfterServerSync();

      return () => {
        cancelled = true;
      };
      // yjsProvider intentionally not used here; serverSync flag lives on ydoc
    }, [editor, ydoc]);

    // Debug: Track Y.Doc updates (keep while validating; remove or gate behind env later)
    useEffect(() => {
      if (!ydoc) return;

      const handleUpdate = (update: Uint8Array, origin: unknown) => {
        console.log("🔄 [CollabEditor] Y.Doc update", {
          updateSize: update.length,
          originType: origin?.constructor?.name,
          clientID: ydoc.clientID,
        });
      };

      ydoc.on("update", handleUpdate);
      return () => {
        ydoc.off("update", handleUpdate);
      };
    }, [ydoc]);

    // Log editor setup
    useEffect(() => {
      if (!editor || !ydoc) return;

      const extensionNames = editor.extensionManager.extensions.map((e) => e.name);

      if (!extensionNames.includes("collaboration")) {
        console.error("❌ [CollabEditor] Collaboration extension missing", {
          extensionNames,
          ydocClientID: ydoc.clientID,
        });
      }

      console.log("🤝 [CollabEditor] Editor ready", {
        ydocClientID: ydoc.clientID,
        extensionNames,
      });
    }, [editor, ydoc]);

    const isBorderless = className.includes("borderless-editor");

    return (
      <React.Fragment>
        <Box
          className={className}
          {...(!isBorderless && {
            borderWidth: "1px",
            borderRadius: "md",
            p: 4,
          })}
          minH={isBorderless ? "auto" : "300px"}
        >
          <Box
            borderWidth="1px"
            borderColor={toolbarBorderColor}
            borderRadius="lg"
            overflow="hidden"
            pt={2}
            pl={1}
          >
            {!minimalChrome && <TipTapToolbar editor={editor} />}
            <Prose
              className="editor-content-prose"
              bg={bgColorEditor}
              maxW="full"
              css={{
                "& > *": { marginBlock: 0 },
                "& .ProseMirror": {
                  paddingX: "1.4em",
                  paddingY: "1em",
                  color: textColor,
                  lineHeight: 1.7,
                  "& strong, & b": {
                    fontWeight: 700,
                  },
                  "& em, & i": {
                    fontStyle: "italic !important",
                  },
                  "& blockquote[data-chat-role]": {
                    position: "relative",
                    borderLeftWidth: "3px",
                    borderRadius: "4px",
                    padding: "1.6em 1em 0.5em",
                    marginBlock: "1em",
                    background: "var(--chakra-colors-bg-subtle)",
                    fontStyle: "normal",
                  },
                  "& blockquote[data-chat-role]::before": {
                    position: "absolute",
                    top: "0.4em",
                    left: "1em",
                    fontSize: "0.7em",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  },
                  "& blockquote[data-chat-role='querent']": {
                    borderLeftColor: "var(--chakra-colors-teal-500)",
                  },
                  "& blockquote[data-chat-role='querent']::before": {
                    content: '"Querent"',
                    color: "var(--chakra-colors-teal-600)",
                  },
                  "& blockquote[data-chat-role='respondent']": {
                    borderLeftColor: "var(--chakra-colors-blue-500)",
                  },
                  "& blockquote[data-chat-role='respondent']::before": {
                    content: '"Respondent"',
                    color: "var(--chakra-colors-blue-600)",
                  },
                  "& h1": {
                    fontSize: "2rem",
                    lineHeight: 1.2,
                    fontWeight: 700,
                    marginTop: "1.1em",
                    marginBottom: "0.45em",
                  },
                  "& h2": {
                    fontSize: "1.55rem",
                    lineHeight: 1.28,
                    fontWeight: 650,
                    marginTop: "1em",
                    marginBottom: "0.4em",
                  },
                  "& h3": {
                    fontSize: "1.22rem",
                    lineHeight: 1.34,
                    fontWeight: 620,
                    marginTop: "0.9em",
                    marginBottom: "0.35em",
                  },
                  "& mark.dc-comment-mark": {
                    background: "rgba(250, 204, 21, 0.35)",
                    borderBottom: "2px solid rgba(234, 179, 8, 0.7)",
                    borderRadius: "2px",
                    cursor: "pointer",
                  },
                  "& mark.dc-comment-mark:hover": {
                    background: "rgba(250, 204, 21, 0.55)",
                  },
                  "& h4": {
                    fontSize: "1.05rem",
                    lineHeight: 1.4,
                    fontWeight: 600,
                    marginTop: "0.8em",
                    marginBottom: "0.3em",
                  },
                },
              }}
            >
              <EditorContent editor={editor} />
            </Prose>
          </Box>
        </Box>
      </React.Fragment>
    );
  }
);

TipTapCollabEditor.displayName = "TipTapCollabEditor";
export default TipTapCollabEditor;


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
});

interface TipTapCollabEditorProps {
  initialContent?: JSONContent | string;
  yjsProvider: Record<string, unknown>;
  ydoc: Y.Doc;
  editable?: boolean;
  placeholder?: string;
  className?: string;
}

type YDocWithMeta = Y.Doc & {
  __serverSynced?: boolean;
  __didSeed?: boolean;
  __initialContent?: JSONContent | string;
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
    },
    ref
  ) => {
    const bgColorEditor = useColorModeValue("#FBFBFA", "gray.800");
    const toolbarBorderColor = useColorModeValue("gray.200", "gray.700");
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
        CustomParagraph,
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
            pt={1}
            pl={1}
          >
            <TipTapToolbar editor={editor} />
            <Prose
              className="editor-content-prose"
              bg={bgColorEditor}
              maxW="full"
              css={{ "& > *": { marginBlock: 0 } }}
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






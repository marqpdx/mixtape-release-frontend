// src/components/editor/TipTapCollabEditor.tsx

"use client";

import { useEffect, forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
import StarterKit from "@tiptap/starter-kit";
import Paragraph from "@tiptap/extension-paragraph";
import * as Y from "yjs";
import { Box } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { Prose } from "@components/ui/prose";
import { axiosInstance } from "@providers/auth-provider/axiosInstance";

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
  yjsProvider: any;
  ydoc: Y.Doc;
  editable?: boolean;
  placeholder?: string;
  className?: string;
}

const TipTapCollabEditor = forwardRef<any, TipTapCollabEditorProps>(
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

    const extensions = useMemo(() => {
      console.log("🔧 Creating extensions array with Y.Doc:", ydoc.clientID);
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
      // IMPORTANT: do not rely on `content: initialContent` under collaboration
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

    useImperativeHandle(ref, () => editor, [editor]);

    // Ensure editor respects editable prop changes
    useEffect(() => {
      if (!editor) return;
      editor.setEditable(!!editable);
    }, [editor, editable]);

    // ✅ Seed once, AFTER editor exists (collab binding attached)
    // Store flag on ydoc (persists across remounts) instead of component ref
    useEffect(() => {
      if (!editor) return;
      if (!ydoc) return;

      // Check if we've already seeded this Y.Doc instance
      if ((ydoc as any).__didSeed) {
        console.log("⏭️ [CollabEditor] Y.Doc already seeded in previous mount, skipping");
        return;
      }

      const frag = ydoc.getXmlFragment("default");
      const isEmpty = frag.length === 0;

      console.log(`🔍 [CollabEditor] Seed check - fragment empty: ${isEmpty}, fragment length: ${frag.length}`);

      // Check if useYjsSocketProvider fetched content_snapshot for seeding
      const hasInitialContent = !!(ydoc as any).__initialContent;
      console.log(`🔍 [CollabEditor] Has __initialContent: ${hasInitialContent}`);

      // ONLY seed if fragment is empty AND we have content
      if (isEmpty && hasInitialContent) {
        const contentToSeed = (ydoc as any).__initialContent;
        const dispatchContentId = (ydoc as any).__dispatchContentId;

        console.log("🌱 [CollabEditor] Seeding Y.Doc from content_snapshot");
        editor.commands.setContent(contentToSeed as any, {
          emitUpdate: false,  // Don't broadcast - this is initial seed
        });

        // CRITICAL: Immediately save yjs_state to backend to prevent re-seeding
        setTimeout(async () => {
          try {
            // Verify fragment has content before encoding
            const frag = ydoc.getXmlFragment("default");
            if (frag.length === 0) {
              console.error("❌ [CollabEditor] Fragment still empty after seeding! Collaboration binding may not have synced yet. Retrying in 500ms...");
              // Retry once after another 500ms
              setTimeout(async () => {
                const retryFrag = ydoc.getXmlFragment("default");
                if (retryFrag.length === 0) {
                  console.error("❌ [CollabEditor] Fragment still empty after retry. Aborting save.");
                  return;
                }
                await performSave();
              }, 500);
              return;
            }

            await performSave();

            async function performSave() {
              const state = Y.encodeStateAsUpdate(ydoc);
              const base64State = btoa(String.fromCharCode(...state));

              console.log(`💾 [CollabEditor] Saving yjs_state - encoded size: ${state.length} bytes, base64 length: ${base64State.length}`);

              if (state.length === 0) {
                console.error("❌ [CollabEditor] Encoded state is empty! Aborting save.");
                return;
              }

              await axiosInstance.patch(`/api/dispatch/content/${dispatchContentId}`, {
                yjs_state: base64State,
                content_snapshot: contentToSeed,
              });

              console.log("✅ [CollabEditor] Initial yjs_state saved successfully");
            }
          } catch (err) {
            console.error("❌ [CollabEditor] Failed to save initial yjs_state:", err);
          }
        }, 500); // Wait for TipTap to fully apply content

        // CRITICAL: Mark as seeded and clear __initialContent
        (ydoc as any).__didSeed = true;
        delete (ydoc as any).__initialContent;
        console.log("🧹 [CollabEditor] Marked Y.Doc as seeded and cleared __initialContent");
      } else {
        if (!isEmpty) {
          console.log("✅ [CollabEditor] Y.Doc already has content; skipping seed");
          // Mark as "seeded" (content exists) to prevent future seed attempts
          (ydoc as any).__didSeed = true;
        }
        // Clear __initialContent if it exists (shouldn't seed if fragment has content)
        if (hasInitialContent) {
          delete (ydoc as any).__initialContent;
          console.log("🧹 [CollabEditor] Cleared stale __initialContent");
        }
      }
    }, [editor, ydoc, initialContent]);

    // Debug: Track Y.Doc updates
    useEffect(() => {
      if (!ydoc) return;

      const handleUpdate = (update: Uint8Array, origin: any) => {
        console.log("🔄 Y.Doc update detected in TipTapCollabEditor:", {
          updateSize: update.length,
          origin,
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

      // ✅ fast signal if something’s miswired
      if (!extensionNames.includes("collaboration")) {
        console.error("❌ Collab invariant failed: editor exists but Collaboration extension missing", {
          extensionNames,
          ydocClientID: ydoc.clientID,
        });
      }

      console.log("🤝 TipTapCollabEditor: Editor ready", {
        ydocClientID: ydoc.clientID,
        extensionNames,
      });
    }, [editor, ydoc]);

    const isBorderless = className.includes("borderless-editor");

    return (
      <Box
        className={className}
        {...(!isBorderless && {
          borderWidth: "1px",
          borderRadius: "md",
          p: 4,
        })}
        minH={isBorderless ? "auto" : "300px"}
      >
        <Box border={"1px solid gray"} pt={1} pl={1}>
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
    );
  }
);

TipTapCollabEditor.displayName = "TipTapCollabEditor";
export default TipTapCollabEditor;

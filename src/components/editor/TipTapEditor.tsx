// src/components/editor/TipTapEditor.tsx - Updated with forwardRef

"use client";

import { useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent, JSONContent } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
// import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

import StarterKit from "@tiptap/starter-kit";
import History from "@tiptap/extension-history";
import Heading from "@tiptap/extension-heading";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import * as Y from "yjs";

import Underline from "@tiptap/extension-underline";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import Link from "@tiptap/extension-link";

import { Box, Spinner } from "@chakra-ui/react";
import TipTapToolbar from "./TipTapToolbar";
import { BlockRouting, RouteMeta } from "./extensions/BlockRouting"
import { Prose } from "@components/ui/prose";
import { Awareness } from "y-protocols/awareness.js";
import { BlockId } from "./extensions/BlockId";

import { useColorModeValue } from "@components/ui/color-mode";

type ToolbarOption = "bold" | "italic" | "heading" | "underline" | "bulletList" | "link";

interface TipTapEditorProps {
  initialContent?: JSONContent | string;
  onContentChange?: (content: JSONContent) => void;
  autoSave?: {
    triggerSave: () => void;
    status: "idle" | "saving" | "saved" | "error";
  };
  editable?: boolean;
  placeholder?: string;
  toolbarOptions?: ToolbarOption[];
  className?: string;
  collab?: {
    ydoc: Y.Doc;
    awareness: Awareness;
    user: { name: string; color?: string };
  };
}

const TipTapEditor = forwardRef<any, TipTapEditorProps>(({
  initialContent = "",
  onContentChange,
  autoSave,
  editable = true,
  collab,
  placeholder = "Type here...",
  toolbarOptions = ["bold", "italic", "heading", "underline", "bulletList", "link"],
  className = "",
}, ref) => {
  const latestContentRef = useRef<JSONContent | null>(null);
  const isUpdatingContentRef = useRef(false);
  const localRouteMapRef = useRef<Map<string, RouteMeta>>(new Map())

  const bgColorEditor = useColorModeValue("#FBFBFA", "gray.800");

  const routingOpts = useMemo(() => {
    if (collab?.ydoc) {
      // Collaborative storage in Yjs
      const yMap = collab.ydoc.getMap<RouteMeta>("routeMeta")
      return {
        getRouteMeta: (blockId: string) => yMap.get(blockId),
        setRouteMeta: (blockId: string, meta: RouteMeta) => yMap.set(blockId, meta),
      }
    } else {
      // Local Map in solo mode
      return {
        getRouteMeta: (blockId: string) => localRouteMapRef.current.get(blockId),
        setRouteMeta: (blockId: string, meta: RouteMeta) => {
          localRouteMapRef.current.set(blockId, meta)
          // Optional: persist with draft save
        },
      }
    }
  }, [collab?.ydoc])

  // Build base extensions array
  const baseExtensions = [
    StarterKit.configure({
      // Exclude history from StarterKit - we'll add it manually when needed
      undoRedo: false,
    }),
    // Add history extension only when NOT in collaborative mode
    ...(collab ? [] : [History]),
    BlockId,
    BlockRouting.configure(routingOpts),
    ...(toolbarOptions.includes("heading") ? [Heading.configure({ levels: [1, 2, 3] })] : []),
    ...(toolbarOptions.includes("bold") ? [Bold.configure({
      HTMLAttributes: {
        class: 'bold-text',
      },
    })] : []),
    ...(toolbarOptions.includes("italic") ? [Italic.configure({
      HTMLAttributes: {
        class: 'italic-text',
      },
    })] : []),
    ...(toolbarOptions.includes("underline") ? [Underline.configure({
      HTMLAttributes: {
        class: 'underline-text',
      },
    })] : []),
    ...(toolbarOptions.includes("bulletList") ? [BulletList, ListItem] : []),
    ...(toolbarOptions.includes("link") ? [
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
    ] : []),
  ];

  // Add collaboration extensions if in collaborative mode
  const extensions = collab && collab.ydoc && collab.awareness
    ? [
        ...baseExtensions,
        Collaboration.configure({
          document: collab.ydoc,
          field: 'default', // Specify the field name explicitly
        }),
        // TODO: Fix CollaborationCursor - currently causes "ystate is undefined" error
        // CollaborationCursor.configure({
        //   provider: {
        //     awareness: collab.awareness,
        //     doc: collab.ydoc,
        //   },
        //   user: collab.user,
        // })
      ]
    : baseExtensions;

  if (collab && collab.ydoc && collab.awareness) {
    console.log("🤝 Setting up collaboration with Y.Doc:", collab.ydoc);
    console.log("🤝 Y.Doc clientID:", collab.ydoc.clientID);
    console.log("🤝 Awareness:", collab.awareness);
    console.log("🤝 Awareness states:", collab.awareness.getStates());
  }

  const editorConfig: Parameters<typeof useEditor>[0] = {
    extensions,
    editable,
    editorProps: {
      attributes: {
        class: "editor-content",
        placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      if (isUpdatingContentRef.current) return; // Skip if we're programmatically updating

      const json = editor.getJSON();
      latestContentRef.current = json;
      onContentChange?.(json);
      autoSave?.triggerSave();
    },
    immediatelyRender: false,
  };

  // Add initial content for both collaborative and non-collaborative modes
  if (initialContent && !collab) {
    // Non-collaborative mode - set content normally
    editorConfig.content = initialContent;
  } else if (initialContent && collab) {
    // Collaborative mode - we'll set content after editor creation
    console.log("🔄 Will initialize collaborative editor with content:", initialContent);
  }

  const editor = useEditor(editorConfig);

  // Expose editor instance via ref
  useImperativeHandle(ref, () => editor, [editor]);

  // Add this in the TipTapEditor component after creating the editor
  useEffect(() => {
    if (editor && collab?.ydoc) {
      const handleUpdate = (update: Uint8Array, origin: any) => {
        console.log("🔄 Y.js document update detected:", {
          updateSize: update.length,
          origin: origin,
          clientID: collab.ydoc.clientID
        });
      };

      collab.ydoc.on('update', handleUpdate);

      return () => {
        collab.ydoc.off('update', handleUpdate);
      };
    }
  }, [editor, collab]);

  // Initialize collaborative editor with saved content
  useEffect(() => {
    console.log("🐛 Collab init effect triggered:", {
      hasEditor: !!editor,
      hasCollab: !!collab,
      hasInitialContent: !!initialContent,
      initialContent: initialContent
    });

    // In TipTapEditor.tsx, update the initialization check:
    if (editor && collab && initialContent) {
      const yXmlFragment = collab.ydoc.getXmlFragment('default');
      console.log("🐛 Y.js fragment length:", yXmlFragment.length);

      // ONLY initialize if fragment is completely empty AND this is the first time
      if (yXmlFragment.length === 0 && yXmlFragment.toString() === '') {
        console.log("🔄 Initializing collaborative editor with saved content:", initialContent);
        isUpdatingContentRef.current = true;
        editor.commands.setContent(initialContent);
        setTimeout(() => {
          isUpdatingContentRef.current = false;
        }, 100);
      } else {
        console.log("🐛 Y.js document already has content, skipping initialization");
      }
    }
  }, [editor, collab, initialContent]);

  // Update editor content when initialContent changes (non-collaborative mode only)
  useEffect(() => {
    if (!editor || !initialContent || collab) return;

    // Check if the content is actually different to avoid unnecessary updates
    const currentContent = editor.getJSON();
    const newContent = typeof initialContent === 'string' ? initialContent : initialContent;

    // Simple comparison - you might want to use a deep comparison library like lodash
    if (JSON.stringify(currentContent) !== JSON.stringify(newContent)) {
      console.log("Updating editor content with:", newContent);

      // Set flag to prevent triggering onContentChange during programmatic update
      isUpdatingContentRef.current = true;

      // Update the editor content
      editor.commands.setContent(newContent);

      // Reset flag after a brief delay to ensure the update is complete
      setTimeout(() => {
        isUpdatingContentRef.current = false;
      }, 0);
    }
  }, [editor, initialContent, collab]);

  if (!editor) {
    return (
      <Box py={4} textAlign="center">
        <Spinner size="sm" />
      </Box>
    );
  }

  const isBorderless = className.includes("borderless-editor");

  return (
    <Box
      className={className}
      {...(!isBorderless && {
        borderWidth: "1px",
        borderRadius: "md",
        p: 4
      })}
      minH={isBorderless ? "auto" : "300px"}
      css={{
        // Custom styles for the editor
        "& .ProseMirror": {
          paddingX: "1.4em",
          paddingY: "1em",
          // Reduce margin on first and last children - using :first-of-type for SSR safety
          "& > *:first-of-type": {
            marginTop: "0.5em !important",
          },
          "& > *:last-of-type": {
            marginBottom: "0.5em !important",
          }
        }
      }}
    >
      <Box border={'1px solid gray'} pt={1} pl={1}>
        <TipTapToolbar editor={editor} />
        <Prose className="editor-content-prose" bg={bgColorEditor} maxW="full"
          css={{ '& > *': { marginBlock: 0 } }}>
            <EditorContent editor={editor} />
        </Prose>
      </Box>

      {/* <Box
        mt={2}
        position="sticky"
        bottom={0}
        zIndex={1}
        bg={"gray.200"}
        borderTopWidth="1px"
        px={3}
        py={2}
      >
        <InkwellControls editor={editor} />
      </Box> */}
    </Box>
  );
});

TipTapEditor.displayName = "TipTapEditor";

export default TipTapEditor;
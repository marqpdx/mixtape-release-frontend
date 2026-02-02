// src/components/editor/TipTapEditor.tsx

"use client";

import { useEffect, useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { useEditor, EditorContent, JSONContent, Editor } from "@tiptap/react";
import Collaboration from "@tiptap/extension-collaboration";
// import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import * as Y from "yjs";

import Underline from "@tiptap/extension-underline";
import BulletList from "@tiptap/extension-bullet-list";
import ListItem from "@tiptap/extension-list-item";
import Link from "@tiptap/extension-link";
import Strike from "@tiptap/extension-strike";
import OrderedList from "@tiptap/extension-ordered-list";

import { Box, Spinner } from "@chakra-ui/react";
import { BlockRouting, RouteMeta } from "./extensions/BlockRouting"
import { Prose } from "@components/ui/prose";
import { Awareness } from "y-protocols/awareness.js";
import { BlockId } from "./extensions/BlockId";
import TipTapToolbar from "./TipTapToolbar";

import { useColorModeValue } from "@components/ui/color-mode";

type ToolbarOption =
  | "bold"
  | "italic"
  | "heading"
  | "underline"
  | "strike"
  | "bulletList"
  | "orderedList"
  | "link";

// Default toolbar options - defined outside component to maintain stable reference
const DEFAULT_TOOLBAR_OPTIONS: ToolbarOption[] = [
  "bold",
  "italic",
  "underline",
  "strike",
  "bulletList",
  "orderedList",
];

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
  // New Yjs props from MainEditor
  yjsProvider?: { awareness?: Awareness };
  ydoc?: Y.Doc;
  isCollaborative?: boolean;
  // Legacy collab prop (deprecated)
  collab?: {
    ydoc: Y.Doc;
    awareness: Awareness;
    user: { name: string; color?: string };
  };
}

const TipTapEditor = forwardRef<Editor | null, TipTapEditorProps>(({
  initialContent = "",
  onContentChange,
  autoSave,
  editable = true,
  collab,
  yjsProvider,
  ydoc,
  isCollaborative = false,
  placeholder = "Type here...",
  toolbarOptions = DEFAULT_TOOLBAR_OPTIONS,
  className = "",
}, ref) => {
  const latestContentRef = useRef<JSONContent | null>(null);
  const isUpdatingContentRef = useRef(false);
  const localRouteMapRef = useRef<Map<string, RouteMeta>>(new Map())

  const bgColorEditor = useColorModeValue("#FBFBFA", "gray.800");
  const toolbarBorderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.900", "gray.100");

  // Debug: Track component renders and prop changes
  console.log("🎨 aaaa TipTapEditor rendered");
  useEffect(() => {
    console.log("🔍 aaaa TipTapEditor collab prop changed:", {
      collabExists: !!collab,
      collabYdocClientID: collab?.ydoc?.clientID,
      collabInstance: collab,
    });
  }, [collab]);

  // Create unified collab object from either new props or legacy collab prop
  const collabConfig = useMemo(() => {
    // If new props are provided, use them
    if (isCollaborative && yjsProvider && ydoc) {
      console.log("🤝 TipTapEditor: Using new Yjs provider props", {
        hasProvider: !!yjsProvider,
        hasYdoc: !!ydoc,
        hasAwareness: !!yjsProvider?.awareness,
        clientID: ydoc.clientID
      });

      return {
        ydoc: ydoc,
        awareness: yjsProvider.awareness,
        user: {
          name: 'User', // This will be set by the awareness protocol
          color: '#000000'
        }
      };
    }

    // Otherwise use legacy collab prop
    if (collab) {
      console.log("🤝 TipTapEditor: Using legacy collab prop");
      return collab;
    }

    return null;
  }, [isCollaborative, yjsProvider, ydoc, collab]);

  const routingOpts = useMemo(() => {
    if (collabConfig?.ydoc) {
      // Collaborative storage in Yjs
      const yMap = collabConfig.ydoc.getMap<RouteMeta>("routeMeta")
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
  }, [collabConfig?.ydoc])

  // Build base extensions array - memoized to prevent editor recreation
  // Note: Collaboration extension automatically disables History in collaborative mode
  // Keep bulletList and listItem enabled to support existing content
  const baseExtensions = useMemo(() => [
    StarterKit.configure({
      heading: false,
      bold: false,
      italic: false,
      // Keep bulletList and listItem - needed for existing document content
      // bulletList: false,
      // listItem: false,
    }),
    BlockId,
    BlockRouting.configure(routingOpts),
  ], [routingOpts]);

  // Add toolbar extensions to both modes - memoized to prevent editor recreation
  const toolbarExtensions = useMemo(() => [
    // Configure extensions manually with custom settings
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
    // Underline is not in StarterKit, so add it directly
    ...(toolbarOptions.includes("underline") ? [Underline.configure({
      HTMLAttributes: {
        class: 'underline-text',
      },
    })] : []),
    ...(toolbarOptions.includes("strike") ? [Strike] : []),
    ...(toolbarOptions.includes("bulletList") ? [BulletList, ListItem] : []),
    ...(toolbarOptions.includes("orderedList") ? [OrderedList, ListItem] : []),
    ...(toolbarOptions.includes("link") ? [
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
    ] : []),
  ], [toolbarOptions]);

  // Combine base extensions with toolbar extensions - memoized to prevent editor recreation
  const allExtensions = useMemo(() => [...baseExtensions, ...toolbarExtensions], [baseExtensions, toolbarExtensions]);

  // Debug: Track which specific extension array is changing
  const prevBaseExtensions = useRef(baseExtensions);
  const prevToolbarExtensions = useRef(toolbarExtensions);
  const prevRoutingOpts = useRef(routingOpts);
  const prevToolbarOptions = useRef(toolbarOptions);

  useEffect(() => {
    if (prevToolbarOptions.current !== toolbarOptions) {
      console.log("⚠️ dddd toolbarOptions CHANGED!", {
        previous: prevToolbarOptions.current,
        current: toolbarOptions,
        sameReference: prevToolbarOptions.current === toolbarOptions,
        isDefault: toolbarOptions === DEFAULT_TOOLBAR_OPTIONS,
      });
      prevToolbarOptions.current = toolbarOptions;
    }
    if (prevBaseExtensions.current !== baseExtensions) {
      console.log("⚠️ bbbb baseExtensions CHANGED!");
      prevBaseExtensions.current = baseExtensions;
    }
    if (prevToolbarExtensions.current !== toolbarExtensions) {
      console.log("⚠️ bbbb toolbarExtensions CHANGED!");
      prevToolbarExtensions.current = toolbarExtensions;
    }
    if (prevRoutingOpts.current !== routingOpts) {
      console.log("⚠️ bbbb routingOpts CHANGED!");
      prevRoutingOpts.current = routingOpts;
    }
  }, [toolbarOptions, baseExtensions, toolbarExtensions, routingOpts]);

  // Add collaboration extensions if in collaborative mode - memoized to prevent editor recreation
  const extensions = useMemo(() => {
    console.log("🔧 aaaa Creating new extensions array");
    if (collabConfig && collabConfig.ydoc && collabConfig.awareness) {
      console.log("🔧 aaaa Adding Collaboration extension to array");
      return [
        ...allExtensions,
        Collaboration.configure({
          document: collabConfig.ydoc,
          field: 'default', // Specify the field name explicitly
        }),
        // TODO: Fix CollaborationCursor - currently causes "ystate is undefined" error
        // CollaborationCursor.configure({
        //   provider: {
        //     awareness: collabConfig.awareness,
        //     doc: collabConfig.ydoc,
        //   },
        //   user: collabConfig.user,
        // })
      ];
    }
    return allExtensions;
  }, [allExtensions, collabConfig]);

  if (collabConfig && collabConfig.ydoc && collabConfig.awareness) {
    console.log("🤝 aaaa Setting up collaboration with Y.Doc:", collabConfig.ydoc);
    console.log("🤝 Y.Doc clientID:", collabConfig.ydoc.clientID);
    console.log("🤝 Awareness:", collabConfig.awareness);
    console.log("🤝 Awareness states:", collabConfig.awareness.getStates());
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

      // In collaborative mode, Yjs handles all content sync - don't trigger callbacks
      if (collabConfig) {
        console.log("🤝 Collaborative mode: Skipping onContentChange/autoSave (Yjs handles sync)");
        return;
      }

      const json = editor.getJSON();
      latestContentRef.current = json;
      onContentChange?.(json);
      autoSave?.triggerSave();
    },
    immediatelyRender: false,
  };

  // Add initial content for non-collaborative mode only
  if (initialContent && !collabConfig) {
    // Non-collaborative mode - set content normally
    editorConfig.content = initialContent;
  }

  // In collaborative mode, DON'T set initial content here
  // The Y.Doc should already be populated by the provider before the editor is created

  const editor = useEditor(editorConfig);

  // Expose editor instance via ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useImperativeHandle(ref, () => editor as any, [editor]);

  // Add this in the TipTapEditor component after creating the editor
  useEffect(() => {
    if (editor && collabConfig?.ydoc) {
      const handleUpdate = (update: Uint8Array, origin: unknown) => {
        console.log("🔄 Y.js document update detected:", {
          updateSize: update.length,
          origin: origin,
          clientID: collabConfig.ydoc.clientID
        });
      };

      collabConfig.ydoc.on('update', handleUpdate);

      return () => {
        collabConfig.ydoc.off('update', handleUpdate);
      };
    }
  }, [editor, collabConfig]);

  // REMOVED: Don't initialize content in collaborative mode
  // The Y.Doc is already populated by useYjsSocketProvider before the editor is created
  // Calling setContent() breaks the Yjs binding between Y.Doc and ProseMirror

  // Update editor content when initialContent changes (non-collaborative mode only)
  useEffect(() => {
    if (!editor || !initialContent || collabConfig) return;

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
  }, [editor, initialContent, collabConfig]);

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
          color: textColor,
          "&.font-serif": {
            fontFamily: "ui-serif, Georgia, Cambria, \"Times New Roman\", Times, serif",
          },
          "&.font-sans": {
            fontFamily: "ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", sans-serif",
          },
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
      <Box
        borderWidth="1px"
        borderColor={toolbarBorderColor}
        borderRadius="lg"
        overflow="hidden"
        pt={1}
        pl={1}
      >
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

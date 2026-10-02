// apps/mixtape/src/components/editor/TipTapEditor.tsx

"use client";

import { useEffect, useMemo, useRef, forwardRef, useImperativeHandle, useState, useCallback } from "react";
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
import Image from "@tiptap/extension-image";

import { Box, Button, Spinner, Text, VStack } from "@chakra-ui/react";
import { BlockRouting, RouteMeta } from "./extensions/BlockRouting"
import { Prose } from "@components/ui/prose";
import { Awareness } from "y-protocols/awareness.js";
import { BlockId } from "./extensions/BlockId";
import { OutlineMarker } from "./extensions/OutlineMarker";
import { LbAnchor } from "./extensions/LbAnchor";
import TipTapToolbar from "./TipTapToolbar";
import { AutoCapitalize } from "./extensions/AutoCapitalize";
import { CORRECTION_FLASH, SpellCorrection, SpellCorrectionState } from "./extensions/SpellCorrection";
import { SpellCorrectionPopup } from "./SpellCorrectionPopup";
import { SpellScanDialog } from "./SpellScanDialog";
import { SpellFindings } from "./extensions/SpellFindings";
import { useBackgroundSpellCheck } from "@/hooks/useBackgroundSpellCheck";
import { useSpellDictionary } from "@/hooks/useSpellDictionary";
import { useUsers } from "@mixtape/api/hooks";
import { SegmentBoundary, SegmentBoundaryAttrs } from "./extensions/SegmentBoundary";
import { StreamCommands } from "./extensions/StreamCommands";
import { streamCommandsRender } from "./extensions/streamCommandsRender";
import { CompositionBar, CompositionSegment } from "./extensions/CompositionBar";
import { SplitMarker } from "./extensions/SplitMarker";
import { GristCommands } from "./extensions/GristCommands";
import { gristCommandsRender } from "./extensions/gristCommandsRender";
import { CompositionBarPanel } from "./CompositionBarPanel";
import { MergeConfirmationDialog } from "./MergeConfirmationDialog";

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
  "heading",
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
  // Stream authoring mode (composed work sessions)
  streamMode?: {
    anchorArtifactType: string;
    anchorArtifactId: string;
    onNewArtifact: (type: string, title?: string) => Promise<void>;
    onRenew: () => void;
    onMerge?: (attrs: SegmentBoundaryAttrs) => Promise<void>;
  };
  // Grist command mode — enables /split and future Copy Desk grist commands
  gristMode?: boolean;
  // Inline image upload — when provided, enables the Image extension, paste/drop
  // handling, and a toolbar button. Receives the dropped/picked File and returns
  // the URL to embed (a stable /api/files/<id>/serve URL).
  imageUpload?: (file: File) => Promise<string>;
}

type MentionState = {
  from: number;
  to: number;
  query: string;
  x: number;
  y: number;
};

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
  streamMode,
  gristMode,
  imageUpload,
}, ref) => {
  const latestContentRef = useRef<JSONContent | null>(null);
  const isUpdatingContentRef = useRef(false);
  const localRouteMapRef = useRef<Map<string, RouteMeta>>(new Map())

  // Keep latest imageUpload in a ref so paste/drop handlers (captured at editor
  // config time) always call the current uploader without recreating the editor.
  const imageUploadRef = useRef(imageUpload);
  useEffect(() => { imageUploadRef.current = imageUpload; }, [imageUpload]);

  // Editor ref for spell correction (populated after editor is created)
  const editorRef = useRef<Editor | null>(null);

  const bgColorEditor = useColorModeValue("#FBFBFA", "gray.800");
  const toolbarBorderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.900", "gray.50");
  const correctionFlashTint = useColorModeValue(CORRECTION_FLASH.lightTint, CORRECTION_FLASH.darkTint);

  // Writing preferences from localStorage
  const [autoCapitalizeEnabled, setAutoCapitalizeEnabled] = useState(true);
  const [spellCorrectionEnabled, setSpellCorrectionEnabled] = useState(true);
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const { users } = useUsers({ enabled: editable });

  // Stream authoring state
  const [compositionSegments, setCompositionSegments] = useState<CompositionSegment[]>([]);
  const [mergeDialogAttrs, setMergeDialogAttrs] = useState<SegmentBoundaryAttrs | null>(null);
  const mergeResolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  const handleBoundaryDelete = useCallback(async (attrs: SegmentBoundaryAttrs): Promise<boolean> => {
    return new Promise((resolve) => {
      mergeResolveRef.current = resolve;
      setMergeDialogAttrs(attrs);
    });
  }, []);

  const handleMergeConfirm = useCallback(() => {
    mergeResolveRef.current?.(true);
    mergeResolveRef.current = null;
    if (mergeDialogAttrs && streamMode?.onMerge) {
      streamMode.onMerge(mergeDialogAttrs);
    }
  }, [mergeDialogAttrs, streamMode]);

  const handleMergeCancel = useCallback(() => {
    mergeResolveRef.current?.(false);
    mergeResolveRef.current = null;
    setMergeDialogAttrs(null);
  }, []);

  const handleSegmentsChange = useCallback((segments: CompositionSegment[]) => {
    setCompositionSegments(segments);
  }, []);

  // Upload an image file and insert it into the editor. When `pos` is given
  // (drop), insert at that position; otherwise insert at the current selection.
  const uploadAndInsertImage = useCallback(async (file: File, pos?: number) => {
    const upload = imageUploadRef.current;
    const ed = editorRef.current;
    if (!upload || !ed) return;
    try {
      const url = await upload(file);
      if (pos != null) {
        ed.chain().focus().insertContentAt(pos, { type: "image", attrs: { src: url } }).run();
      } else {
        ed.chain().focus().setImage({ src: url }).run();
      }
    } catch (err) {
      console.error("[TipTapEditor] image upload failed", err);
    }
  }, []);

  // Load writing preferences from localStorage on mount
  useEffect(() => {
    const savedAutoCap = localStorage.getItem('mixtape-pref-auto-capitalize');
    const savedSpell = localStorage.getItem('mixtape-pref-spell-correction');
    if (savedAutoCap !== null) setAutoCapitalizeEnabled(savedAutoCap === 'true');
    if (savedSpell !== null) setSpellCorrectionEnabled(savedSpell === 'true');
  }, []);

  // Spell correction state and handlers (direct implementation for stable references)
  const [spellPopupState, setSpellPopupState] = useState<SpellCorrectionState | null>(null);
  const [spellScanOpen, setSpellScanOpen] = useState(false);
  const spellDictionary = useSpellDictionary();

  // Refs keep the latest dictionary functions without recreating the editor when
  // the dictionary loads (API corrections arrive async after editor init).
  const getCorrectionRef = useRef(spellDictionary.getCorrection);
  const recordUsageRef = useRef(spellDictionary.recordUsage);
  useEffect(() => { getCorrectionRef.current = spellDictionary.getCorrection; }, [spellDictionary.getCorrection]);
  useEffect(() => { recordUsageRef.current = spellDictionary.recordUsage; }, [spellDictionary.recordUsage]);

  // Stable wrappers — these never change reference, so the extension plugin
  // always reads the current dictionary without triggering editor recreation.
  const stableGetCorrection = useCallback((word: string) => getCorrectionRef.current(word), []);
  const stableRecordUsage = useCallback((word: string) => recordUsageRef.current(word), []);

  // Stable callback for opening spell popup (called by extension)
  const handleSpellOpen = useCallback((state: SpellCorrectionState) => {
    setSpellPopupState(state);
  }, []);

  // Stable callback for closing spell popup
  const handleSpellClose = useCallback(() => {
    setSpellPopupState(null);
    editorRef.current?.commands.focus();
  }, []);

  // Config never changes after mount — extension plugin always calls latest fns via refs.
  const spellCorrectionConfig = useMemo(() => ({
    onOpen: handleSpellOpen,
    onClose: handleSpellClose,
    modifierKey: 'meta' as const,
    getCorrection: stableGetCorrection,
    recordUsage: stableRecordUsage,
  }), [handleSpellOpen, handleSpellClose, stableGetCorrection, stableRecordUsage]);

  // Apply correction handler (needs editor, called by popup)
  const handleSpellApplyOnce = useCallback((originalWord: string, correction: string) => {
    const editor = editorRef.current;
    if (!editor || !spellPopupState) return;

    const { from, to } = spellPopupState;
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .insertContent(correction)
      .run();

    spellDictionary.recordUsage(originalWord);
    setSpellPopupState(null);
  }, [spellPopupState, spellDictionary]);

  const handleSpellAlwaysReplace = useCallback((originalWord: string, correction: string) => {
    const editor = editorRef.current;
    if (!editor || !spellPopupState) return;

    const { from, to } = spellPopupState;
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .insertContent(correction)
      .run();

    spellDictionary.addReplacement(originalWord, correction);
    setSpellPopupState(null);
  }, [spellPopupState, spellDictionary]);

  const handleSpellAddToDictionary = useCallback((word: string) => {
    spellDictionary.addIgnore(word);
    setSpellPopupState(null);
  }, [spellDictionary]);

  const mentionSuggestions = useMemo(() => {
    const query = mentionState?.query.trim().toLowerCase() || "";
    if (!query) return [];
    return users
      .filter((u) => u.username?.toLowerCase().includes(query))
      .slice(0, 6);
  }, [mentionState?.query, users]);

  const closeMention = useCallback(() => {
    setMentionState(null);
    setMentionIndex(0);
  }, []);

  const applyMention = useCallback((username: string) => {
    const editor = editorRef.current;
    const state = mentionState;
    if (!editor || !state) return;

    editor
      .chain()
      .focus()
      .setTextSelection({ from: state.from, to: state.to })
      .insertContent(`@${username} `)
      .run();

    closeMention();
  }, [closeMention, mentionState]);

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
    OutlineMarker,
    LbAnchor,
    BlockRouting.configure(routingOpts),
    // Inline images — only when an uploader is wired in
    ...(imageUpload ? [Image.configure({ inline: false, HTMLAttributes: { class: "editor-image" } })] : []),
    // PocketTools: Mini-tools for writers (conditionally enabled based on user preferences)
    ...(autoCapitalizeEnabled ? [AutoCapitalize.configure({ enabled: true })] : []),
    ...(spellCorrectionEnabled ? [SpellCorrection.configure(spellCorrectionConfig)] : []),
    SpellFindings,
    // Stream authoring extensions (only when streamMode is active)
    ...(streamMode ? [
      SegmentBoundary.configure({ onDelete: handleBoundaryDelete }),
      StreamCommands.configure({
        suggestion: { render: streamCommandsRender },
        onNewArtifact: streamMode.onNewArtifact,
        onRenew: streamMode.onRenew,
      }),
      CompositionBar.configure({
        anchorArtifactType: streamMode.anchorArtifactType,
        anchorArtifactId: streamMode.anchorArtifactId,
        onSegmentsChange: handleSegmentsChange,
      }),
    ] : []),
    // Grist command extensions (Copy Desk — /split and future commands)
    ...(gristMode ? [
      SplitMarker,
      GristCommands.configure({
        suggestion: { render: gristCommandsRender },
      }),
    ] : []),
  ], [routingOpts, spellCorrectionConfig, autoCapitalizeEnabled, spellCorrectionEnabled, streamMode, gristMode, imageUpload, handleBoundaryDelete, handleSegmentsChange]);

  // Add toolbar extensions to both modes - memoized to prevent editor recreation
  const toolbarExtensions = useMemo(() => [
    // Configure extensions manually with custom settings
    ...(toolbarOptions.includes("heading") ? [Heading.configure({ levels: [1, 2, 3, 4] })] : []),
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
        spellcheck: "true",
      },
      handlePaste: (_view, event) => {
        if (!imageUploadRef.current) return false;
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              void uploadAndInsertImage(file);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        if (!imageUploadRef.current) return false;
        const files = (event as DragEvent).dataTransfer?.files;
        if (!files || files.length === 0) return false;
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (imageFiles.length === 0) return false;
        event.preventDefault();
        const coords = view.posAtCoords({
          left: (event as DragEvent).clientX,
          top: (event as DragEvent).clientY,
        });
        const pos = coords?.pos;
        imageFiles.forEach((f) => void uploadAndInsertImage(f, pos));
        return true;
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
  const spellReplacements = useMemo(() => Object.fromEntries(
    spellDictionary.corrections.map(({ wrong, correct }) => [wrong.toLocaleLowerCase("en-US"), correct]),
  ), [spellDictionary.corrections]);
  const backgroundSpell = useBackgroundSpellCheck(editor, spellDictionary.dictionary.ignores, spellReplacements);

  // Expose editor instance via ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useImperativeHandle(ref, () => editor as any, [editor]);

  // Keep editorRef in sync for spell correction
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!editor || !editable) return;

    const updateMentionState = () => {
      const { state, view } = editor;
      const { selection } = state;
      if (!selection.empty) {
        closeMention();
        return;
      }

      const { $from } = selection;
      const parentTextBefore = $from.parent.textBetween(0, $from.parentOffset, "\n");
      const match = parentTextBefore.match(/(^|\s)@([a-zA-Z0-9._-]{1,30})$/);
      if (!match) {
        closeMention();
        return;
      }
      const matchIndex = match.index;
      if (typeof matchIndex !== "number") {
        closeMention();
        return;
      }

      const query = match[2] || "";
      if (!query) {
        closeMention();
        return;
      }

      const mentionStartInParent = matchIndex + match[1].length;
      const from = $from.start() + mentionStartInParent;
      const to = $from.pos;
      const coords = view.coordsAtPos(to);

      setMentionState({
        from,
        to,
        query,
        x: coords.left,
        y: coords.bottom + 6,
      });
      setMentionIndex(0);
    };

    editor.on("update", updateMentionState);
    editor.on("selectionUpdate", updateMentionState);
    updateMentionState();

    return () => {
      editor.off("update", updateMentionState);
      editor.off("selectionUpdate", updateMentionState);
    };
  }, [closeMention, editable, editor]);

  useEffect(() => {
    if (!mentionState || mentionSuggestions.length === 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMentionIndex((prev) => (prev + 1) % mentionSuggestions.length);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setMentionIndex((prev) => (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length);
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const selected = mentionSuggestions[mentionIndex];
        if (selected?.username) {
          applyMention(selected.username);
        }
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeMention();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [applyMention, closeMention, mentionIndex, mentionState, mentionSuggestions]);

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
          lineHeight: 1.7,
          "& .spell-finding": {
            textDecorationLine: "underline",
            textDecorationStyle: "wavy",
            textDecorationColor: "#c2410c",
            textUnderlineOffset: "3px",
          },
          "& .spell-correction-flash": {
            animation: `spellCorrectionFlash ${CORRECTION_FLASH.durationMs}ms ease-out both`,
            "@media (prefers-reduced-motion: reduce)": { animation: "none" },
          },
          "&.font-serif": {
            fontFamily: "ui-serif, Georgia, Cambria, \"Times New Roman\", Times, serif",
          },
          "&.font-sans": {
            fontFamily: "ui-sans-serif, system-ui, -apple-system, \"Segoe UI\", sans-serif",
          },
          "& strong, & b, & .bold-text": {
            fontWeight: 700,
          },
          "& em, & i, & .italic-text": {
            fontStyle: "italic !important",
          },
          "& .italic-text": {
            fontStyle: "italic",
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
          "& h4": {
            fontSize: "1.05rem",
            lineHeight: 1.4,
            fontWeight: 600,
            marginTop: "0.8em",
            marginBottom: "0.3em",
          },
          // Reduce margin on first and last children - using :first-of-type for SSR safety
          "& > *:first-of-type": {
            marginTop: "0.5em !important",
          },
          "& > *:last-of-type": {
            marginBottom: "0.5em !important",
          }
        },
        "@keyframes spellCorrectionFlash": {
          "0%": { backgroundColor: correctionFlashTint },
          "100%": { backgroundColor: "transparent" },
        },
      }}
    >
      <Box
        borderWidth="1px"
        borderColor={toolbarBorderColor}
        borderRadius="lg"
        overflow="hidden"
        pt={1}
        pl={1}
        position="relative"
      >
        <TipTapToolbar
          editor={editor}
          gristMode={!!gristMode}
          onImagePick={imageUpload ? (file) => void uploadAndInsertImage(file) : undefined}
          onSpellScan={() => setSpellScanOpen(true)}
        />
        <Prose className="editor-content-prose" bg={bgColorEditor} maxW="full"
          css={{ '& > *': { marginBlock: 0 } }}>
            <EditorContent editor={editor} />
        </Prose>
        {streamMode && compositionSegments.length > 0 && (
          <CompositionBarPanel segments={compositionSegments} editor={editor} />
        )}
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

      {/* Spell Correction Popup - PocketTools (Cmd+double-click) */}
      <SpellCorrectionPopup
        state={spellPopupState}
        onApplyOnce={handleSpellApplyOnce}
        onAlwaysReplace={handleSpellAlwaysReplace}
        onAddToDictionary={handleSpellAddToDictionary}
        onClose={handleSpellClose}
      />

      {/* Sequential spell-check scan dialog */}
      {spellScanOpen && editor && (
        <SpellScanDialog
          editor={editor}
          addReplacement={spellDictionary.addReplacement}
          addIgnore={spellDictionary.addIgnore}
          findings={backgroundSpell.findings}
          scanStatus={backgroundSpell.status}
          onRescan={backgroundSpell.scanNow}
          onClose={() => setSpellScanOpen(false)}
        />
      )}
      {mentionState && mentionSuggestions.length > 0 ? (
        <Box
          position="fixed"
          left={`${mentionState.x}px`}
          top={`${mentionState.y}px`}
          zIndex={9998}
          bg="bg.panel"
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
          boxShadow="lg"
          minW="220px"
          maxW="320px"
          p={1}
        >
          <VStack align="stretch" gap={1}>
            {mentionSuggestions.map((candidate, index) => (
              <Button
                key={candidate.id}
                variant={index === mentionIndex ? "subtle" : "ghost"}
                colorPalette={index === mentionIndex ? "blue" : undefined}
                justifyContent="flex-start"
                size="sm"
                onMouseDown={(event) => {
                  event.preventDefault();
                  applyMention(candidate.username);
                }}
              >
                <Text fontSize="sm">@{candidate.username}</Text>
              </Button>
            ))}
          </VStack>
        </Box>
      ) : null}

      {streamMode && (
        <MergeConfirmationDialog
          open={mergeDialogAttrs !== null}
          onClose={handleMergeCancel}
          onConfirm={handleMergeConfirm}
          boundaryAttrs={mergeDialogAttrs}
        />
      )}
    </Box>
  );
});

TipTapEditor.displayName = "TipTapEditor";

export default TipTapEditor;

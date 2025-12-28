// src/components/write/composer/MainEditor.tsx

import React, { forwardRef } from "react";
import { Box } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { Prose } from "@components/ui/prose";
import TipTapEditor from "@components/editor/TipTapEditor";
import TipTapCollabEditor from "@components/editor/TipTapCollabEditor";
import { useTextSelection, TextSelection } from "../hooks/useTextSelection";
import { useBackgroundSummary } from "@hooks/editor/useBackgroundSummary";

export interface MainEditorProps {
  // ✅ Solo-only
  docJSON?: any;
  onContentChange?: (json: any) => void;

  placeholder?: string;
  autoSave?: {
    triggerSave: () => void;
    status: "idle" | "saving" | "saved" | "error";
  };

  onSelectionChange?: (selection: TextSelection | null) => void;
  onBackgroundSummaryChange?: (data: {
    summary: string;
    isGenerating: boolean;
    isPending: boolean;
    error: any;
    wordCount: number;
    forceUpdate: () => void;
  }) => void;

  // ✅ Collab-only
  yjsProvider?: any;
  ydoc?: any;

  /**
   * Explicit mode control.
   * - "pending": render skeleton/placeholder only
   * - "solo": TipTapEditor (JSON-backed)
   * - "collab": TipTapCollabEditor (Yjs-backed)
   */
  editorMode: "pending" | "solo" | "collab";

  /** Only meaningful in collab mode */
  collabReady?: boolean;

  /** Optional: used only for dev overlay */
  debugId?: string;
}

export const MainEditor = forwardRef<any, MainEditorProps>(
  (
    {
      docJSON,
      onContentChange,
      placeholder = "Start writing your story...",
      autoSave,
      onSelectionChange,
      onBackgroundSummaryChange,
      yjsProvider,
      ydoc,
      editorMode,
      collabReady = false,
      debugId,
    },
    ref
  ) => {
    const bgColor = useColorModeValue("bg.surface", "bg.surface");
    const focusBorderColor = useColorModeValue("theme.accent", "theme.accent");
    const editorBorderColor = useColorModeValue("border.emphasis", "border.emphasis");

    const isPending = editorMode === "pending";
    const wantsCollab = editorMode === "collab";
    const wantsSolo = editorMode === "solo";

    const hasCollabDeps = !!ydoc && !!yjsProvider;
    const showCollabEditor = wantsCollab && hasCollabDeps;
    const collabEditable = wantsCollab ? !!collabReady : true;

    // Features should run only when:
    // - solo editor exists, or
    // - collab editor exists AND is ready
    const editorFeaturesEnabled = wantsCollab ? showCollabEditor && !!collabReady : true;

    // ---------- Debounced loading UI ----------
    const [showLoadingUI, setShowLoadingUI] = React.useState(false);

    React.useEffect(() => {
      const shouldShow =
        isPending ||
        (wantsCollab && hasCollabDeps && !collabReady);

      if (!shouldShow) {
        setShowLoadingUI(false);
        return;
      }

      const t = setTimeout(() => setShowLoadingUI(true), 150);
      return () => clearTimeout(t);
    }, [isPending, wantsCollab, hasCollabDeps, collabReady]);

    const devStatus =
      process.env.NODE_ENV === "development" ? (
        <Box fontSize="sm" opacity={0.7} mt={2}>
          {debugId ? <Box>id: {debugId}</Box> : null}
          deps: {String(hasCollabDeps)} / ready: {String(collabReady)}
        </Box>
      ) : null;

    // ---------- Imperative ref ----------
    const editorRef = React.useRef<any>(null);
    const [editorInstance, setEditorInstance] = React.useState<any>(null);

    const handleEditorRef = React.useCallback((instance: any) => {
      editorRef.current = instance ?? null;
      setEditorInstance((prev: any) => (prev === instance ? prev : instance));
    }, []);

    // Update parent ref whenever editor instance changes
    React.useImperativeHandle(ref, () => editorInstance, [editorInstance]);

    // ---------- Selection + summary ----------
    const { selection, hasSelection } = useTextSelection(editorRef, {
      debounceMs: 300,
      minSelectionLength: 1,
    });

    const backgroundSummaryData = useBackgroundSummary(editorInstance, {
      enabled: !!editorInstance && editorFeaturesEnabled,
      debounceMs: 9000,
      summaryWords: 40,
      minWordsToSummarize: 50,
    });

    const [currentWordCount, setCurrentWordCount] = React.useState(0);

    // Update word count when editor updates (TipTap instance will change on remount)
    React.useEffect(() => {
      if (!editorInstance) return;
      if (!editorFeaturesEnabled) return;

      const compute = () => {
        try {
          const text = editorInstance?.getText ? editorInstance.getText() : "";
          const wc = text.trim()
            ? text.trim().split(/\s+/).filter((w: string) => w.length > 0).length
            : 0;
          setCurrentWordCount(wc);
        } catch {
          // ignore
        }
      };

      compute();

      // If your TipTap instance exposes on('update'), you could subscribe here.
      // For now, keep it cheap: rely on selection/summary hooks + content changes.

    }, [editorInstance, editorFeaturesEnabled]);

    React.useEffect(() => {
      if (!onSelectionChange) return;
      if (!editorInstance) return;
      if (!editorFeaturesEnabled) return;
      onSelectionChange(selection);
    }, [onSelectionChange, editorInstance, editorFeaturesEnabled, selection]);

    React.useEffect(() => {
      if (!onBackgroundSummaryChange) return;
      if (!editorInstance) return;
      if (!editorFeaturesEnabled) return;

      onBackgroundSummaryChange({
        summary: backgroundSummaryData.summary,
        isGenerating: backgroundSummaryData.isGenerating,
        isPending: backgroundSummaryData.isPending,
        error: backgroundSummaryData.error,
        wordCount: currentWordCount,
        forceUpdate: backgroundSummaryData.forceUpdate,
      });
    }, [
      onBackgroundSummaryChange,
      editorInstance,
      editorFeaturesEnabled,
      backgroundSummaryData.summary,
      backgroundSummaryData.isGenerating,
      backgroundSummaryData.isPending,
      backgroundSummaryData.error,
      backgroundSummaryData.forceUpdate,
      currentWordCount,
    ]);

    // ---------- Render ----------
    return (
      <Prose className="main-editor-prose" maxW={"none"}>
        <Box
          className="reggie"
          borderWidth="1px"
          borderColor={editorBorderColor}
          borderRadius="lg"
          bg={bgColor}
          overflow="hidden"
          transition="all 0.2s"
          height="70vh"
          position="relative"
          _focusWithin={{ borderColor: focusBorderColor }}
          css={{
            "& .ProseMirror": {
              height: "calc(65vh - 4px)",
              padding: "24px",
              outline: "none",
              fontSize: "16px",
              lineHeight: "1.6",
              overflowY: "auto",
              "&:focus": { outline: "none" },
            },
            "& .prose": { maxWidth: "none" },
          }}
        >
          {isPending ? (
            showLoadingUI ? (
              <Box p="24px" opacity={0.8}>
                Preparing editor…
              </Box>
            ) : (
              <Box p="24px" opacity={0.6} />
            )
          ) : wantsCollab ? (
            showCollabEditor ? (
              <Box position="relative">
                <TipTapCollabEditor
                  // ✅ force remount if ydoc changes identity
                  key={`${ydoc ? (ydoc as any).guid ?? "ydoc" : "no-ydoc"}:${String(collabReady)}`} // ✅ force remount when ready flips
                  ref={handleEditorRef}
                  // DO NOT pass initialContent - causes duplication on remount
                  // Y.Doc seeding happens in useYjsSocketProvider from backend yjs_state
                  initialContent={undefined}
                  ydoc={ydoc}
                  yjsProvider={yjsProvider}
                  placeholder={placeholder}
                  className="borderless-editor"
                  editable={collabReady}
                />

                {/* {showLoadingUI && !collabReady && (
                  <Box
                    position="absolute"
                    inset={0}
                    zIndex={5}
                    pointerEvents="none"
                    display="flex"
                    alignItems="flex-start"
                    justifyContent="flex-start"
                    p="24px"
                  >
                    <Box display={'none'} opacity={0.85}>
                      Loading collaborative document…
                      {devStatus}
                    </Box>
                  </Box>
                )} */}

              </Box>
            ) : showLoadingUI ? (
              <Box p="24px" opacity={0.8}>
                Preparing collaboration…
                {devStatus}
              </Box>
            ) : (
              <Box p="24px" opacity={0.6} />
            )
          ) : (
            <TipTapEditor
              ref={handleEditorRef}
              initialContent={docJSON}
              onContentChange={(json) => onContentChange?.(json)}
              autoSave={autoSave}
              placeholder={placeholder}
              className="borderless-editor"
            />
          )}

          {process.env.NODE_ENV === "development" &&
            !!editorInstance &&
            editorFeaturesEnabled &&
            hasSelection && (
              <Box
                position="absolute"
                top="8px"
                right="8px"
                bg="blue.500"
                color="white"
                px={2}
                py={1}
                borderRadius="sm"
                fontSize="xs"
                zIndex={10}
                opacity={0.8}
              >
                Selected: "{selection?.text.substring(0, 20)}..."
                {selection?.isSingleWord ? " (word)" : ` (${selection?.wordCount} words)`}
              </Box>
            )}
        </Box>
      </Prose>
    );
  }
);

MainEditor.displayName = "MainEditor";

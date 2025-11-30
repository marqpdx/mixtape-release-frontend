// src/components/write/composer/MainEditor.tsx

import React, { forwardRef } from 'react';
import { Box } from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { Prose } from '@components/ui/prose';
import TipTapEditor from '@components/editor/TipTapEditor';
import { useTextSelection, TextSelection } from '../hooks/useTextSelection';
import { useBackgroundSummary } from '@hooks/editor/useBackgroundSummary';

export interface MainEditorProps {
  docJSON: any;
  onContentChange: (json: any) => void;
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
}

export const MainEditor = forwardRef<any, MainEditorProps>(({
  docJSON,
  onContentChange,
  placeholder = "Start writing your story...",
  autoSave,
  onSelectionChange,
  onBackgroundSummaryChange
}, ref) => {
  // Color mode values
  const bgColor = useColorModeValue("bg.surface", "bg.surface");
  const focusBorderColor = useColorModeValue("theme.accent", "theme.accent");
  const editorBorderColor = useColorModeValue("border.emphasis", "border.emphasis");

  // Text selection detection
  const editorRef = React.useRef<any>(null);

  // Debug effect to check when editor instance is available
  React.useEffect(() => {
    console.log("🔍 MainEditor mounted, editorRef.current:", editorRef.current);
    console.log("🔍 MainEditor docJSON:", !!docJSON);
    console.log("🔍 MainEditor forceNew/draftId context:", { docJSON: !!docJSON });
  }, []);

  React.useEffect(() => {
    console.log("🔍 MainEditor editorRef changed:", !!editorRef.current);
    console.log("🔍 Editor type:", typeof editorRef.current);
    if (editorRef.current) {
      console.log("🔍 Editor methods:", Object.keys(editorRef.current));
      console.log("🔍 Editor has 'on' method:", typeof editorRef.current.on === 'function');
      console.log("🔍 Editor has 'getText' method:", typeof editorRef.current.getText === 'function');
    }
  }, [editorRef.current]);

  // Check when docJSON changes (should happen when typing)
  React.useEffect(() => {
    console.log("🔍 MainEditor docJSON changed, editorRef.current:", !!editorRef.current);
    console.log("🔍 DocJSON has content:", docJSON?.content?.length > 0);
  }, [docJSON]);

  // Use imperative handle to expose editor ref to parent
  React.useImperativeHandle(ref, () => editorRef.current, []);

  const { selection, hasSelection, isSelecting } = useTextSelection(
    editorRef,
    {
      debounceMs: 300,
      minSelectionLength: 1
    }
  );

  // Debug the useTextSelection hook behavior
  React.useEffect(() => {
    console.log("🔍 MainEditor useTextSelection result:", { selection, hasSelection, isSelecting });
  }, [selection, hasSelection, isSelecting]);

  // Background summary hook - now has direct access to editor
  const backgroundSummaryData = useBackgroundSummary(editorRef.current, {
    enabled: true,
    debounceMs: 9000,
    summaryWords: 40,
    minWordsToSummarize: 50,
  });

  // Separate word count calculation that updates immediately
  const [currentWordCount, setCurrentWordCount] = React.useState(0);

  // Update word count whenever content changes
  React.useEffect(() => {
    if (editorRef.current && docJSON) {
      try {
        // Get text content from editor
        const text = editorRef.current.getText ? editorRef.current.getText() : '';
        const wordCount = text.trim() ? text.trim().split(/\s+/).filter((w: string) => w.length > 0).length : 0;
        console.log("🔍 Word count calculated:", wordCount, "from text length:", text.length);
        setCurrentWordCount(wordCount);
      } catch (error) {
        console.log("🔍 Word count calculation failed:", error);
      }
    } else {
      console.log("🔍 Word count skipped - editorRef:", !!editorRef.current, "docJSON:", !!docJSON);
    }
  }, [docJSON]); // Update on every content change

  // Force selection listener setup when editor becomes available
  React.useEffect(() => {
    if (editorRef.current) {
      // Small delay to ensure editor is fully ready
      const timer = setTimeout(() => {
        console.log("🔍 MainEditor triggering selection setup after editor ready");
        // This will trigger the useTextSelection effect to re-run
        const event = new Event('editorReady');
        window.dispatchEvent(event);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [editorRef.current]);

  // Notify parent of selection changes
  React.useEffect(() => {
    console.log("🔍 MainEditor selection effect - selection:", selection);
    if (onSelectionChange) {
      console.log("🔍 MainEditor calling onSelectionChange with:", selection);
      onSelectionChange(selection);
    }
  }, [selection, onSelectionChange]);

  // Notify parent of background summary changes
  React.useEffect(() => {
    if (onBackgroundSummaryChange) {
      onBackgroundSummaryChange({
        summary: backgroundSummaryData.summary,
        isGenerating: backgroundSummaryData.isGenerating,
        isPending: backgroundSummaryData.isPending,
        error: backgroundSummaryData.error,
        wordCount: currentWordCount, // Use our immediate word count
        forceUpdate: backgroundSummaryData.forceUpdate
      });
    }
  }, [
    backgroundSummaryData.summary,
    backgroundSummaryData.isGenerating,
    backgroundSummaryData.isPending,
    backgroundSummaryData.error,
    currentWordCount, // Watch our immediate word count
    backgroundSummaryData.forceUpdate,
    onBackgroundSummaryChange
  ]);

  return (
    <Prose className="main-editor-prose" maxW={'none'}>
      <Box
        borderWidth="1px"
        borderColor={editorBorderColor}
        borderRadius="lg"
        bg={bgColor}
        overflow="hidden"
        transition="all 0.2s"
        minH="400px"
        position="relative"
        _focusWithin={{
          borderColor: focusBorderColor
        }}
        css={{
          "& .ProseMirror": {
            minHeight: "360px",
            padding: "24px",
            outline: "none",
            fontSize: "16px",
            lineHeight: "1.6",
            "&:focus": {
              outline: "none"
            }
          },
          "& .prose": {
            maxWidth: "none"
          }
        }}
      >
        <TipTapEditor
          ref={editorRef}
          initialContent={docJSON}
          onContentChange={(json) => {
            console.log("🔍 TipTap onContentChange called, editorRef.current:", !!editorRef.current);
            onContentChange(json);
          }}
          autoSave={autoSave}
          placeholder={placeholder}
          toolbarOptions={["bold", "italic", "heading", "underline", "bulletList", "link"]}
          className="borderless-editor"
        />

        {/* Selection Debug Indicator (remove in production) */}
        {process.env.NODE_ENV === 'development' && hasSelection && (
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
            {selection?.isSingleWord ? ' (word)' : ` (${selection?.wordCount} words)`}
          </Box>
        )}
      </Box>
    </Prose>
  );
});

MainEditor.displayName = 'MainEditor';
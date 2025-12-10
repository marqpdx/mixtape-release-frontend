// src/components/write/WriteComposer.tsx

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import { axiosInstance } from '@providers/auth-provider/axiosInstance';
import { useQueryClient } from '@tanstack/react-query';

// Import unified components
import { MainEditor } from '@components/writing/composer/MainEditor';
import { TitleInput } from '@components/writing/composer/TitleInput';
import { SummarySection } from '@components/writing/composer/SummarySection';
import { StatusBar } from '@components/writing/composer/StatusBar';
import { CopyDesk } from '@components/writing/copydesk/CopyDesk';
import { TagInput, Tag } from '@components/writing/composer/TagInput';

// Import new split components
import { QuickPublishBar } from '@components/writing/composer/QuickPublishBar';
import { PublishingControls } from '@components/writing/composer/PublishingControls';
import { WorkspaceToggle } from '@components/writing/composer/WorkspaceToggle';
import { ScrollToTopButton } from '@components/writing/composer/ScrollToTopButton';

// Hooks
import { useWorkingCopyAutosave } from '@lib/writing/useWorkingCopyAutosave';
import { useEmptyFlagDetection } from '@components/writing/hooks/useEmptyFlagDetection';
import { TextSelection } from '@components/writing/hooks/useTextSelection';
import { useColorModeValue } from '@components/ui/color-mode';
import { WordCountDisplay } from './composer/WordCountDisplay';
import { StatusMessage } from './composer/StatusMessage';
import { WritingKind } from '@/types/writingTypes';
import { CollaborationDialog } from './composer/CollaborationDialog';
import { useCollaboration } from '@hooks/useCollaboration';
// import { WritingKind } from '../groups/writing/interfaces';
// import { WritingKind } from '@content/writingTypes';

interface SponsorConfig {
  type: 'group' | 'member';
  id: string;
  slug?: string;
  name?: string;
  displayName?: string;
}

interface WriteComposerProps {
  pieceId: string;
  initialPiece: any;
  sponsor: SponsorConfig;
  writingKind?: WritingKind;
  defaultWorkspaceOpen?: boolean;
  autosaveDebounceMs?: number;
  autoFocus?: boolean;
  showPublishingControls?: boolean;
  onPublished?: (piece: any) => void;
  onSaved?: (piece: any) => void;
}

export default function WriteComposer({
  pieceId,
  initialPiece,
  sponsor,
  writingKind = 'post',
  defaultWorkspaceOpen = true,
  autosaveDebounceMs = 2500,
  autoFocus = true,
  showPublishingControls = true,
  onPublished,
  onSaved,
}: WriteComposerProps) {
  const editorRef = useRef<any>(null);

  // Local state for editing
  const [title, setTitle] = useState<string>(initialPiece?.title || '');
  const [docJSON, setDocJSON] = useState<any>(initialPiece?.body_json || { type: 'doc', content: [] });
  const [excerpt, setExcerpt] = useState<string>(initialPiece?.excerpt || '');
  const [tags, setTags] = useState<Tag[]>([]);

  // Track last saved state for unsaved changes detection
  const [lastSavedState, setLastSavedState] = useState({
    title: initialPiece?.title || '',
    docJSON: initialPiece?.body_json || { type: 'doc', content: [] },
    excerpt: initialPiece?.excerpt || ''
  });

  // UI state
  const [workspaceOpen, setWorkspaceOpen] = useState(defaultWorkspaceOpen);
  const [workspaceWidth] = useState("360px");

  // Collaboration state
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const {
    isCollaborative,
    dispatchContent,
    loading: collaborationLoading,
    eligibleCollaborators,
    enableCollaboration,
    rescindCollaboration,
    addCollaborators,
    removeCollaborators,
    canBeRescinded,
  } = useCollaboration({
    pieceId: pieceId,
    autoFetch: true,
  });

  // Text selection and AI summary state
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [backgroundSummary, setBackgroundSummary] = useState("");
  const [summaryIsGenerating, setSummaryIsGenerating] = useState(false);
  const [summaryIsPending, setSummaryIsPending] = useState(false);
  const [summaryError, setSummaryError] = useState<any>(null);
  const [summaryWordCount, setSummaryWordCount] = useState(0);
  const [summaryForceUpdate, setSummaryForceUpdate] = useState<(() => void) | null>(null);

  // Create refs to hold current values for stable autosave
  const titleRef = useRef(title);
  const docJSONRef = useRef(docJSON);
  const excerptRef = useRef(excerpt);

  // Update refs when state changes
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { docJSONRef.current = docJSON; }, [docJSON]);
  useEffect(() => { excerptRef.current = excerpt; }, [excerpt]);

  // Load tags when piece loads
  useEffect(() => {
    async function fetchTags() {
      if (!pieceId) return;

      try {
        const response = await axiosInstance.get(`/api/writing/pieces/${pieceId}/tags`);
        setTags(response.data || []);
      } catch (err) {
        console.error('Failed to fetch tags:', err);
      }
    }
    fetchTags();
  }, [pieceId]);

  // Check if there are unsaved changes (compare against last saved state, not initial piece)
  const hasUnsavedChanges = useMemo(() => {
    return title !== lastSavedState.title ||
           JSON.stringify(docJSON) !== JSON.stringify(lastSavedState.docJSON) ||
           excerpt !== lastSavedState.excerpt;
  }, [title, docJSON, excerpt, lastSavedState]);

  // Autosave hook
  const { schedule, saveNow, saveStatus } = useWorkingCopyAutosave(pieceId, autosaveDebounceMs);

  // Query client for invalidating drafts list
  const queryClient = useQueryClient();

  // Empty flag detection hook
  const { onTitleChange, onDocChange, onExcerptChange } = useEmptyFlagDetection({
    pieceId,
    initialPiece,
    setTitle,
    setDocJSON,
    setExcerpt,
    titleRef,
    docJSONRef,
    excerptRef,
    schedule,
    onEmptyFlagCleared: () => {
      // Invalidate drafts query to remove this draft from the list
      if (sponsor.slug) {
        queryClient.invalidateQueries({
          queryKey: ['writing', 'drafts', sponsor.type, sponsor.slug]
        });
      }
    }
  });

  // Calculate responsive width
  const contentWidth = workspaceOpen ? `calc(100% - ${workspaceWidth} - 1rem)` : "100%";

  // Handler for receiving selection data from MainEditor
  const handleSelectionChange = useCallback((newSelection: TextSelection | null) => {
    setSelection(newSelection);
    setHasSelection(!!newSelection && !newSelection.isEmpty);
  }, []);

  // Handler for receiving background summary data from MainEditor
  const handleBackgroundSummaryChange = useCallback((data: {
    summary: string;
    isGenerating: boolean;
    isPending: boolean;
    error: any;
    wordCount: number;
    forceUpdate: () => void;
  }) => {
    setBackgroundSummary(data.summary);
    setSummaryIsGenerating(data.isGenerating);
    setSummaryIsPending(data.isPending);
    setSummaryError(data.error);
    setSummaryWordCount(data.wordCount);
    setSummaryForceUpdate(() => data.forceUpdate);
  }, []);

  const handleGenerateNewSummary = useCallback(() => {
    if (summaryForceUpdate) {
      summaryForceUpdate();
    }
  }, [summaryForceUpdate]);

  // Handler for tag changes
  const handleTagsChange = useCallback(async (newTags: Tag[]) => {
    setTags(newTags);

    if (!pieceId) return;

    try {
      await axiosInstance.put(`/api/writing/pieces/${pieceId}/tags`, {
        tag_ids: newTags.map(t => t.id)
      });
    } catch (err) {
      console.error('Failed to save tags:', err);
    }
  }, [pieceId]);

  // Update last saved state when autosave completes
  useEffect(() => {
    if (saveStatus === 'saved') {
      setLastSavedState({
        title: titleRef.current,
        docJSON: docJSONRef.current,
        excerpt: excerptRef.current
      });
    }
  }, [saveStatus]);

  // Calculate initial word count from existing content
  useEffect(() => {
    if (initialPiece?.body_json && summaryWordCount === 0) {
      const calculateWordCount = (bodyJson: any): number => {
        if (!bodyJson?.content) return 0;

        const extractText = (node: any): string => {
          if (node.type === "text") {
            return node.text || "";
          }
          if (node.content && Array.isArray(node.content)) {
            return node.content.map(extractText).join(" ");
          }
          return "";
        };

        const fullText = bodyJson.content.map(extractText).join(" ").trim();
        return fullText.split(/\s+/).filter((word: string) => word.length > 0).length;
      };

      const initialWordCount = calculateWordCount(initialPiece.body_json);
      setSummaryWordCount(initialWordCount);
    }
  }, [initialPiece?.body_json, summaryWordCount]);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const sidebarBg = useColorModeValue("gray.50", "gray.900");

  return (
    <Box className="main-writer-composer" position="relative" w="100%" h="100vh" overflow="hidden">
      <HStack gap={0} h="100%" align="stretch">

        {/* Main Content Area */}
        <Box
          className="main-content-area"
          flex="1"
          w={contentWidth}
          transition="width 0.3s ease"
          pl={0}
          pr={{ base: 4, md: 8, lg: 12 }}
          pt={0}
          maxH="100vh"
          overflowY="auto"
          css={{
            "&::-webkit-scrollbar": { width: "6px" },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.2)", borderRadius: "3px" },
            "&::-webkit-scrollbar-thumb:hover": { background: "rgba(0,0,0,0.3)" },
          }}
        >
          <VStack gap={4} align="stretch" maxW="none" pl={{ base: 1, md: 2, lg: 3 }} minH="80vh">

            {/* Context Header */}
            <Box mb={2}>
              <Flex justify={'space-between'}>
                <Box fontSize="sm" color="gray.600">
                  Writing for {sponsor.displayName || sponsor.name || `${sponsor.type} ${sponsor.id}`}
                </Box>
                <Box>
                  {/* Collaboration Button & Dialog */}
                  <HStack gap={2}>
                    <Button
                      size="xs"
                      variant={isCollaborative ? "solid" : "outline"}
                      colorScheme={isCollaborative ? "blue" : "gray"}
                      onClick={() => setCollaborationDialogOpen(true)}
                    >
                      {isCollaborative ? '👥 Collaborative' : '+ Add Collaborators'}
                    </Button>
                    {isCollaborative && dispatchContent && (
                      <HStack gap={1} fontSize="xs" color="gray.600">
                        <Text>{dispatchContent.editor_count} editors</Text>
                        <Text>•</Text>
                        <Text>{dispatchContent.commenter_count} reviewers</Text>
                      </HStack>
                    )}
                  </HStack>

                  <CollaborationDialog
                    open={collaborationDialogOpen}
                    onOpenChange={setCollaborationDialogOpen}
                    isCollaborative={isCollaborative}
                    dispatchContent={dispatchContent}
                    eligibleCollaborators={eligibleCollaborators}
                    onEnableCollaboration={enableCollaboration}
                    onRescindCollaboration={rescindCollaboration}
                    onAddCollaborators={addCollaborators}
                    onRemoveCollaborators={removeCollaborators}
                    loading={collaborationLoading}
                    canBeRescinded={canBeRescinded}
                  />
                </Box>
              </Flex>
            </Box>

            {/* Title Input */}
            <TitleInput
              title={title}
              setTitle={onTitleChange}
              placeholder="Enter your title..."
            />

            {/* Main Editor with Enhanced Status Display */}
            <Box
              position="relative"
              w="100%"
            >
              <MainEditor
                ref={editorRef}
                docJSON={docJSON}
                onContentChange={onDocChange}
                placeholder="Start writing your story..."
                autoSave={{ triggerSave: () => {}, status: saveStatus }}
                onSelectionChange={handleSelectionChange}
                onBackgroundSummaryChange={handleBackgroundSummaryChange}
              />

              {/* Word Count and Save Status - positioned at bottom right */}
              <Box
                position="absolute"
                bottom="20px"
                right="10px"
                pointerEvents="none"
              >
                <WordCountDisplay
                  wordCount={summaryWordCount}
                  saveStatus={saveStatus}
                  hasUnsavedChanges={hasUnsavedChanges}
                />
              </Box>
            </Box>

            {/* Status Message - fixed height to prevent layout shift */}
            <Box className='status-message-container' mt={'-24px'} minH="20px" display="flex" alignItems="center" justifyContent={"end"}>
              <StatusMessage status={saveStatus} />
            </Box>

            {/* Summary and Publishing Actions Row */}
            <HStack
              align="stretch"
              gap={6}
              direction={{ base: "column", lg: "row" }}
              w="100%"
            >
              {/* Summary Section - 70% width on desktop */}
              <Box
                flex={{ base: "1", lg: "0 0 70%" }}
                w={{ base: "100%", lg: "70%" }}
              >
                <SummarySection
                  summary={excerpt}
                  setSummary={onExcerptChange}
                  previousSummary=""
                  onUndoSummary={() => {}}
                  summaryIsPending={summaryIsPending}
                  summaryIsGenerating={summaryIsGenerating}
                  backgroundSummary={backgroundSummary}
                />
              </Box>

              {/* Publishing Controls Sidebar - 30% width on desktop */}
              <Box
                flex={{ base: "1", lg: "0 0 30%" }}
                w={{ base: "100%", lg: "30%" }}
                bg={sidebarBg}
                border={`1px solid ${borderColor}`}
                borderRadius="lg"
                p={4}
                position="sticky"
                top={4}
                alignSelf="flex-start"
                maxH="calc(100vh - 2rem)"
                overflowY="auto"
                css={{
                  "&::-webkit-scrollbar": { width: "4px" },
                  "&::-webkit-scrollbar-track": { background: "transparent" },
                  "&::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.2)", borderRadius: "2px" },
                }}
              >
                <VStack gap={4} align="stretch">
                  {/* Publishing Controls */}
                  {showPublishingControls && (
                    <PublishingControls
                      pieceId={pieceId}
                      sponsor={sponsor}
                      piece={{ id: pieceId, title }}
                      hasUnsavedChanges={hasUnsavedChanges}
                      saveNow={saveNow}
                      titleRef={titleRef}
                      docJSONRef={docJSONRef}
                      excerptRef={excerptRef}
                      onPublished={onPublished}
                      onSaved={onSaved}
                    />
                  )}

                  {/* Tags Section */}
                  <Box
                    p={4}
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                  >
                    <TagInput
                      selectedTags={tags}
                      onTagsChange={handleTagsChange}
                      maxTags={10}
                    />
                  </Box>

                  {/* Status Bar */}
                  <StatusBar
                    status={saveStatus}
                    draftId={pieceId}
                    onForceSave={() => saveNow({
                      title: titleRef.current,
                      body_json: docJSONRef.current,
                      excerpt: excerptRef.current
                    })}
                    onClearDraft={() => {
                      setTitle('');
                      setDocJSON({ type: 'doc', content: [] });
                      setExcerpt('');
                    }}
                  />
                </VStack>
              </Box>
            </HStack>

            {/* Add some bottom padding for mobile scroll */}
            <Box h={8} />

          </VStack>
        </Box>

        {/* Scroll to Top Button */}
        <ScrollToTopButton
          workspaceOpen={workspaceOpen}
          workspaceWidth={workspaceWidth}
        />

        {/* Workspace Toggle (when collapsed) */}
        <WorkspaceToggle
          workspaceOpen={workspaceOpen}
          onToggle={() => setWorkspaceOpen(true)}
        />

        {/* Copy Desk with AI Tools */}
        <CopyDesk
          isOpen={workspaceOpen}
          onToggle={() => setWorkspaceOpen(!workspaceOpen)}
          width={workspaceWidth}
          draftId={pieceId}
          selection={selection}
          hasSelection={hasSelection}
          backgroundSummary={backgroundSummary}
          summaryIsGenerating={summaryIsGenerating}
          summaryIsPending={summaryIsPending}
          summaryError={summaryError}
          onGenerateNewSummary={handleGenerateNewSummary}
          summary={excerpt}
          setSummary={onExcerptChange}
          titleWordCount={title.length}
          documentWordCount={summaryWordCount}
          summaryWordCount={excerpt.length}
        />

      </HStack>
    </Box>
  );
}
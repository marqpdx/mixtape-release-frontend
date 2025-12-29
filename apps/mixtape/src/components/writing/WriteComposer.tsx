// src/components/write/WriteComposer.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useQueryClient } from "@tanstack/react-query";

import { MainEditor } from "@components/writing/composer/MainEditor";
import { TitleInput } from "@components/writing/composer/TitleInput";
import { SummarySection } from "@components/writing/composer/SummarySection";
import { StatusBar } from "@components/writing/composer/StatusBar";
import { CopyDesk } from "@components/writing/copydesk/CopyDesk";
import { TagInput, Tag } from "@components/writing/composer/TagInput";

import { PublishingControls } from "@components/writing/composer/PublishingControls";
import { WorkspaceToggle } from "@components/writing/composer/WorkspaceToggle";
import { ScrollToTopButton } from "@components/writing/composer/ScrollToTopButton";

import { useWorkingCopyAutosave } from "@/lib/writing/useWorkingCopyAutosave";
import { useEmptyFlagDetection } from "@components/writing/hooks/useEmptyFlagDetection";
import { TextSelection } from "@components/writing/hooks/useTextSelection";
import { useColorModeValue } from "@components/ui/color-mode";
import { WordCountDisplay } from "./composer/WordCountDisplay";
import { StatusMessage } from "./composer/StatusMessage";
import { WritingKind } from "@mixtape/core/types/writingTypes";
import { CollaborationDialog } from "./composer/CollaborationDialog";
import { useCollaboration } from "@hooks/useCollaboration";
import { useYjsSocketProvider } from "@/lib/dispatch/yjs/useYjsSocketProvider";
import { useCollabAutosave } from "@hooks/dispatch/useCollabAutosave";

interface SponsorConfig {
  type: "group" | "member";
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

const EMPTY_DOC = { type: "doc", content: [] };

export default function WriteComposer({
  pieceId,
  initialPiece,
  sponsor,
  writingKind = "post",
  defaultWorkspaceOpen = true,
  autosaveDebounceMs = 2500,
  autoFocus = true,
  showPublishingControls = true,
  onPublished,
  onSaved,
}: WriteComposerProps) {
  const editorRef = useRef<any>(null);

  // Local state for editing
  const [title, setTitle] = useState<string>(initialPiece?.title || "");
  const [docJSON, setDocJSON] = useState<any>(initialPiece?.body_json || EMPTY_DOC);
  const [excerpt, setExcerpt] = useState<string>(initialPiece?.excerpt || "");
  const [tags, setTags] = useState<Tag[]>([]);

  const [lastSavedState, setLastSavedState] = useState({
    title: initialPiece?.title || "",
    docJSON: initialPiece?.body_json || EMPTY_DOC,
    excerpt: initialPiece?.excerpt || "",
  });

  // Reset when switching pieces
  useEffect(() => {
    setTitle(initialPiece?.title || "");
    setDocJSON(initialPiece?.body_json || EMPTY_DOC);
    setExcerpt(initialPiece?.excerpt || "");
    setLastSavedState({
      title: initialPiece?.title || "",
      docJSON: initialPiece?.body_json || EMPTY_DOC,
      excerpt: initialPiece?.excerpt || "",
    });
  }, [pieceId, initialPiece?.id]);

  // UI state
  const [workspaceOpen, setWorkspaceOpen] = useState(defaultWorkspaceOpen);
  const [workspaceWidth] = useState("360px");

  // Collaboration dialog state
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);

  const {
    isCollaborative,
    dispatchContent,
    loading: collaborationLoading,
    statusReady: collabStatusReady,
    eligibleCollaborators,
    enableCollaboration,
    rescindCollaboration,
    addCollaborators,
    removeCollaborators,
    canBeRescinded,
  } = useCollaboration({ pieceId, autoFetch: true });

  const editorMode: "pending" | "solo" | "collab" =
    !collabStatusReady ? "pending" : isCollaborative ? "collab" : "solo";

  const wantsCollab = editorMode === "collab";

  // Awareness user info (stable)
  const userInfo = useMemo(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("user_identity");
        if (raw) {
          const user = JSON.parse(raw);
          return {
            name: user.username || user.email || "Anonymous",
            color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
          };
        }
      }
    } catch (error) {
      console.error("Error getting user info:", error);
    }
    return {
      name: "Anonymous",
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    };
  }, []);

  // Only enable Yjs when truly collab and dispatchContent is valid
  const yjsEnabled =
    wantsCollab && !!dispatchContent?.id && !!dispatchContent?.yjs_document_id;

  const { provider: yjsProvider, ydoc, isReady: yjsReady } = useYjsSocketProvider(
    dispatchContent,
    {
      user: userInfo,
      enabled: yjsEnabled,
    }
  );

  const collabReady = wantsCollab && yjsEnabled ? yjsReady : false;

  // Solo autosave (when not in collab mode)
  const { schedule, saveNow, saveStatus: soloSaveStatus } = useWorkingCopyAutosave(
    pieceId,
    autosaveDebounceMs
  );

  // Track editor instance for collab autosave
  const [collabEditor, setCollabEditor] = useState<any>(null);

  // Update collab editor when ref changes
  // Check on every render since refs don't trigger re-renders
  useEffect(() => {
    if (wantsCollab && editorRef.current && editorRef.current !== collabEditor) {
      console.log('📝 [WriteComposer] Setting collab editor from ref');
      setCollabEditor(editorRef.current);
    } else if (!wantsCollab && collabEditor) {
      setCollabEditor(null);
    }
  });

  // Collaborative autosave (when in collab mode)
  const collabAutosaveEnabled = collabReady && wantsCollab && !!collabEditor;

  const {
    status: collabSaveStatus,
    lastSaved: collabLastSaved,
    triggerSave: collabTriggerSave
  } = useCollabAutosave({
    documentSlug: dispatchContent?.id || '',
    ydoc,
    editor: collabEditor,
    enabled: collabAutosaveEnabled,
  });

  // Debug: Log autosave status
  useEffect(() => {
    console.log('🔍 [WriteComposer] Collab autosave status:', {
      collabReady,
      wantsCollab,
      hasCollabEditor: !!collabEditor,
      hasYdoc: !!ydoc,
      enabled: collabAutosaveEnabled,
      editorInstance: collabEditor,
      dispatchContentId: dispatchContent?.id,
    });
  }, [collabReady, wantsCollab, collabEditor, ydoc, collabAutosaveEnabled, dispatchContent?.id]);

  // Unified save status - use collab status when in collab mode, solo otherwise
  const saveStatus = wantsCollab ? collabSaveStatus : soloSaveStatus;

  // Selection + AI summary state
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [backgroundSummary, setBackgroundSummary] = useState("");
  const [summaryIsGenerating, setSummaryIsGenerating] = useState(false);
  const [summaryIsPending, setSummaryIsPending] = useState(false);
  const [summaryError, setSummaryError] = useState<any>(null);
  const [summaryWordCount, setSummaryWordCount] = useState(0);
  const [summaryForceUpdate, setSummaryForceUpdate] = useState<(() => void) | null>(
    null
  );

  // Refs for stable autosave/publish payloads
  const titleRef = useRef(title);
  const docJSONRef = useRef(docJSON);
  const excerptRef = useRef(excerpt);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);
  useEffect(() => {
    docJSONRef.current = docJSON;
  }, [docJSON]);
  useEffect(() => {
    excerptRef.current = excerpt;
  }, [excerpt]);

  // Load tags
  useEffect(() => {
    async function fetchTags() {
      if (!pieceId) return;
      try {
        const response = await axiosInstance.get(`/api/writing/pieces/${pieceId}/tags`);
        setTags(response.data || []);
      } catch (err) {
        console.error("Failed to fetch tags:", err);
      }
    }
    fetchTags();
  }, [pieceId]);

  const queryClient = useQueryClient();

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
      if (sponsor.slug) {
        queryClient.invalidateQueries({
          queryKey: ["writing", "drafts", sponsor.type, sponsor.slug],
        });
      }
    },
  });

  // ✅ Unsaved changes:
  // - solo: title/doc/excerpt
  // - collab: title/excerpt only (doc is Yjs-owned)
  const hasUnsavedChanges = useMemo(() => {
    if (wantsCollab) {
      return title !== lastSavedState.title || excerpt !== lastSavedState.excerpt;
    }
    return (
      title !== lastSavedState.title ||
      JSON.stringify(docJSON) !== JSON.stringify(lastSavedState.docJSON) ||
      excerpt !== lastSavedState.excerpt
    );
  }, [wantsCollab, title, docJSON, excerpt, lastSavedState]);

  // Mark lastSavedState on successful autosave (solo path)
  useEffect(() => {
    if (saveStatus === "saved") {
      setLastSavedState({
        title: titleRef.current,
        docJSON: docJSONRef.current,
        excerpt: excerptRef.current,
      });
    }
  }, [saveStatus]);

  // Word count init from initial JSON (best-effort; collab will be updated by MainEditor callbacks)
  useEffect(() => {
    if (initialPiece?.body_json && summaryWordCount === 0) {
      const extractText = (node: any): string => {
        if (node?.type === "text") return node.text || "";
        if (Array.isArray(node?.content)) return node.content.map(extractText).join(" ");
        return "";
      };
      const fullText = (initialPiece.body_json.content || []).map(extractText).join(" ").trim();
      const wc = fullText ? fullText.split(/\s+/).filter((w: string) => w.length > 0).length : 0;
      setSummaryWordCount(wc);
    }
  }, [initialPiece?.body_json, summaryWordCount]);

  const handleSelectionChange = useCallback((newSelection: TextSelection | null) => {
    setSelection(newSelection);
    setHasSelection(!!newSelection && !newSelection.isEmpty);
  }, []);

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
    summaryForceUpdate?.();
  }, [summaryForceUpdate]);

  const handleTagsChange = useCallback(
    async (newTags: Tag[]) => {
      setTags(newTags);
      if (!pieceId) return;
      try {
        await axiosInstance.put(`/api/writing/pieces/${pieceId}/tags`, {
          tag_ids: newTags.map((t) => t.id),
        });
      } catch (err) {
        console.error("Failed to save tags:", err);
      }
    },
    [pieceId]
  );

  const contentWidth = workspaceOpen ? `calc(100% - ${workspaceWidth} - 1rem)` : "100%";
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const sidebarBg = useColorModeValue("gray.50", "gray.900");

  // ✅ Hard remount key prevents cached editor instances from persisting across open/close
  const collabKey = `${pieceId}:${editorMode}:${dispatchContent?.yjs_document_id ?? "no-yjs"}`;

  // ✅ Always pass docJSON (for seeding Y.Doc when first enabling collab)
  // But only pass onChange handler in solo mode
  const soloOnChange = wantsCollab ? undefined : onDocChange;

  return (
    <Box className="main-writer-composer" position="relative" w="100%" h="100vh" overflow="hidden">
      <HStack gap={0} h="100%" align="stretch">
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
            <Box mb={2}>
              <Flex justify={"space-between"}>
                <Box fontSize="sm" color="gray.600">
                  Writing for {sponsor.displayName || sponsor.name || `${sponsor.type} ${sponsor.id}`}
                </Box>

                <Box>
                  <HStack gap={2}>
                    <Button
                      size="xs"
                      variant={isCollaborative ? "solid" : "outline"}
                      colorScheme={isCollaborative ? "blue" : "gray"}
                      onClick={() => setCollaborationDialogOpen(true)}
                    >
                      {isCollaborative ? "👥 Collaborative" : "+ Add Collaborators"}
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

            <TitleInput title={title} setTitle={onTitleChange} placeholder="Enter your title..." />

            <Box position="relative" w="100%">
              <MainEditor
                key={collabKey}
                ref={editorRef}
                editorMode={editorMode}
                docJSON={docJSON}
                onContentChange={soloOnChange}
                placeholder="Start writing your story..."
                autoSave={{
                  triggerSave: wantsCollab ? collabTriggerSave : () => {},
                  status: saveStatus
                }}
                onSelectionChange={handleSelectionChange}
                onBackgroundSummaryChange={handleBackgroundSummaryChange}
                yjsProvider={yjsProvider}
                ydoc={ydoc}
                collabReady={collabReady}
                debugId={collabKey}
              />

              <Box position="absolute" bottom="20px" right="10px" pointerEvents="none">
                <WordCountDisplay
                  wordCount={summaryWordCount}
                  saveStatus={saveStatus}
                  hasUnsavedChanges={hasUnsavedChanges}
                />
              </Box>
            </Box>

            <Box
              className="status-message-container"
              mt={"-24px"}
              minH="20px"
              display="flex"
              alignItems="center"
              justifyContent={"end"}
            >
              <StatusMessage status={saveStatus} mode={wantsCollab ? 'collab' : 'solo'} />
            </Box>

            <HStack align="stretch" gap={6} direction={{ base: "column", lg: "row" }} w="100%">
              <Box flex={{ base: "1", lg: "0 0 70%" }} w={{ base: "100%", lg: "70%" }}>
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

                  <Box p={4} bg="white" border="1px solid" borderColor="gray.200" borderRadius="md">
                    <TagInput selectedTags={tags} onTagsChange={handleTagsChange} maxTags={10} />
                  </Box>

                  <StatusBar
                    status={saveStatus}
                    draftId={pieceId}
                    onForceSave={() => {
                      if (wantsCollab) {
                        collabTriggerSave();
                      } else {
                        saveNow({
                          title: titleRef.current,
                          body_json: docJSONRef.current,
                          excerpt: excerptRef.current,
                        });
                      }
                    }}
                    onClearDraft={() => {
                      setTitle("");
                      setDocJSON(EMPTY_DOC);
                      setExcerpt("");
                    }}
                  />
                </VStack>
              </Box>
            </HStack>

            <Box h={8} />
          </VStack>
        </Box>

        <ScrollToTopButton workspaceOpen={workspaceOpen} workspaceWidth={workspaceWidth} />

        <WorkspaceToggle workspaceOpen={workspaceOpen} onToggle={() => setWorkspaceOpen(true)} />

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

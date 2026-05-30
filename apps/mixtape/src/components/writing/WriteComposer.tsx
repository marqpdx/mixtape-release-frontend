// apps/mixtape/src/components/write/WriteComposer.tsx

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";
import { useQueryClient } from "@tanstack/react-query";
import { Editor } from "@tiptap/react";
import { exportPiecePdf } from "@mixtape/api/clients/writing/writingApi";

import { MainEditor } from "@components/writing/composer/MainEditor";
import { TitleInput } from "@components/writing/composer/TitleInput";
import { SummarySection } from "@components/writing/composer/SummarySection";
import { StatusBar } from "@components/writing/composer/StatusBar";
import { CopyDesk } from "@components/writing/copydesk/CopyDesk";
import { SplitSuggestionCallout } from "@components/writing/copydesk/SplitSuggestionCallout";
import { ExecuteSplitBanner } from "@components/writing/copydesk/ExecuteSplitBanner";
import { TagInput, Tag } from "@components/writing/composer/TagInput";

import { PublishingControls } from "@components/writing/composer/PublishingControls";
import { WorkspaceToggle } from "@components/writing/composer/WorkspaceToggle";
import { ScrollToTopButton } from "@components/writing/composer/ScrollToTopButton";

import { useWorkingCopyAutosave } from "@/lib/writing/useWorkingCopyAutosave";
import { useStreamAuthoring } from "@/hooks/useStreamAuthoring";
import { useEmptyFlagDetection } from "@components/writing/hooks/useEmptyFlagDetection";
import { TextSelection } from "@components/writing/hooks/useTextSelection";
import { useColorModeValue } from "@components/ui/color-mode";
import { WordCountDisplay } from "./composer/WordCountDisplay";
import { StatusMessage } from "./composer/StatusMessage";
import { CollaborationDialog } from "./composer/CollaborationDialog";
import { PromotionDialog } from "@components/living-book/PromotionDialog";
import { LbDesk } from "@components/living-book/LbDesk";
import { FloatingBranchButton } from "@components/living-book/FloatingBranchButton";
import { CreateBranchDialog } from "@components/living-book/CreateBranchDialog";
import { BranchPanel } from "@components/living-book/BranchPanel";
import { BranchReconciliationPanel } from "@components/living-book/BranchReconciliationPanel";
import { useCollaboration } from "@hooks/useCollaboration";
import { useLivingBookForPiece } from "@mixtape/api/hooks/useLivingBook";
import { useBranches, useCreateBranch } from "@mixtape/api/hooks/useBranches";
import type { Branch } from "@mixtape/api/clients/livingBook/branchApi";
import { useYjsSocketProvider } from "@/lib/dispatch/yjs/useYjsSocketProvider";
import { useCollabAutosave } from "@hooks/dispatch/useCollabAutosave";
import { Divider } from "../common/Divider";
import { OutlineDrawer } from "./outline/OutlineDrawer";

interface SponsorConfig {
  type: "group" | "member";
  id: string;
  slug?: string;
  name?: string;
  displayName?: string;
}

// TipTap document JSON structure - matches DocumentJSON from useEmptyFlagDetection
interface DocumentJSON {
  type?: string;
  content?: {
    type?: string;
    text?: string;
    content?: { type?: string; text?: string }[];
  }[];
}

// Writing piece type (minimal shape based on usage)
interface WritingPiece {
  id: string;
  slug?: string;
  title?: string;
  body_json?: DocumentJSON;
  excerpt?: string;
  is_empty?: boolean;
  status?: string;
  target_wordcount?: number | null;
  suggest_splits?: boolean;
  enable_outline?: boolean;
  [key: string]: unknown;
}

interface WriteComposerProps {
  pieceId: string;
  initialPiece: WritingPiece;
  sponsor: SponsorConfig;
  defaultWorkspaceOpen?: boolean;
  autosaveDebounceMs?: number;
  showPublishingControls?: boolean;
  onPublished?: (piece: Record<string, unknown>) => void;
  onSaved?: (piece: Record<string, unknown>) => void;
  onUnpublished?: (piece: Record<string, unknown>) => void;
  onBack?: () => void;
}

const EMPTY_DOC: DocumentJSON = { type: "doc", content: [] };

export default function WriteComposer({
  pieceId,
  initialPiece,
  sponsor,
  defaultWorkspaceOpen = false,
  autosaveDebounceMs = 2500,
  showPublishingControls = true,
  onPublished,
  onSaved,
  onUnpublished,
  onBack,
}: WriteComposerProps) {
  const editorRef = useRef<Editor | null>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  // Local state for editing
  const [title, setTitle] = useState<string>(initialPiece?.title || "");
  const [docJSON, setDocJSON] = useState<DocumentJSON | null>(initialPiece?.body_json || EMPTY_DOC);
  const [excerpt, setExcerpt] = useState<string>(initialPiece?.excerpt || "");
  const [tags, setTags] = useState<Tag[]>([]);
  const [targetWordCount, setTargetWordCount] = useState<number | null>(
    initialPiece?.target_wordcount ?? null
  );
  const [suggestSplits, setSuggestSplits] = useState<boolean>(
    initialPiece?.suggest_splits ?? false
  );

  const [lastSavedState, setLastSavedState] = useState({
    title: initialPiece?.title || "",
    docJSON: initialPiece?.body_json || EMPTY_DOC,
    excerpt: initialPiece?.excerpt || "",
  });

  const isPublished = initialPiece?.status === "published";

  // Reset when switching pieces
  useEffect(() => {
    const newTitle = initialPiece?.title || "";
    const newDocJSON = initialPiece?.body_json || EMPTY_DOC;
    const newExcerpt = initialPiece?.excerpt || "";

    setTitle(newTitle);
    setDocJSON(newDocJSON);
    setExcerpt(newExcerpt);
    setLastSavedState({
      title: newTitle,
      docJSON: newDocJSON,
      excerpt: newExcerpt,
    });
  }, [pieceId, initialPiece?.id, initialPiece?.title, initialPiece?.body_json, initialPiece?.excerpt]);

  // Focus the editor on load so typing can begin immediately
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        editorRef.current?.commands?.focus?.("end");
      } catch {
        // ignore
      }
    }, 0);
    return () => clearTimeout(t);
  }, [pieceId]);

  // UI state
  const [workspaceOpen, setWorkspaceOpen] = useState(defaultWorkspaceOpen);
  const [lbDeskOpen, setLbDeskOpen] = useState(false);
  const [workspaceWidth] = useState("360px");
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfExportError, setPdfExportError] = useState<string | null>(null);

  // Dispatch custom events when outline opens/closes so DashboardLayout can react
  const setOutlineOpenWithEvent = useCallback((open: boolean) => {
    setOutlineOpen(open);
    window.dispatchEvent(new CustomEvent(open ? 'outline-panel-opened' : 'outline-panel-closed'));
  }, []);
  const publishedBannerBg = useColorModeValue("orange.50", "orange.900");
  const publishedBannerBorder = useColorModeValue("orange.200", "orange.700");
  const publishedBannerText = useColorModeValue("orange.800", "orange.100");
  const inputBg = useColorModeValue("gray.50", "gray.900");
  const inputBorderColor = useColorModeValue("gray.200", "gray.700");
  const inputFocusBorderColor = useColorModeValue("theme.accent", "theme.accent");
  const allowCollab = sponsor.type === "group";

  // Collaboration dialog state
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [lbDialogOpen, setLbDialogOpen] = useState(false);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);

  // Branch state
  const [activeBranch, setActiveBranch] = useState<Branch | null>(null);
  const [showReconciliation, setShowReconciliation] = useState(false);
  const initialPieceSlug = typeof initialPiece.slug === "string" ? initialPiece.slug : undefined;

  // Living Book + branch data (only relevant when piece is an LB trunk)
  const { data: livingBook } = useLivingBookForPiece(initialPieceSlug);
  const lbId = livingBook?.id ?? null;
  const { data: branches = [] } = useBranches(lbId ?? '');
  const createBranch = useCreateBranch(lbId ?? '');
  const hasDetachedBranches = branches.some((b: Branch) => b.is_detached);

  const handleAddBranch = useCallback(() => {
    if (!lbId || !editorRef.current) return;
    const anchorId = crypto.randomUUID();
    editorRef.current.commands.insertLbAnchor(anchorId);
    createBranch.mutate(
      { anchor_node_id: anchorId },
      {
        onSuccess: (branch: Branch) => setActiveBranch(branch),
      }
    );
  }, [lbId, createBranch]);

  // Click delegation — open BranchPanel when an lb-anchor glyph is clicked
  const handleEditorAreaClick = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('[data-lb-anchor]') as HTMLElement | null;
    if (!target || !lbId) return;
    const anchorId = target.getAttribute('data-lb-anchor');
    if (!anchorId) return;
    const branch = branches.find((b: Branch) => b.anchor_node_id === anchorId) ?? null;
    setActiveBranch(branch);
  }, [branches, lbId]);

  // LinkedIn copy state (Copy Desk agent)
  const [linkedinCopy, setLinkedinCopy] = useState('');
  const [linkedinCopyExtended, setLinkedinCopyExtended] = useState<import('@mixtape/api/clients/writing/writingApi').LinkedInCopyExtended | null>(null);

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

  const editorMode: "pending" | "solo" | "collab" = allowCollab
    ? !collabStatusReady
      ? "pending"
      : isCollaborative
        ? "collab"
        : "solo"
    : "solo";

  const wantsCollab = editorMode === "collab";

  // Awareness user info (stable)
  const userInfo = useMemo(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("user_identity");
        if (raw) {
          const user = JSON.parse(raw) as { username?: string; email?: string };
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
  const {
    schedule,
    saveNow,
    saveStatus: soloSaveStatus,
    splitSuggestionStatus,
    setSplitSuggestionStatus,
  } = useWorkingCopyAutosave(pieceId, autosaveDebounceMs);

  // Stream authoring — activates lazily on first /new command
  const createArtifactForStream = useCallback(
    async (type: string, title?: string) => {
      const placeholderTitle = title || "Untitled";

      switch (type) {
        case "writingpiece": {
          const res = await axiosInstance.post("/api/workbench/drafts/", {
            sponsor_type: sponsor.type === "group" ? "group" : "user",
            sponsor_id: sponsor.id,
            content_profile: "default",
            title: placeholderTitle,
          });
          return { id: res.data.id, contentTypeModel: "writingpiece" };
        }
        case "seed": {
          const res = await axiosInstance.post("/api/writing/seeds", {
            body_text: placeholderTitle,
          });
          return { id: res.data.id, contentTypeModel: "seed" };
        }
        case "event": {
          const url = sponsor.slug
            ? `/api/groups/${sponsor.slug}/almanac/`
            : "/api/almanac/events/";
          const res = await axiosInstance.post(url, {
            event_type: "single",
            title: placeholderTitle,
            description: "",
            event_format: "in_person",
          });
          return { id: res.data.id, contentTypeModel: "event" };
        }
        case "course": {
          if (!sponsor.slug) throw new Error("Course requires a group context");
          const res = await axiosInstance.post(
            `/api/earthlab/${sponsor.slug}/courses`,
            { title: placeholderTitle }
          );
          return { id: res.data.id, contentTypeModel: "course" };
        }
        default:
          throw new Error(`Unsupported artifact type: ${type}`);
      }
    },
    [sponsor]
  );

  const {
    streamMode,
    isActive: streamIsActive,
    deactivateStream,
    resumeSession,
  } = useStreamAuthoring({
    anchor: {
      contentTypeModel: "writingpiece",
      objectId: pieceId,
    },
    createArtifact: createArtifactForStream,
    editorRef,
  });

  // Track editor instance for collab autosave — set via onCollabEditorReady callback from MainEditor
  const [collabEditor, setCollabEditor] = useState<Editor | null>(null);

  const handleCollabEditorReady = useCallback((editor: Editor | null) => {
    setCollabEditor(editor);
  }, []);

  // Collaborative autosave (when in collab mode)
  const collabAutosaveEnabled = collabReady && wantsCollab && !!collabEditor;

  const {
    status: collabSaveStatus,
    triggerSave: collabTriggerSave
  } = useCollabAutosave({
    documentSlug: dispatchContent?.id || '',
    ydoc,
    editor: collabEditor,
    enabled: collabAutosaveEnabled,
  });

  // Unified save status - use collab status when in collab mode, solo otherwise
  const saveStatus = wantsCollab ? collabSaveStatus : soloSaveStatus;

  // Selection + AI summary state
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [hasSelection, setHasSelection] = useState(false);
  const [backgroundSummary, setBackgroundSummary] = useState("");
  const [summaryIsGenerating, setSummaryIsGenerating] = useState(false);
  const [summaryIsPending, setSummaryIsPending] = useState(false);
  const [summaryError, setSummaryError] = useState<Error | null>(null);
  const [summaryWordCount, setSummaryWordCount] = useState(0);
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const [summaryForceUpdate, setSummaryForceUpdate] = useState<(() => void) | null>(
    null
  );

  // Refs for stable autosave/publish payloads
  const titleRef = useRef(title);
  const docJSONRef = useRef<DocumentJSON | null>(docJSON);
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

  // Count splitMarker nodes in the current document (for ExecuteSplitBanner)
  const splitMarkerCount = useMemo(() => {
    const content = (docJSON as { content?: Array<{ type: string }> })?.content ?? [];
    return content.filter((n) => n.type === 'splitMarker').length;
  }, [docJSON]);

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
        docJSON: docJSONRef.current ?? {},
        excerpt: excerptRef.current,
      });
    }
  }, [saveStatus]);

  // Ensure we persist changes if user navigates away before autosave fires
  useEffect(() => {
    return () => {
      if (wantsCollab || !hasUnsavedChanges) return;
      void saveNow({
        title: titleRef.current,
        body_json: docJSONRef.current ?? EMPTY_DOC,
        excerpt: excerptRef.current,
      });
      // End stream authoring session on navigate away
      void deactivateStream();
    };
  }, [wantsCollab, hasUnsavedChanges, saveNow, deactivateStream]);

  const computeWordCountFromDoc = useCallback((doc: DocumentJSON | null | undefined) => {
    if (!doc) return 0;
    const extractText = (
      node: DocumentJSON | { type?: string; text?: string; content?: unknown[] }
    ): string => {
      if (node?.type === "text" && "text" in node) return (node.text as string) || "";
      if ("content" in node && Array.isArray(node.content)) {
        return node.content.map((child) => extractText(child as DocumentJSON)).join(" ");
      }
      return "";
    };
    const content = (doc as { content?: unknown[] }).content || [];
    const fullText = content.map((node) => extractText(node as DocumentJSON)).join(" ").trim();
    return fullText
      ? fullText.split(/\s+/).filter((w: string) => w.length > 0).length
      : 0;
  }, []);

  // Word count init from initial JSON (best-effort; collab will be updated by MainEditor callbacks)
  useEffect(() => {
    if (initialPiece?.body_json && summaryWordCount === 0) {
      setSummaryWordCount(computeWordCountFromDoc(initialPiece.body_json));
    }
  }, [initialPiece?.body_json, summaryWordCount, computeWordCountFromDoc]);

  useEffect(() => {
    if (saveStatus !== "saved") return;
    if (wantsCollab && collabEditor) {
      setSummaryWordCount(computeWordCountFromDoc(collabEditor.getJSON() as DocumentJSON));
    } else {
      setSummaryWordCount(computeWordCountFromDoc(docJSONRef.current ?? docJSON));
    }
  }, [saveStatus, wantsCollab, collabEditor, computeWordCountFromDoc, docJSON]);

  const handleSelectionChange = useCallback((newSelection: TextSelection | null) => {
    setSelection(newSelection);
    setHasSelection(!!newSelection && !newSelection.isEmpty);
  }, []);

  const handleBackgroundSummaryChange = useCallback((data: {
    summary: string;
    isGenerating: boolean;
    isPending: boolean;
    error: unknown;
    wordCount: number;
    forceUpdate: () => void;
  }) => {
    setBackgroundSummary(data.summary);
    setSummaryIsGenerating(data.isGenerating);
    setSummaryIsPending(data.isPending);
    setSummaryError(data.error as Error | null);
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

  const overTarget = targetWordCount != null && summaryWordCount > targetWordCount;

  const handleExportPdf = useCallback(async () => {
    setPdfExporting(true);
    setPdfExportError(null);

    try {
      const { blob, filename } = await exportPiecePdf(pieceId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || `${(title || initialPiece?.title || "untitled").trim() || "untitled"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export PDF:", error);
      setPdfExportError("PDF export failed. Please try again.");
    } finally {
      setPdfExporting(false);
    }
  }, [initialPiece?.title, pieceId, title]);

  const handleTargetWordCountChange = useCallback(async (value: number | null) => {
    setTargetWordCount(value);
    try {
      await axiosInstance.patch(`/api/writing/pieces/${pieceId}`, { target_wordcount: value });
    } catch (err) {
      console.error("Failed to save target_wordcount:", err);
    }
  }, [pieceId]);

  const handleSuggestSplitsChange = useCallback(async (value: boolean) => {
    setSuggestSplits(value);
    try {
      await axiosInstance.patch(`/api/writing/pieces/${pieceId}`, { suggest_splits: value });
    } catch (err) {
      console.error("Failed to save suggest_splits:", err);
    }
  }, [pieceId]);

  const contentWidth = (workspaceOpen || lbDeskOpen) ? `calc(100% - ${workspaceWidth} - 1rem)` : "100%";

  // ✅ Hard remount key prevents cached editor instances from persisting across open/close
  const collabKey = `${pieceId}:${editorMode}:${dispatchContent?.yjs_document_id ?? "no-yjs"}`;

  // ✅ Always pass docJSON (for seeding Y.Doc when first enabling collab)
  // But only pass onChange handler in solo mode
  const soloOnChange = wantsCollab ? undefined : onDocChange;

  return (
    <Box className="main-writer-composer" position="relative" w="100%" h="100vh" overflow="hidden">
      <HStack gap={0} h="100%" align="stretch">
        <OutlineDrawer
          isOpen={outlineOpen}
          onClose={() => setOutlineOpenWithEvent(false)}
          editor={editorRef.current}
          pieceId={pieceId}
          enableOutline={!!(initialPiece?.enable_outline)}
          sponsor={{ type: sponsor.type, slug: sponsor.slug }}
        />

        <Box
          className="main-content-area"
          flex="1"
          w={contentWidth}
          transition="width 0.3s ease"
          pr={{ base: 8, md: 12, lg: 20 }}
          pl={{ base: 8, md: 12, lg: 20 }}
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
          <VStack gap={4} align="stretch" maxW="none" minH="80vh">
            <Box mb={2}>
              <Flex justify={"space-between"}>
                <HStack gap={3} align="center">
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setOutlineOpenWithEvent(!outlineOpen)}
                    title={outlineOpen ? "Close outline" : "Open outline"}
                  >
                    Outline
                  </Button>
                  <Box fontSize="sm" color="gray.600">
                    Writing for {sponsor.displayName || sponsor.name || `${sponsor.type} ${sponsor.id}`}
                  </Box>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="gray"
                    onClick={() => {
                      if (onBack) {
                        onBack();
                        return;
                      }
                      if (sponsor.type === "group" && sponsor.slug) {
                        window.location.href = `/app/writing?group=${sponsor.slug}`;
                        return;
                      }
                      if (typeof window !== "undefined") {
                        try {
                          window.localStorage.setItem("writing_active_tab", "drafts");
                          window.localStorage.setItem("memberDashboard", "writing");
                        } catch (error) {
                          console.warn("Failed to set writing tab:", error);
                        }
                      }
                      window.location.href = "/app/dashboard";
                    }}
                  >
                    ← Back to drafts
                  </Button>
                </HStack>

                {allowCollab && (
                  <Box>
                    <HStack gap={2}>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="gray"
                        onClick={handleExportPdf}
                        loading={pdfExporting}
                      >
                        Export PDF
                      </Button>
                      <Button
                        size="xs"
                        variant={isCollaborative ? "solid" : "outline"}
                        colorScheme={isCollaborative ? "blue" : "gray"}
                        onClick={() => setCollaborationDialogOpen(true)}
                      >
                        {isCollaborative
                          ? `Collab (${dispatchContent?.editor_count ?? 0}|${dispatchContent?.commenter_count ?? 0})`
                          : "+ Add Collaborators"}
                      </Button>

                      <Button
                        size="xs"
                        variant={lbId ? "solid" : "outline"}
                        colorPalette={lbId ? "teal" : undefined}
                        colorScheme={lbId ? undefined : "teal"}
                        disabled={!lbId && !isCollaborative}
                        onClick={() => {
                          if (lbId) { setLbDeskOpen(true); setWorkspaceOpen(false); }
                          else if (isCollaborative) setLbDialogOpen(true);
                        }}
                      >
                        📖 Living Book
                      </Button>

                      {lbId && isCollaborative && (
                        <>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="teal"
                            onClick={() => setBranchDialogOpen(true)}
                          >
                            🌿 Add Branch
                          </Button>
                          {hasDetachedBranches && (
                            <Button
                              size="xs"
                              variant="solid"
                              colorScheme="orange"
                              onClick={() => setShowReconciliation(true)}
                            >
                              ⚠ Detached
                            </Button>
                          )}
                        </>
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

                    {sponsor.slug && initialPieceSlug && (
                      <PromotionDialog
                        pieceSlug={initialPieceSlug}
                        pieceTitle={initialPiece.title || title}
                        open={lbDialogOpen}
                        onClose={() => setLbDialogOpen(false)}
                        groupSlug={sponsor.slug}
                        onSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ["living-book-for-piece", initialPieceSlug] });
                        }}
                      />
                    )}

                    {activeBranch && lbId && (
                      <Box position="fixed" right="24px" top="80px" zIndex={1000}>
                        <BranchPanel
                          branch={activeBranch}
                          lbId={lbId}
                          collaboratorCount={
                            (dispatchContent?.editor_count ?? 0) +
                            (dispatchContent?.commenter_count ?? 0)
                          }
                          currentUserId={
                            (() => {
                              try { return JSON.parse(localStorage.getItem('user_identity') ?? '{}').id ?? '' } catch { return '' }
                            })()
                          }
                          sponsor={{ type: sponsor.type as 'group' | 'member', slug: sponsor.slug ?? '' }}
                          onClose={() => setActiveBranch(null)}
                        />
                      </Box>
                    )}

                    {showReconciliation && lbId && (
                      <Box position="fixed" right="24px" top="80px" zIndex={1000}>
                        <BranchReconciliationPanel
                          lbId={lbId}
                          onReattach={(anchorId) => {
                            editorRef.current?.commands.insertLbAnchor(anchorId);
                            setShowReconciliation(false);
                          }}
                          onClose={() => setShowReconciliation(false)}
                        />
                      </Box>
                    )}
                  </Box>
                )}

                {!allowCollab && (
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="gray"
                    onClick={handleExportPdf}
                    loading={pdfExporting}
                  >
                    Export PDF
                  </Button>
                )}
              </Flex>
            </Box>

            {pdfExportError && (
              <Text fontSize="xs" color="red.500" mt={-2}>
                {pdfExportError}
              </Text>
            )}

            <TitleInput title={title} setTitle={onTitleChange} placeholder="Enter your title..." />

            {isPublished && (
              <Box
                bg={publishedBannerBg}
                border="1px solid"
                borderColor={publishedBannerBorder}
                borderRadius="md"
                px={4}
                py={2}
              >
                <Text fontSize="sm" color={publishedBannerText}>
                  Editing published version. Publish updates to replace the live post, or return it to draft.
                </Text>
              </Box>
            )}

            <Box ref={editorWrapperRef} position="relative" w="100%" onClick={handleEditorAreaClick}>
              <MainEditor
                key={collabKey}
                ref={editorRef as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                editorMode={editorMode}
                docJSON={docJSON as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                onContentChange={soloOnChange}
                placeholder="Start writing your story..."
                autoSave={{
                  triggerSave: wantsCollab ? collabTriggerSave : () => {},
                  status: saveStatus
                }}
                onSelectionChange={handleSelectionChange}
                onBackgroundSummaryChange={handleBackgroundSummaryChange}
                yjsProvider={(yjsProvider ?? undefined) as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                ydoc={(ydoc ?? undefined) as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                collabReady={collabReady}
                debugId={collabKey}
                streamMode={wantsCollab ? undefined : streamMode}
                gristMode={wantsCollab ? undefined : true}
                onCollabEditorReady={wantsCollab ? handleCollabEditorReady : undefined}
              />
              {lbId && collabEditor && (
                <FloatingBranchButton
                  editor={collabEditor}
                  containerRef={editorWrapperRef}
                  onAddBranch={() => setBranchDialogOpen(true)}
                  isPending={false}
                />
              )}
            </Box>

            <HStack align="flex-start" gap={3} w="100%" mt={-8}>
              <Flex alignItems="flex-start" gap={3} flex="1" mt={2} pl={2} borderLeft={'1px solid lightgray'}>
                <Box pt={"5px"}>
                  <Text fontSize="sm" fontWeight="medium" minW="4em">
                    Tags:
                  </Text>
                </Box>
                <Box flex="1">
                  <TagInput
                    selectedTags={tags}
                    onTagsChange={handleTagsChange}
                    maxTags={10}
                    inputSize="sm"
                    inputFontSize="sm"
                    inputBg={inputBg}
                    inputBorderColor={inputBorderColor}
                    inputFocusBorderColor={inputFocusBorderColor}
                  />
                </Box>
              </Flex>

              <Box
                className="status-message-container"
                minH="20px"
                display="flex"
                alignItems="center"
                justifyContent="flex-end"
                minW="17em"
                maxW="17em"
                pr={.5}
              >
                <Box position="relative" w="100%" display="flex" justifyContent="flex-end" pt={1}>
                  <Box position="absolute" right={0}>
                    <StatusMessage
                      status={saveStatus}
                      mode={wantsCollab ? "collab" : "solo"}
                      onShowSavedChange={setShowSavedMessage}
                    />
                  </Box>
                  <Box
                    opacity={saveStatus === "idle" && !showSavedMessage ? 1 : 0}
                    transition="opacity 0.4s ease"
                  >
                    <WordCountDisplay
                      wordCount={summaryWordCount}
                      saveStatus="idle"
                      hasUnsavedChanges={false}
                      overTarget={overTarget}
                    />
                  </Box>
                </Box>
              </Box>
            </HStack>

            <Divider />

            <HStack align="stretch" gap={6} direction={{ base: "column", lg: "row" }} w="100%">
              <Box flex={{ base: "1", lg: "0 0 60%" }} w={{ base: "100%", lg: "60%" }}>
                <SummarySection
                  summary={excerpt}
                  setSummary={onExcerptChange}
                  previousSummary=""
                  onUndoSummary={() => {}}
                  summaryIsPending={summaryIsPending}
                  summaryIsGenerating={summaryIsGenerating}
                  backgroundSummary={backgroundSummary}
                  textareaBg={inputBg}
                  textareaBorderColor={inputBorderColor}
                  textareaFocusBorderColor={inputFocusBorderColor}
                />
              </Box>

              <Box flex={{ base: "1", lg: "0 0 40%" }} w={{ base: "100%", lg: "40%" }}>
                <VStack gap={4} align="stretch">
                  <Text fontSize="sm" fontWeight="medium" color="text.primary">
                    Publishing
                  </Text>
                  {showPublishingControls && (
                    <PublishingControls
                      pieceId={pieceId}
                      sponsor={sponsor}
                      piece={{ id: pieceId, title }}
                      pieceStatus={initialPiece?.status as string | undefined}
                      hasUnsavedChanges={hasUnsavedChanges}
                      saveNow={saveNow}
                      titleRef={titleRef}
                      docJSONRef={docJSONRef as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                      excerptRef={excerptRef}
                      onPublished={onPublished}
                      onUnpublished={onUnpublished}
                      publishLabel={isPublished ? "Publish updates" : "Publish"}
                      onSaved={onSaved}
                    />
                  )}

                  <StatusBar
                    status={saveStatus}
                    draftId={pieceId}
                    showDraftId={false}
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
                      setDocJSON(null);
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

        <SplitSuggestionCallout
          pieceId={pieceId}
          status={splitSuggestionStatus}
          onStatusChange={setSplitSuggestionStatus}
          onInsertSplitMarkers={(splitPoints) => {
            const editor = editorRef.current as any // eslint-disable-line @typescript-eslint/no-explicit-any
            editor?.commands?.insertSplitMarkersFromAI(splitPoints)
          }}
        />

        {!wantsCollab && !streamIsActive && (
          <ExecuteSplitBanner
            pieceId={pieceId}
            splitMarkerCount={splitMarkerCount}
            onSplitExecuted={({ session_id, surface_body_json }) => {
              resumeSession(session_id, surface_body_json)
            }}
          />
        )}

        <WorkspaceToggle
          workspaceOpen={workspaceOpen}
          onToggle={() => { setWorkspaceOpen(true); setLbDeskOpen(false); }}
          isLb={!!lbId}
          lbDeskOpen={lbDeskOpen}
          onLbToggle={() => { setLbDeskOpen(true); setWorkspaceOpen(false); }}
        />

        {lbId && (
          <LbDesk
            isOpen={lbDeskOpen}
            onClose={() => setLbDeskOpen(false)}
            width={workspaceWidth}
            lbId={lbId}
            livingBook={livingBook ?? null}
            collaboratorCount={(dispatchContent?.editor_count ?? 0) + (dispatchContent?.commenter_count ?? 0)}
            currentUserId={""}
            sponsor={{ type: sponsor.type, slug: sponsor.slug ?? "" }}
            onInsertAnchor={(anchorId) => {
              editorRef.current?.commands.insertLbAnchor(anchorId);
            }}
            onRequestBranch={() => setBranchDialogOpen(true)}
          />
        )}

        {lbId && (
          <CreateBranchDialog
            isOpen={branchDialogOpen}
            onClose={() => setBranchDialogOpen(false)}
            lbId={lbId}
            onInsertAnchor={(anchorId) => {
              editorRef.current?.commands.insertLbAnchor(anchorId);
            }}
            onBranchCreated={(branch) => setActiveBranch(branch)}
          />
        )}

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
          targetWordCount={targetWordCount}
          overTarget={overTarget}
          suggestSplits={suggestSplits}
          onTargetWordCountChange={handleTargetWordCountChange}
          onSuggestSplitsChange={handleSuggestSplitsChange}
          pieceId={pieceId}
          linkedinCopy={linkedinCopy}
          linkedinCopyExtended={linkedinCopyExtended}
          onLinkedInCopyGenerated={(copy, extended) => {
            setLinkedinCopy(copy);
            setLinkedinCopyExtended(extended);
          }}
        />
      </HStack>
    </Box>
  );
}

// apps/mixtape/src/components/writing/outline/OutlineDrawer.tsx

// Inline sidebar panel (replaces former Chakra Drawer)

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, VStack, HStack, Text, Button, Input, IconButton, Spinner,
} from '@chakra-ui/react';
import { useColorModeValue } from '@components/ui/color-mode';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconTrash, IconGripVertical, IconX, IconChevronRight, IconChevronDown } from '@tabler/icons-react';
import {
  fetchOutline,
  createOutlineNode,
  updateOutlineNode,
  deleteOutlineNode,
  enableOutline as enableOutlineApi,
  type OutlineNode,
} from '@mixtape/api/clients/dispatch/outlineApi';
import {
  createSuggestedRevision,
  exportWritingAnalysis,
  type WritingAnalysisExportResponse,
  type WritingSuggestedRevisionCreateResponse,
} from '@mixtape/api/clients/writing/writingApi';
import type { Editor } from '@tiptap/react';
import { v4 as uuid } from 'uuid';

// --- Phase 1: Heading extraction (read-only fallback) ---

interface HeadingEntry {
  id: string;
  text: string;
  level: number;
  pos: number;
  children: HeadingEntry[];
}

function extractHeadings(editor: Editor): HeadingEntry[] {
  const flat: Omit<HeadingEntry, 'children'>[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const level = node.attrs.level as number;
      const text = node.textContent || '(untitled heading)';
      const id = node.attrs['data-block-id'] || `heading-${pos}`;
      flat.push({ id, text, level, pos });
    }
  });
  return buildHeadingTree(flat);
}

function buildHeadingTree(flat: Omit<HeadingEntry, 'children'>[]): HeadingEntry[] {
  const root: HeadingEntry[] = [];
  const stack: HeadingEntry[] = [];
  for (const item of flat) {
    const entry: HeadingEntry = { ...item, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= entry.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      root.push(entry);
    } else {
      stack[stack.length - 1].children.push(entry);
    }
    stack.push(entry);
  }
  return root;
}

// --- Props ---

interface OutlineDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  editor: Editor | null;
  pieceId: string;
  enableOutline: boolean;
  sponsor?: {
    type: 'group' | 'member';
    slug?: string;
  };
}

// --- Phase 1 Heading Item ---

function HeadingItem({
  entry,
  depth,
  activePos,
  onNavigate,
  collapsedIds,
  onToggleCollapse,
}: {
  entry: HeadingEntry;
  depth: number;
  activePos: number | null;
  onNavigate: (pos: number) => void;
  collapsedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
}) {
  const isActive = activePos === entry.pos;
  const hasChildren = entry.children.length > 0;
  const isCollapsed = collapsedIds.has(entry.id);
  const activeBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const activeColor = useColorModeValue('blue.700', 'blue.200');
  const levelColor = useColorModeValue('gray.400', 'gray.500');

  return (
    <>
      <HStack
        as="button"
        w="100%"
        px={3}
        py={1.5}
        pl={`${8 + (entry.level - 1) * 16}px`}
        gap={2}
        borderRadius="md"
        bg={isActive ? activeBg : 'transparent'}
        color={isActive ? activeColor : undefined}
        fontWeight={isActive ? 'semibold' : 'normal'}
        _hover={{ bg: isActive ? activeBg : hoverBg }}
        cursor="pointer"
        onClick={() => onNavigate(entry.pos)}
        textAlign="left"
        transition="background 0.15s"
      >
        <Box w="20px" flexShrink={0} display="flex" alignItems="center" justifyContent="center">
          {hasChildren ? (
            <IconButton
              size="2xs"
              variant="ghost"
              aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
              onClick={(event) => {
                event.stopPropagation();
                onToggleCollapse(entry.id);
              }}
            >
              {isCollapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}
            </IconButton>
          ) : null}
        </Box>
        <Text fontSize="2xs" fontWeight="bold" color={levelColor} minW="24px" flexShrink={0} fontFamily="mono">
          H{entry.level}
        </Text>
        <Text fontSize="sm" lineClamp={1}>
          {entry.text}
        </Text>
      </HStack>
      {!isCollapsed &&
        entry.children.map((child) => (
          <HeadingItem
            key={child.id}
            entry={child}
            depth={depth + 1}
            activePos={activePos}
            onNavigate={onNavigate}
            collapsedIds={collapsedIds}
            onToggleCollapse={onToggleCollapse}
          />
        ))}
    </>
  );
}

function SuggestedRevisionPanel({
  analysisResult,
  revisionResult,
  analysisError,
  emptyColor,
  borderColor,
  isAnalyzing,
  isCreatingRevision,
  onAnalyze,
  onCreateRevision,
  onOpenRevision,
  canOpenRevision,
}: {
  analysisResult: WritingAnalysisExportResponse | null;
  revisionResult: WritingSuggestedRevisionCreateResponse | null;
  analysisError: string | null;
  emptyColor: string;
  borderColor: string;
  isAnalyzing: boolean;
  isCreatingRevision: boolean;
  onAnalyze: () => void;
  onCreateRevision: () => void;
  onOpenRevision: () => void;
  canOpenRevision: boolean;
}) {
  const fidelitySummary = revisionResult?.fidelity_report?.report_payload?.summary;
  const exportStats = analysisResult?.export.derived.stats;
  const detectedHeadingCount = analysisResult?.export.outline.detected_headings.length ?? 0;

  return (
    <Box mt={4} px={2} pt={3} borderTop="1px solid" borderColor={borderColor}>
      <VStack gap={2} align="stretch">
        <Text fontSize="xs" fontWeight="semibold">
          Suggested Revision
        </Text>
        <Text fontSize="2xs" color={emptyColor}>
          Export the current draft, keep the source untouched, and create a sibling revision with a fidelity report.
        </Text>
        <Button
          size="xs"
          variant="outline"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          w="100%"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Draft'}
        </Button>
        {exportStats && (
          <Text fontSize="2xs" color={emptyColor}>
            {exportStats.block_count} blocks, {exportStats.word_count} words, {detectedHeadingCount} detected headings.
          </Text>
        )}
        {analysisResult && !revisionResult && (
          <Button
            size="xs"
            onClick={onCreateRevision}
            disabled={isCreatingRevision}
            w="100%"
          >
            {isCreatingRevision ? 'Creating...' : 'Create Suggested Revision'}
          </Button>
        )}
        {revisionResult && (
          <VStack gap={2} align="stretch">
            <Text fontSize="2xs" color={emptyColor}>
              Created sibling draft: {revisionResult.piece.title || 'Suggested revision'}
            </Text>
            {fidelitySummary && (
              <Box fontSize="2xs" color={emptyColor}>
                <Text>Unchanged blocks: {fidelitySummary.unchanged_block_count ?? 0}</Text>
                <Text>Edited blocks: {fidelitySummary.edited_block_count ?? 0}</Text>
                <Text>Added blocks: {fidelitySummary.added_block_count ?? 0}</Text>
                <Text>Removed blocks: {fidelitySummary.removed_block_count ?? 0}</Text>
              </Box>
            )}
            <Button
              size="xs"
              variant="outline"
              onClick={onOpenRevision}
              disabled={!canOpenRevision}
              w="100%"
            >
              Open Suggested Draft
            </Button>
          </VStack>
        )}
        {analysisError && (
          <Text fontSize="2xs" color="red.500">
            {analysisError}
          </Text>
        )}
      </VStack>
    </Box>
  );
}

// --- Phase 2 Outline Node Item ---

function OutlineNodeItem({
  node,
  depth,
  editor,
  pieceId,
  collapsedIds,
  onToggleCollapse,
}: {
  node: OutlineNode;
  depth: number;
  editor: Editor | null;
  pieceId: string;
  collapsedIds: Set<string>;
  onToggleCollapse: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const hoverBg = useColorModeValue('gray.100', 'gray.700');
  const linkedColor = useColorModeValue('green.500', 'green.300');
  const unlinkedColor = useColorModeValue('gray.400', 'gray.500');

  const updateMutation = useMutation({
    mutationFn: (data: { title: string }) => updateOutlineNode(node.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch', 'outline', pieceId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOutlineNode(node.id),
    onSuccess: () => {
      // Remove marker from editor if it exists
      if (editor && node.anchor_target) {
        try {
          editor.commands.removeOutlineMarker(node.anchor_target);
        } catch {
          // marker may already be gone
        }
      }
      queryClient.invalidateQueries({ queryKey: ['dispatch', 'outline', pieceId] });
    },
  });

  const handleSaveTitle = useCallback(() => {
    setIsEditing(false);
    if (editTitle.trim() && editTitle !== node.title) {
      updateMutation.mutate({ title: editTitle.trim() });
    } else {
      setEditTitle(node.title);
    }
  }, [editTitle, node.title, updateMutation]);

  const handleNavigate = useCallback(() => {
    if (!editor || !node.anchor_target) return;

    // Find the outline marker in the document
    let markerPos: number | null = null;
    editor.state.doc.descendants((n, pos) => {
      if (n.type.name === 'outlineMarker' && n.attrs.nodeId === node.anchor_target) {
        markerPos = pos;
        return false;
      }
    });

    if (markerPos !== null) {
      editor.chain().setTextSelection(markerPos).scrollIntoView().run();
      editor.commands.focus();
    }
  }, [editor, node.anchor_target]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const isLinked = !!node.anchor_target;
  const hasChildren = !!node.children && node.children.length > 0;
  const isCollapsed = collapsedIds.has(node.id);

  return (
    <>
      <HStack
        w="100%"
        px={2}
        py={1}
        pl={`${8 + depth * 16}px`}
        gap={1}
        borderRadius="md"
        _hover={{ bg: hoverBg }}
        transition="background 0.15s"
      >
        <HStack gap={0.5} flexShrink={0}>
          <Box color="gray.400" cursor="grab">
            <IconGripVertical size={14} />
          </Box>
          {hasChildren ? (
            <IconButton
              size="2xs"
              variant="ghost"
              aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
              onClick={(event) => {
                event.stopPropagation();
                onToggleCollapse(node.id);
              }}
            >
              {isCollapsed ? <IconChevronRight size={12} /> : <IconChevronDown size={12} />}
            </IconButton>
          ) : null}
        </HStack>

        <Box
          w="6px"
          h="6px"
          borderRadius="full"
          bg={isLinked ? linkedColor : unlinkedColor}
          flexShrink={0}
          title={isLinked ? 'Anchored in document' : 'No anchor (click to navigate anyway)'}
        />

        {isEditing ? (
          <Input
            ref={inputRef}
            size="xs"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTitle();
              if (e.key === 'Escape') {
                setEditTitle(node.title);
                setIsEditing(false);
              }
            }}
            flex={1}
          />
        ) : (
          <Text
            fontSize="sm"
            lineClamp={1}
            flex={1}
            cursor="pointer"
            onClick={handleNavigate}
            onDoubleClick={() => setIsEditing(true)}
            title="Click to navigate, double-click to edit"
          >
            {node.title || '(untitled)'}
          </Text>
        )}

        <IconButton
          size="2xs"
          variant="ghost"
          onClick={() => deleteMutation.mutate()}
          aria-label="Delete section"
          title="Delete section"
          disabled={deleteMutation.isPending}
        >
          <IconTrash size={12} />
        </IconButton>
      </HStack>

      {!isCollapsed &&
        node.children?.map((child) => (
          <OutlineNodeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            editor={editor}
            pieceId={pieceId}
            collapsedIds={collapsedIds}
            onToggleCollapse={onToggleCollapse}
          />
        ))}
    </>
  );
}

// --- Main Inline Panel ---

export function OutlineDrawer({
  isOpen,
  onClose,
  editor,
  pieceId,
  enableOutline: initialEnableOutline,
  sponsor,
}: OutlineDrawerProps) {
  const [outlineEnabled, setOutlineEnabled] = useState(initialEnableOutline);
  const queryClient = useQueryClient();

  // Sync prop changes
  useEffect(() => {
    setOutlineEnabled(initialEnableOutline);
  }, [initialEnableOutline]);

  // Phase 1 state (headings fallback)
  const [headings, setHeadings] = useState<HeadingEntry[]>([]);
  const [activePos, setActivePos] = useState<number | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const [analysisResult, setAnalysisResult] = useState<WritingAnalysisExportResponse | null>(null);
  const [revisionResult, setRevisionResult] = useState<WritingSuggestedRevisionCreateResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const panelBg = useColorModeValue('white', 'gray.800');
  const headerBorder = useColorModeValue('gray.200', 'gray.700');
  const emptyColor = useColorModeValue('gray.500', 'gray.400');

  // Phase 2: Fetch persistent outline
  const { data: outlineNodes = [], isLoading: outlineLoading } = useQuery({
    queryKey: ['dispatch', 'outline', pieceId],
    queryFn: () => fetchOutline(pieceId),
    enabled: isOpen && outlineEnabled,
  });

  // Enable outline mutation
  const enableMutation = useMutation({
    mutationFn: () => enableOutlineApi(pieceId),
    onSuccess: () => {
      setOutlineEnabled(true);
      queryClient.invalidateQueries({ queryKey: ['dispatch', 'outline', pieceId] });
    },
  });

  // Create node mutation
  const createMutation = useMutation({
    mutationFn: (data: { title: string; anchor_target: string | null }) =>
      createOutlineNode({
        writing_piece: pieceId,
        title: data.title,
        anchor_target: data.anchor_target,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch', 'outline', pieceId] });
    },
  });

  const exportAnalysisMutation = useMutation({
    mutationFn: () => exportWritingAnalysis(pieceId, { planner_type: 'hybrid', planner_label: 'outline-drawer-v1' }),
    onSuccess: (data) => {
      setAnalysisResult(data);
      setRevisionResult(null);
      setAnalysisError(null);
    },
    onError: (error: unknown) => {
      console.error('Failed to export writing analysis:', error);
      setAnalysisError('Could not analyze this draft right now.');
    },
  });

  const createSuggestedRevisionMutation = useMutation({
    mutationFn: () => {
      if (!analysisResult?.session?.id) {
        throw new Error('Missing analysis session');
      }
      return createSuggestedRevision(pieceId, analysisResult.session.id);
    },
    onSuccess: (data) => {
      setRevisionResult(data);
      setAnalysisError(null);
    },
    onError: (error: unknown) => {
      console.error('Failed to create suggested revision:', error);
      setAnalysisError('Could not create a suggested revision.');
    },
  });

  // Phase 1: Extract headings when outline is NOT enabled
  const refreshHeadings = useCallback(() => {
    if (!editor || editor.isDestroyed) {
      setHeadings([]);
      return;
    }
    setHeadings(extractHeadings(editor));
  }, [editor]);

  useEffect(() => {
    if (!isOpen || !editor || outlineEnabled) return;
    refreshHeadings();
    const handler = () => refreshHeadings();
    editor.on('update', handler);
    return () => { editor.off('update', handler); };
  }, [isOpen, editor, outlineEnabled, refreshHeadings]);

  // Phase 1: Track cursor for active heading
  useEffect(() => {
    if (!isOpen || !editor || outlineEnabled) return;
    const updateActive = () => {
      const { from } = editor.state.selection;
      let nearestPos: number | null = null;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading' && pos <= from) {
          nearestPos = pos;
        }
      });
      setActivePos(nearestPos);
    };
    updateActive();
    editor.on('selectionUpdate', updateActive);
    return () => { editor.off('selectionUpdate', updateActive); };
  }, [isOpen, editor, outlineEnabled]);

  const handleHeadingNavigate = useCallback((pos: number) => {
    if (!editor) return;
    editor.chain().setTextSelection(pos + 1).scrollIntoView().run();
    editor.commands.focus();
  }, [editor]);

  const toggleCollapse = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleAddSection = useCallback(() => {
    if (!editor) return;

    const markerId = uuid();
    const title = 'New Section';

    // Insert marker at cursor position
    editor.commands.insertOutlineMarker(markerId);

    // Create outline node with anchor
    createMutation.mutate({ title, anchor_target: markerId });
  }, [editor, createMutation]);

  // Count nodes recursively
  const totalNodes = useMemo(() => {
    let count = 0;
    function walk(nodes: OutlineNode[]) {
      for (const n of nodes) {
        count++;
        if (n.children) walk(n.children);
      }
    }
    walk(outlineNodes);
    return count;
  }, [outlineNodes]);

  const totalHeadings = useMemo(() => {
    let count = 0;
    function walk(entries: HeadingEntry[]) {
      for (const e of entries) {
        count++;
        walk(e.children);
      }
    }
    walk(headings);
    return count;
  }, [headings]);

  const sectionCount = outlineEnabled ? totalNodes : totalHeadings;
  const canOpenSuggestedDraft = Boolean(
    sponsor?.slug &&
    (
      (sponsor.type === 'group' && revisionResult?.piece?.slug) ||
      (sponsor.type === 'member' && revisionResult?.piece?.id)
    )
  );

  const handleOpenSuggestedDraft = useCallback(() => {
    const slug = revisionResult?.piece?.slug;
    const pieceId = revisionResult?.piece?.id;
    if (!sponsor?.slug || typeof window === 'undefined') return;
    const href = sponsor.type === 'group'
      ? `/groups/${sponsor.slug}/writing/${slug}`
      : pieceId
        ? `/member/${sponsor.slug}/hub?section=write&piece=${pieceId}`
        : null;
    if (!href) return;
    window.location.href = href;
  }, [revisionResult, sponsor]);

  return (
    <Box
      w={isOpen ? '260px' : '0px'}
      minW={isOpen ? '260px' : '0px'}
      h="100%"
      overflow="hidden"
      transition="width 0.3s ease, min-width 0.3s ease"
      borderRight={isOpen ? '1px solid' : 'none'}
      borderColor={headerBorder}
      bg={panelBg}
      flexShrink={0}
    >
      {/* Header */}
      <Box
        borderBottom="1px solid"
        borderColor={headerBorder}
        py={3}
        px={4}
        minH="52px"
      >
        <HStack justify="space-between" w="100%">
          <VStack gap={0} align="start">
            <Text fontWeight="semibold" fontSize="sm">
              Outline
            </Text>
            {sectionCount > 0 && (
              <Text fontSize="xs" color={emptyColor}>
                {sectionCount} {sectionCount === 1 ? 'section' : 'sections'}
                {!outlineEnabled && ' (auto-detected)'}
              </Text>
            )}
          </VStack>
          <IconButton
            size="xs"
            variant="ghost"
            onClick={onClose}
            aria-label="Close outline"
          >
            <IconX size={14} />
          </IconButton>
        </HStack>
      </Box>

      {/* Body */}
      <Box px={2} py={3} overflowY="auto" h="calc(100% - 52px)">
        {outlineEnabled ? (
          // Phase 2: Persistent outline
          <>
            {outlineLoading ? (
              <Box textAlign="center" py={8}>
                <Spinner size="sm" />
              </Box>
            ) : outlineNodes.length === 0 ? (
              <VStack gap={3} py={8} px={4}>
                <Text fontSize="sm" color={emptyColor} textAlign="center">
                  No sections yet
                </Text>
                <Text fontSize="xs" color={emptyColor} textAlign="center">
                  Add sections to create a navigable outline for your document.
                </Text>
              </VStack>
            ) : (
              <VStack gap={0.5} align="stretch">
                {outlineNodes.map((node) => (
                  <OutlineNodeItem
                    key={node.id}
                    node={node}
                    depth={0}
                    editor={editor}
                    pieceId={pieceId}
                    collapsedIds={collapsedIds}
                    onToggleCollapse={toggleCollapse}
                  />
                ))}
              </VStack>
            )}

            <Box px={2} pt={3}>
              <Button
                size="xs"
                variant="outline"
                onClick={handleAddSection}
                w="100%"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Adding...' : '+ Add Section'}
              </Button>
            </Box>
          </>
        ) : (
          // Phase 1: Auto-detected headings
          <>
            {headings.length === 0 ? (
              <VStack gap={3} py={8} px={4}>
                <Text fontSize="sm" color={emptyColor} textAlign="center">
                  No headings found
                </Text>
                <Text fontSize="xs" color={emptyColor} textAlign="center">
                  Add H1, H2, or H3 headings in your document to see them here.
                </Text>
              </VStack>
            ) : (
              <VStack gap={0.5} align="stretch">
                {headings.map((entry) => (
                  <HeadingItem
                    key={entry.id}
                    entry={entry}
                    depth={0}
                    activePos={activePos}
                    onNavigate={handleHeadingNavigate}
                    collapsedIds={collapsedIds}
                    onToggleCollapse={toggleCollapse}
                  />
                ))}
              </VStack>
            )}

            <Box px={2} pt={4}>
              <Button
                size="xs"
                variant="outline"
                onClick={() => enableMutation.mutate()}
                w="100%"
                disabled={enableMutation.isPending}
              >
                {enableMutation.isPending ? 'Enabling...' : 'Enable Persistent Outline'}
              </Button>
              <Text fontSize="2xs" color={emptyColor} mt={1} textAlign="center">
                Switch from auto-detected headings to manually managed sections.
              </Text>
            </Box>
          </>
        )}

        <SuggestedRevisionPanel
          analysisResult={analysisResult}
          revisionResult={revisionResult}
          analysisError={analysisError}
          emptyColor={emptyColor}
          borderColor={headerBorder}
          isAnalyzing={exportAnalysisMutation.isPending}
          isCreatingRevision={createSuggestedRevisionMutation.isPending}
          onAnalyze={() => exportAnalysisMutation.mutate()}
          onCreateRevision={() => createSuggestedRevisionMutation.mutate()}
          onOpenRevision={handleOpenSuggestedDraft}
          canOpenRevision={canOpenSuggestedDraft}
        />
      </Box>
    </Box>
  );
}

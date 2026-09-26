"use client";
// components/writing/issue-board/IssueBoardWorkArea.tsx
// ADR-0054 (+ Phase 3 amendment): Issue Board (P1-4 through P1-9, renamed from Run Board)

import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Input,
  Text,
  VStack,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { IconPlus, IconX, IconCheck, IconLock, IconTextSpellcheck, IconEye } from "@tabler/icons-react";
import { Tooltip } from "@components/ui/tooltip";
import { toaster } from "@components/ui/toaster";
import NextLink from "next/link";
import { useIssues, useIssue } from "@mixtape/api/hooks/useIssueBoard";
import { useWriting } from "@mixtape/api/hooks/useWriting";
import type { WorkingDocument, Issue, IssueListItem } from "@mixtape/core/types/writingTypes";

interface Sponsor {
  type: "member" | "group";
  slug: string;
  id?: string;
  displayName?: string;
}

interface IssueBoardWorkAreaProps {
  sponsor: Sponsor;
}

// ---------------------------------------------------------------------------
// Status dot — three-color per ADR D4
// ---------------------------------------------------------------------------

type DotColor = "blue" | "green" | "yellow";

function getDocDotColor(doc: WorkingDocument): DotColor {
  if (doc.piece?.status === "published") return "blue";
  if (doc.piece?.spellcheck_clean && doc.piece?.signed_off) return "green";
  return "yellow";
}

const DOT_COLORS: Record<DotColor, string> = {
  blue: "blue.400",
  green: "green.400",
  yellow: "yellow.400",
};

function StatusDot({ color, label }: { color: DotColor; label?: string }) {
  return (
    <Tooltip content={label || color}>
      <Box w="9px" h="9px" borderRadius="full" bg={DOT_COLORS[color]} flexShrink={0} />
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// Issue rollup dot — Green only when all placements are Green
// ---------------------------------------------------------------------------

function issueRollupColor(issue: Issue | IssueListItem): DotColor {
  if (issue.status === "published") return "blue";
  if ("placements" in issue) {
    const i = issue as Issue;
    if (!i.placements.length) return "yellow";
    return i.placements.every((p) => p.spellcheck_clean && p.signed_off) ? "green" : "yellow";
  }
  return "yellow";
}

// ---------------------------------------------------------------------------
// Draggable Doc Card
// ---------------------------------------------------------------------------

interface DocCardProps {
  doc: WorkingDocument;
  inIssue: boolean;
  isDragging?: boolean;
  onSignOff?: (pieceId: string) => void;
}

function DocCard({ doc, isDragging, onSignOff }: DocCardProps) {
  const dotColor = getDocDotColor(doc);
  const pieceId = doc.piece?.id ?? String(doc.id);
  const title = doc.piece?.title || doc.title || "Untitled";
  const canSignOff = dotColor !== "blue";

  return (
    <Box
      className="ib-doc-card"
      bg="theme.bg"
      borderWidth="1px"
      borderColor={isDragging ? "blue.400" : "theme.border"}
      borderRadius="lg"
      p={3}
      cursor="grab"
      opacity={isDragging ? 0.5 : 1}
      boxShadow={isDragging ? "lg" : "sm"}
      transition="all 0.15s"
      minW="180px"
      maxW="220px"
      userSelect="none"
    >
      <HStack justify="space-between" mb={1.5} align="flex-start">
        <StatusDot
          color={dotColor}
          label={
            dotColor === "blue" ? "Published" :
            dotColor === "green" ? "Ready — spellcheck clean + signed off" :
            "Not ready"
          }
        />
        {canSignOff && onSignOff && !doc.piece?.signed_off && (
          <Tooltip content="Sign off on this doc">
            <Box
              as="button"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); onSignOff(pieceId); }}
              p={0.5}
              borderRadius="sm"
              _hover={{ bg: "green.50" }}
            >
              <IconCheck size={13} color="green" />
            </Box>
          </Tooltip>
        )}
      </HStack>
      <Text fontSize="12px" fontWeight="600" lineClamp={2} color="theme.text" mb={1}>
        {title}
      </Text>
      <HStack gap={2} mt={1}>
        {doc.piece?.spellcheck_clean && (
          <Tooltip content="Spellcheck clean">
            <IconTextSpellcheck size={11} color="green" />
          </Tooltip>
        )}
        {doc.piece?.signed_off && (
          <Tooltip content="Signed off">
            <IconCheck size={11} color="green" />
          </Tooltip>
        )}
      </HStack>
    </Box>
  );
}

function DraggableDocCard({
  doc,
  inIssue,
  onSignOff,
}: DocCardProps) {
  const pieceId = doc.piece?.id ?? String(doc.id);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `doc-${pieceId}`,
    data: { type: "doc", pieceId, fromIssue: inIssue ? undefined : null },
  });

  return (
    <Box ref={setNodeRef} {...attributes} {...listeners}>
      <DocCard doc={doc} inIssue={inIssue} isDragging={isDragging} onSignOff={onSignOff} />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Droppable Issue Panel
// ---------------------------------------------------------------------------

interface IssuePanelProps {
  issue: IssueListItem;
  docs: WorkingDocument[];
  isZoomed: boolean;
  otherZoomed: boolean;
  onZoom: () => void;
  onZoomOut: () => void;
  onDelete: () => void;
  onSignOff?: (pieceId: string) => void;
  onPublish?: () => void;
  focusedIssueData: Issue | null;
  focusedIssueLoading: boolean;
}

function IssuePanel({
  issue,
  docs,
  isZoomed,
  otherZoomed,
  onZoom,
  onZoomOut,
  onDelete,
  onSignOff,
  onPublish,
  focusedIssueData,
  focusedIssueLoading,
}: IssuePanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `issue-${issue.id}` });
  const rollup = issueRollupColor(isZoomed && focusedIssueData ? focusedIssueData : issue);

  // Zoomed panel: 85vw × 85vh, 90% opacity, frosted, elevated
  if (isZoomed) {
    return (
      <Box
        className="ib-issue-panel ib-issue-panel--zoomed"
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        w="85vw"
        maxH="85vh"
        overflowY="auto"
        bg="theme.bg"
        opacity={0.9}
        backdropFilter="blur(8px)"
        borderWidth="2px"
        borderColor="blue.400"
        borderRadius="xl"
        boxShadow="2xl"
        zIndex={200}
        p={5}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <HStack gap={3}>
            <StatusDot color={rollup} label={`Issue status: ${rollup}`} />
            <Heading size="sm">{issue.title}</Heading>
            {issue.status === "published" && <Badge colorPalette="blue">Published</Badge>}
          </HStack>
          <HStack gap={2}>
            <NextLink href={`/writing/issues/${issue.id}/read`} target="_blank">
              <Button size="xs" variant="outline">
                <IconEye size={12} />
                Preview
              </Button>
            </NextLink>
            {issue.status === "draft" && onPublish && (
              <Tooltip content={issue.is_publishable ? "Publish Issue (all Docs are Green)" : "All Docs must be Green before publishing"}>
                <Button
                  size="xs"
                  colorPalette="blue"
                  disabled={!issue.is_publishable}
                  onClick={onPublish}
                >
                  <IconLock size={12} />
                  Publish Issue
                </Button>
              </Tooltip>
            )}
            <Button size="xs" variant="ghost" onClick={onZoomOut}>
              Zoom Out
            </Button>
          </HStack>
        </Flex>

        {focusedIssueLoading ? (
          <Spinner size="sm" />
        ) : (
          <Box ref={setNodeRef}>
            {focusedIssueData && focusedIssueData.placements.length > 0 ? (
              <VStack align="stretch" gap={2}>
                {focusedIssueData.placements.map((placement) => {
                  const doc = docs.find((d) => d.piece?.id === placement.piece_id);
                  if (!doc) return null;
                  return (
                    <HStack key={placement.id} gap={3} align="center">
                      <Text fontSize="12px" color="theme.textSecondary" w="24px" textAlign="right" flexShrink={0}>
                        {placement.order_index + 1}.
                      </Text>
                      <DocCard doc={doc} inIssue={true} onSignOff={onSignOff} />
                    </HStack>
                  );
                })}
              </VStack>
            ) : (
              <Text fontSize="sm" color="theme.textSecondary">
                No Docs in this Issue yet. Drag Docs here from the canvas.
              </Text>
            )}
          </Box>
        )}
      </Box>
    );
  }

  // Normal panel
  return (
    <Box
      className="ib-issue-panel"
      ref={setNodeRef}
      borderWidth="1.5px"
      borderColor={isOver ? "blue.400" : otherZoomed ? "theme.border" : "theme.border"}
      borderRadius="xl"
      p={3}
      bg={isOver ? "blue.50" : "theme.bgSecondary"}
      opacity={otherZoomed ? 0.4 : 1}
      filter={otherZoomed ? "blur(1px)" : "none"}
      transition="all 0.2s"
      minW="220px"
      maxW="280px"
      cursor="pointer"
      onClick={onZoom}
      flexShrink={0}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <HStack gap={2}>
          <StatusDot color={rollup} />
          <Text fontSize="13px" fontWeight="700" color="theme.text">
            {issue.title}
          </Text>
        </HStack>
        <HStack gap={1} onClick={(e) => e.stopPropagation()}>
          <Badge size="xs" colorPalette="gray">{issue.member_count}</Badge>
          <Box
            as="button"
            p={0.5}
            borderRadius="sm"
            _hover={{ bg: "red.50" }}
            onClick={onDelete}
          >
            <IconX size={12} color="gray" />
          </Box>
        </HStack>
      </Flex>
      <Text fontSize="11px" color="theme.textSecondary">
        {issue.member_count === 0
          ? "Drop Docs here"
          : `${issue.member_count} Doc${issue.member_count !== 1 ? "s" : ""} — click to expand`}
      </Text>
      {issue.status === "published" && (
        <Badge size="xs" colorPalette="blue" mt={1}>Published</Badge>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Unassigned pool — droppable zone
// ---------------------------------------------------------------------------

function UnassignedPool({ isOver }: { isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: "unassigned" });
  return (
    <Box
      ref={setNodeRef}
      className="ib-unassigned"
      borderWidth="1px"
      borderStyle="dashed"
      borderColor={isOver ? "blue.400" : "theme.border"}
      borderRadius="lg"
      p={2}
      minH="40px"
      bg={isOver ? "blue.50" : "transparent"}
      transition="all 0.15s"
    />
  );
}

// ---------------------------------------------------------------------------
// Create Issue form
// ---------------------------------------------------------------------------

function CreateIssueForm({ onCreate }: { onCreate: (title: string) => void }) {
  const [title, setTitle] = useState("");
  const [active, setActive] = useState(false);

  const submit = () => {
    if (title.trim()) {
      onCreate(title.trim());
      setTitle("");
      setActive(false);
    }
  };

  if (!active) {
    return (
      <Button size="sm" variant="outline" onClick={() => setActive(true)}>
        <IconPlus size={14} />
        New Issue
      </Button>
    );
  }

  return (
    <HStack gap={2}>
      <Input
        size="sm"
        placeholder="Issue title…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setActive(false); }}
        autoFocus
        maxW="220px"
      />
      <Button size="sm" colorPalette="blue" onClick={submit} disabled={!title.trim()}>
        Create
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setActive(false)}>
        Cancel
      </Button>
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// Main board
// ---------------------------------------------------------------------------

export function IssueBoardWorkArea({ sponsor }: IssueBoardWorkAreaProps) {
  const { issues, isLoading: issuesLoading, createIssue, deleteIssue } = useIssues();
  const { drafts, isLoading: docsLoading } = useWriting(sponsor.type, sponsor.slug);

  const [zoomedIssueId, setZoomedIssueId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const { issue: focusedIssueData, isLoading: focusedIssueLoading, addPlacement, removePlacement, publishIssue, signOffPiece } = useIssue(zoomedIssueId);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Map piece_id → issue_id for quick lookup
  const pieceIssueMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const issue of issues) {
      // We only have member_count in list; detailed issue data for focused issue
      if (focusedIssueData && focusedIssueData.id === issue.id) {
        for (const p of focusedIssueData.placements) {
          map[p.piece_id] = issue.id;
        }
      }
    }
    return map;
  }, [issues, focusedIssueData]);

  // All piece IDs that are in any issue (based on what we know)
  const assignedPieceIds = useMemo(() => new Set(Object.keys(pieceIssueMap)), [pieceIssueMap]);

  // Unassigned docs = docs not in pieceIssueMap
  const unassignedDocs = useMemo(
    () => drafts.filter((d) => !assignedPieceIds.has(d.piece?.id ?? "")),
    [drafts, assignedPieceIds]
  );

  const activeDragDoc = useMemo(() => {
    if (!activeDragId) return null;
    const pieceId = activeDragId.replace("doc-", "");
    return drafts.find((d) => (d.piece?.id ?? String(d.id)) === pieceId) ?? null;
  }, [activeDragId, drafts]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const pieceId = String(active.id).replace("doc-", "");
    const targetId = String(over.id);

    if (targetId === "unassigned") {
      // If in an issue, remove
      const currentIssueId = pieceIssueMap[pieceId];
      if (currentIssueId) {
        try {
          // Use the focused issue's removePlacement if it matches
          if (zoomedIssueId === currentIssueId) {
            await removePlacement.mutateAsync(pieceId);
          }
        } catch {
          toaster.create({ title: "Failed to remove from Issue", type: "error" });
        }
      }
      return;
    }

    if (targetId.startsWith("issue-")) {
      const issueId = targetId.replace("issue-", "");
      const currentIssueId = pieceIssueMap[pieceId];
      if (currentIssueId === issueId) return; // already there

      try {
        // If we're focused on the target issue, use addPlacement
        if (zoomedIssueId === issueId) {
          await addPlacement.mutateAsync(pieceId);
        } else {
          // Navigate to that issue first by zooming in
          // For now: just add via direct API call fallback
          // (The user can also zoom in and drag)
          setZoomedIssueId(issueId);
        }
      } catch (e) {
        const err = e as { response?: { data?: { detail?: string } } };
        toaster.create({ title: err?.response?.data?.detail || "Failed to add to Issue", type: "error" });
      }
    }
  }, [pieceIssueMap, zoomedIssueId, addPlacement, removePlacement]);

  const handlePublish = useCallback(async () => {
    if (!zoomedIssueId) return;
    try {
      await publishIssue.mutateAsync();
      toaster.create({ title: "Issue published — all Docs are now live", type: "success" });
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string; not_ready?: string[] } } };
      const detail = err?.response?.data?.detail || "Publish failed";
      const notReady: string[] = err?.response?.data?.not_ready || [];
      toaster.create({
        title: detail,
        description: notReady.length ? `Not ready: ${notReady.join(", ")}` : undefined,
        type: "error",
      });
    }
  }, [zoomedIssueId, publishIssue]);

  const handleSignOff = useCallback(async (pieceId: string) => {
    if (!zoomedIssueId) return;
    try {
      await signOffPiece.mutateAsync(pieceId);
      toaster.create({ title: "Doc signed off", type: "success" });
    } catch {
      toaster.create({ title: "Sign-off failed", type: "error" });
    }
  }, [zoomedIssueId, signOffPiece]);

  const handleDeleteIssue = useCallback(async (issueId: string) => {
    try {
      await deleteIssue.mutateAsync(issueId);
      if (zoomedIssueId === issueId) setZoomedIssueId(null);
    } catch {
      toaster.create({ title: "Failed to delete Issue", type: "error" });
    }
  }, [deleteIssue, zoomedIssueId]);

  const isLoading = issuesLoading || docsLoading;

  return (
    <Box className="ib-root" w="full" minH="80vh" position="relative">
      {/* Header */}
      <Flex className="ib-header" align="center" justify="space-between" mb={4} flexWrap="wrap" gap={3}>
        <VStack align="start" gap={0}>
          <Heading size="md">Issue Board</Heading>
          <Text fontSize="12px" color="theme.textSecondary">
            Group Docs into Issues and publish them together as a unit.{" "}
            <Text as="span" fontWeight="600">Superuser preview.</Text>
          </Text>
        </VStack>
        <CreateIssueForm onCreate={(title) => createIssue.mutate(title)} />
      </Flex>

      {isLoading && (
        <Flex justify="center" py={8}><Spinner /></Flex>
      )}

      {!isLoading && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Canvas — Issue panels row */}
          {issues.length > 0 && (
            <Box className="ib-canvas-issues" mb={5}>
              <Text fontSize="11px" fontWeight="700" letterSpacing="wider" textTransform="uppercase" color="theme.textSecondary" mb={2}>
                Issues
              </Text>
              <Flex gap={3} flexWrap="wrap" align="flex-start">
                {issues.map((issue) => (
                  <IssuePanel
                    key={issue.id}
                    issue={issue}
                    docs={drafts}
                    isZoomed={zoomedIssueId === issue.id}
                    otherZoomed={!!zoomedIssueId && zoomedIssueId !== issue.id}
                    onZoom={() => setZoomedIssueId(issue.id)}
                    onZoomOut={() => setZoomedIssueId(null)}
                    onDelete={() => handleDeleteIssue(issue.id)}
                    onSignOff={handleSignOff}
                    onPublish={handlePublish}
                    focusedIssueData={zoomedIssueId === issue.id ? focusedIssueData ?? null : null}
                    focusedIssueLoading={zoomedIssueId === issue.id && focusedIssueLoading}
                  />
                ))}
              </Flex>
            </Box>
          )}

          {/* Zoomed overlay backdrop */}
          {zoomedIssueId && (
            <Box
              className="ib-backdrop"
              position="fixed"
              inset={0}
              bg="blackAlpha.400"
              zIndex={199}
              onClick={() => setZoomedIssueId(null)}
            />
          )}

          {/* Doc canvas — unassigned docs */}
          <Box className="ib-canvas-docs">
            <Text fontSize="11px" fontWeight="700" letterSpacing="wider" textTransform="uppercase" color="theme.textSecondary" mb={2}>
              Docs ({unassignedDocs.length} unassigned)
            </Text>
            {unassignedDocs.length === 0 && issues.length === 0 && (
              <Text fontSize="sm" color="theme.textSecondary" py={4}>
                No drafts yet. Create some writing pieces to get started.
              </Text>
            )}
            <Flex gap={3} flexWrap="wrap" align="flex-start">
              {unassignedDocs.map((doc) => (
                <DraggableDocCard
                  key={doc.piece?.id ?? doc.id}
                  doc={doc}
                  inIssue={false}
                  onSignOff={zoomedIssueId ? handleSignOff : undefined}
                />
              ))}
              {/* Unassigned drop zone for removing from issues */}
              {assignedPieceIds.size > 0 && (
                <UnassignedPool isOver={false} />
              )}
            </Flex>
          </Box>

          {/* Drag overlay */}
          <DragOverlay>
            {activeDragDoc && (
              <DocCard doc={activeDragDoc} inIssue={false} isDragging />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Legend */}
      <Box className="ib-legend" mt={6} pt={4} borderTopWidth="1px" borderColor="theme.border">
        <HStack gap={4} flexWrap="wrap">
          <HStack gap={1.5}><Box w="8px" h="8px" borderRadius="full" bg="yellow.400" /><Text fontSize="11px" color="theme.textSecondary">Not ready</Text></HStack>
          <HStack gap={1.5}><Box w="8px" h="8px" borderRadius="full" bg="green.400" /><Text fontSize="11px" color="theme.textSecondary">Spellcheck clean + signed off</Text></HStack>
          <HStack gap={1.5}><Box w="8px" h="8px" borderRadius="full" bg="blue.400" /><Text fontSize="11px" color="theme.textSecondary">Published</Text></HStack>
        </HStack>
      </Box>
    </Box>
  );
}

"use client";
// components/writing/run-board/RunBoardWorkArea.tsx
// ADR-0054: Writing Assembly — Run Board (P1-4 through P1-9)

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
import { IconPlus, IconX, IconCheck, IconLock, IconTextSpellcheck } from "@tabler/icons-react";
import { Tooltip } from "@components/ui/tooltip";
import { toaster } from "@components/ui/toaster";
import { useRuns, useRun } from "@mixtape/api/hooks/useRunBoard";
import { useWriting } from "@mixtape/api/hooks/useWriting";
import type { WorkingDocument, WritingRun, WritingRunList } from "@mixtape/core/types/writingTypes";

interface Sponsor {
  type: "member" | "group";
  slug: string;
  id?: string;
  displayName?: string;
}

interface RunBoardWorkAreaProps {
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
// Run rollup dot — Green only when all members are Green
// ---------------------------------------------------------------------------

function runRollupColor(run: WritingRun | WritingRunList): DotColor {
  if (run.status === "published") return "blue";
  if ("memberships" in run) {
    const r = run as WritingRun;
    if (!r.memberships.length) return "yellow";
    return r.memberships.every((m) => m.spellcheck_clean && m.signed_off) ? "green" : "yellow";
  }
  return "yellow";
}

// ---------------------------------------------------------------------------
// Draggable Doc Card
// ---------------------------------------------------------------------------

interface DocCardProps {
  doc: WorkingDocument;
  inRun: boolean;
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
      className="rb-doc-card"
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
  inRun,
  onSignOff,
}: DocCardProps) {
  const pieceId = doc.piece?.id ?? String(doc.id);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `doc-${pieceId}`,
    data: { type: "doc", pieceId, fromRun: inRun ? undefined : null },
  });

  return (
    <Box ref={setNodeRef} {...attributes} {...listeners}>
      <DocCard doc={doc} inRun={inRun} isDragging={isDragging} onSignOff={onSignOff} />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Droppable Run Panel
// ---------------------------------------------------------------------------

interface RunPanelProps {
  run: WritingRunList;
  docs: WorkingDocument[];
  isZoomed: boolean;
  otherZoomed: boolean;
  onZoom: () => void;
  onZoomOut: () => void;
  onDelete: () => void;
  onSignOff?: (pieceId: string) => void;
  onPublish?: () => void;
  focusedRunData: WritingRun | null;
  focusedRunLoading: boolean;
}

function RunPanel({
  run,
  docs,
  isZoomed,
  otherZoomed,
  onZoom,
  onZoomOut,
  onDelete,
  onSignOff,
  onPublish,
  focusedRunData,
  focusedRunLoading,
}: RunPanelProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `run-${run.id}` });
  const rollup = runRollupColor(isZoomed && focusedRunData ? focusedRunData : run);

  // Zoomed panel: 85vw × 85vh, 90% opacity, frosted, elevated
  if (isZoomed) {
    return (
      <Box
        className="rb-run-panel rb-run-panel--zoomed"
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
            <StatusDot color={rollup} label={`Run status: ${rollup}`} />
            <Heading size="sm">{run.title}</Heading>
            {run.status === "published" && <Badge colorPalette="blue">Published</Badge>}
          </HStack>
          <HStack gap={2}>
            {run.status === "draft" && onPublish && (
              <Tooltip content={run.is_publishable ? "Publish Run (all Docs are Green)" : "All Docs must be Green before publishing"}>
                <Button
                  size="xs"
                  colorPalette="blue"
                  disabled={!run.is_publishable}
                  onClick={onPublish}
                >
                  <IconLock size={12} />
                  Publish Run
                </Button>
              </Tooltip>
            )}
            <Button size="xs" variant="ghost" onClick={onZoomOut}>
              Zoom Out
            </Button>
          </HStack>
        </Flex>

        {focusedRunLoading ? (
          <Spinner size="sm" />
        ) : (
          <Box ref={setNodeRef}>
            {focusedRunData && focusedRunData.memberships.length > 0 ? (
              <VStack align="stretch" gap={2}>
                {focusedRunData.memberships.map((member) => {
                  const doc = docs.find((d) => d.piece?.id === member.piece_id);
                  if (!doc) return null;
                  return (
                    <HStack key={member.id} gap={3} align="center">
                      <Text fontSize="12px" color="theme.textSecondary" w="24px" textAlign="right" flexShrink={0}>
                        {member.order_index + 1}.
                      </Text>
                      <DocCard doc={doc} inRun={true} onSignOff={onSignOff} />
                    </HStack>
                  );
                })}
              </VStack>
            ) : (
              <Text fontSize="sm" color="theme.textSecondary">
                No Docs in this Run yet. Drag Docs here from the canvas.
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
      className="rb-run-panel"
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
            {run.title}
          </Text>
        </HStack>
        <HStack gap={1} onClick={(e) => e.stopPropagation()}>
          <Badge size="xs" colorPalette="gray">{run.member_count}</Badge>
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
        {run.member_count === 0
          ? "Drop Docs here"
          : `${run.member_count} Doc${run.member_count !== 1 ? "s" : ""} — click to expand`}
      </Text>
      {run.status === "published" && (
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
      className="rb-unassigned"
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
// Create Run form
// ---------------------------------------------------------------------------

function CreateRunForm({ onCreate }: { onCreate: (title: string) => void }) {
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
        New Run
      </Button>
    );
  }

  return (
    <HStack gap={2}>
      <Input
        size="sm"
        placeholder="Run title…"
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

export function RunBoardWorkArea({ sponsor }: RunBoardWorkAreaProps) {
  const { runs, isLoading: runsLoading, createRun, deleteRun } = useRuns();
  const { drafts, isLoading: docsLoading } = useWriting(sponsor.type, sponsor.slug);

  const [zoomedRunId, setZoomedRunId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const { run: focusedRunData, isLoading: focusedRunLoading, addMember, removeMember, publishRun, signOffPiece } = useRun(zoomedRunId);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  // Map piece_id → run_id for quick lookup
  const pieceRunMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const run of runs) {
      // We only have member_count in list; detailed run data for focused run
      if (focusedRunData && focusedRunData.id === run.id) {
        for (const m of focusedRunData.memberships) {
          map[m.piece_id] = run.id;
        }
      }
    }
    return map;
  }, [runs, focusedRunData]);

  // All piece IDs that are in any run (based on what we know)
  const assignedPieceIds = useMemo(() => new Set(Object.keys(pieceRunMap)), [pieceRunMap]);

  // Unassigned docs = docs not in pieceRunMap
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
      // If in a run, remove
      const currentRunId = pieceRunMap[pieceId];
      if (currentRunId) {
        try {
          // Use the focused run's removeMember if it matches
          if (zoomedRunId === currentRunId) {
            await removeMember.mutateAsync(pieceId);
          }
        } catch {
          toaster.create({ title: "Failed to remove from Run", type: "error" });
        }
      }
      return;
    }

    if (targetId.startsWith("run-")) {
      const runId = targetId.replace("run-", "");
      const currentRunId = pieceRunMap[pieceId];
      if (currentRunId === runId) return; // already there

      try {
        // If we're focused on the target run, use addMember
        if (zoomedRunId === runId) {
          await addMember.mutateAsync(pieceId);
        } else {
          // Navigate to that run first by zooming in
          // For now: just add via direct API call fallback
          // (The user can also zoom in and drag)
          setZoomedRunId(runId);
        }
      } catch (e) {
        const err = e as { response?: { data?: { detail?: string } } };
        toaster.create({ title: err?.response?.data?.detail || "Failed to add to Run", type: "error" });
      }
    }
  }, [pieceRunMap, zoomedRunId, addMember, removeMember]);

  const handlePublish = useCallback(async () => {
    if (!zoomedRunId) return;
    try {
      await publishRun.mutateAsync();
      toaster.create({ title: "Run published — all Docs are now live", type: "success" });
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
  }, [zoomedRunId, publishRun]);

  const handleSignOff = useCallback(async (pieceId: string) => {
    if (!zoomedRunId) return;
    try {
      await signOffPiece.mutateAsync(pieceId);
      toaster.create({ title: "Doc signed off", type: "success" });
    } catch {
      toaster.create({ title: "Sign-off failed", type: "error" });
    }
  }, [zoomedRunId, signOffPiece]);

  const handleDeleteRun = useCallback(async (runId: string) => {
    try {
      await deleteRun.mutateAsync(runId);
      if (zoomedRunId === runId) setZoomedRunId(null);
    } catch {
      toaster.create({ title: "Failed to delete Run", type: "error" });
    }
  }, [deleteRun, zoomedRunId]);

  const isLoading = runsLoading || docsLoading;

  return (
    <Box className="rb-root" w="full" minH="80vh" position="relative">
      {/* Header */}
      <Flex className="rb-header" align="center" justify="space-between" mb={4} flexWrap="wrap" gap={3}>
        <VStack align="start" gap={0}>
          <Heading size="md">Run Board</Heading>
          <Text fontSize="12px" color="theme.textSecondary">
            Group Docs into Runs and publish them together as a unit.{" "}
            <Text as="span" fontWeight="600">Superuser preview.</Text>
          </Text>
        </VStack>
        <CreateRunForm onCreate={(title) => createRun.mutate(title)} />
      </Flex>

      {isLoading && (
        <Flex justify="center" py={8}><Spinner /></Flex>
      )}

      {!isLoading && (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          {/* Canvas — Run panels row */}
          {runs.length > 0 && (
            <Box className="rb-canvas-runs" mb={5}>
              <Text fontSize="11px" fontWeight="700" letterSpacing="wider" textTransform="uppercase" color="theme.textSecondary" mb={2}>
                Runs
              </Text>
              <Flex gap={3} flexWrap="wrap" align="flex-start">
                {runs.map((run) => (
                  <RunPanel
                    key={run.id}
                    run={run}
                    docs={drafts}
                    isZoomed={zoomedRunId === run.id}
                    otherZoomed={!!zoomedRunId && zoomedRunId !== run.id}
                    onZoom={() => setZoomedRunId(run.id)}
                    onZoomOut={() => setZoomedRunId(null)}
                    onDelete={() => handleDeleteRun(run.id)}
                    onSignOff={handleSignOff}
                    onPublish={handlePublish}
                    focusedRunData={zoomedRunId === run.id ? focusedRunData ?? null : null}
                    focusedRunLoading={zoomedRunId === run.id && focusedRunLoading}
                  />
                ))}
              </Flex>
            </Box>
          )}

          {/* Zoomed overlay backdrop */}
          {zoomedRunId && (
            <Box
              className="rb-backdrop"
              position="fixed"
              inset={0}
              bg="blackAlpha.400"
              zIndex={199}
              onClick={() => setZoomedRunId(null)}
            />
          )}

          {/* Doc canvas — unassigned docs */}
          <Box className="rb-canvas-docs">
            <Text fontSize="11px" fontWeight="700" letterSpacing="wider" textTransform="uppercase" color="theme.textSecondary" mb={2}>
              Docs ({unassignedDocs.length} unassigned)
            </Text>
            {unassignedDocs.length === 0 && runs.length === 0 && (
              <Text fontSize="sm" color="theme.textSecondary" py={4}>
                No drafts yet. Create some writing pieces to get started.
              </Text>
            )}
            <Flex gap={3} flexWrap="wrap" align="flex-start">
              {unassignedDocs.map((doc) => (
                <DraggableDocCard
                  key={doc.piece?.id ?? doc.id}
                  doc={doc}
                  inRun={false}
                  onSignOff={zoomedRunId ? handleSignOff : undefined}
                />
              ))}
              {/* Unassigned drop zone for removing from runs */}
              {assignedPieceIds.size > 0 && (
                <UnassignedPool isOver={false} />
              )}
            </Flex>
          </Box>

          {/* Drag overlay */}
          <DragOverlay>
            {activeDragDoc && (
              <DocCard doc={activeDragDoc} inRun={false} isDragging />
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Legend */}
      <Box className="rb-legend" mt={6} pt={4} borderTopWidth="1px" borderColor="theme.border">
        <HStack gap={4} flexWrap="wrap">
          <HStack gap={1.5}><Box w="8px" h="8px" borderRadius="full" bg="yellow.400" /><Text fontSize="11px" color="theme.textSecondary">Not ready</Text></HStack>
          <HStack gap={1.5}><Box w="8px" h="8px" borderRadius="full" bg="green.400" /><Text fontSize="11px" color="theme.textSecondary">Spellcheck clean + signed off</Text></HStack>
          <HStack gap={1.5}><Box w="8px" h="8px" borderRadius="full" bg="blue.400" /><Text fontSize="11px" color="theme.textSecondary">Published</Text></HStack>
        </HStack>
      </Box>
    </Box>
  );
}

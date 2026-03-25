"use client";

// components/workbench/WorkbenchCurationWorkArea.tsx
//
// Four-lane curation workbench.
// Lane 1 — Raw (Pieces)        Lane 2 — Working Set       Lane 3 — Craft      Lane 4 — Published
//
// Click a lane header to focus it (85% width). Click again or click another lane to refocus.
// Default layout: 25/25/25/25.

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Collapsible,
  HStack,
  Input,
  Separator,
  Spinner,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import * as writingApi from "@mixtape/api/clients/writing/writingApi";
import type { FlattenedPlacement } from "@mixtape/core/types/writingTypes";
import WritingEditorWrapper from "@/components/writing/WritingEditorWrapper";
import {
  IconCheck,
  IconCirclePlus,
  IconEdit,
  IconGripVertical,
  IconInbox,
  IconPlus,
  IconSend,
  IconStack2,
  IconX,
} from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useCurationWorkbench } from "@mixtape/api/hooks/workbench/useCurationWorkbench";
import type {
  Piece,
  WorkingItemSummary,
  GateFailure,
  WorkingItemMembership,
} from "@mixtape/api/hooks/workbench/useCurationWorkbench";

// ============================================================================
// Lane layout logic
// ============================================================================

type LaneKey = 1 | 2 | 3 | 4;

function getLaneWidths(focused: LaneKey | null): Record<LaneKey, string> {
  if (!focused) return { 1: "25%", 2: "25%", 3: "25%", 4: "25%" };
  return {
    1: focused === 1 ? "85%" : "5%",
    2: focused === 2 ? "85%" : "5%",
    3: focused === 3 ? "85%" : "5%",
    4: focused === 4 ? "85%" : "5%",
  };
}

// ============================================================================
// Piece type badge colours
// ============================================================================

const TYPE_COLOURS: Record<string, string> = {
  seed: "green",
  leaf: "teal",
  milldraft: "blue",
  feedback: "orange",
  working_document: "purple",
};

const TYPE_LABELS: Record<string, string> = {
  seed: "Seed",
  leaf: "Leaf",
  milldraft: "Mill",
  feedback: "Feedback",
  working_document: "Draft",
};

// ============================================================================
// Sub-components
// ============================================================================

function LaneHeader({
  label,
  icon,
  count,
  focused,
  onFocus,
}: {
  label: string;
  icon: React.ReactNode;
  count?: number;
  focused: boolean;
  onFocus: () => void;
}) {
  const bg = useColorModeValue("gray.100", "gray.700");
  const activeBg = useColorModeValue("blue.50", "blue.900");

  return (
    <HStack
      px={3}
      py={2}
      bg={focused ? activeBg : bg}
      cursor="pointer"
      onClick={onFocus}
      borderBottomWidth="1px"
      gap={2}
      flexShrink={0}
    >
      {icon}
      <Text fontWeight="semibold" fontSize="sm" flex={1} lineClamp={1}>
        {label}
      </Text>
      {count !== undefined && (
        <Badge size="sm" colorPalette="gray">{count}</Badge>
      )}
    </HStack>
  );
}

function PieceCard({
  piece,
  selected,
  onSelect,
  onAddToItem,
  hasActiveItem,
  isInActiveItem,
}: {
  piece: Piece;
  selected: boolean;
  onSelect: () => void;
  onAddToItem: () => void;
  hasActiveItem: boolean;
  isInActiveItem: boolean;
}) {
  const borderColor = useColorModeValue(
    isInActiveItem ? "green.300" : selected ? "blue.400" : "gray.200",
    isInActiveItem ? "green.600" : selected ? "blue.400" : "gray.600",
  );
  const bg = useColorModeValue(
    isInActiveItem ? "green.50" : selected ? "blue.50" : "white",
    isInActiveItem ? "green.950" : selected ? "blue.900" : "gray.800",
  );

  return (
    <Card.Root
      size="sm"
      borderWidth="1px"
      borderColor={borderColor}
      bg={bg}
      cursor="pointer"
      onClick={onSelect}
    >
      <Card.Body p={3} gap={1}>
        <HStack justify="space-between" align="flex-start">
          <Badge colorPalette={TYPE_COLOURS[piece.type_label] || "gray"} size="xs">
            {TYPE_LABELS[piece.type_label] || piece.type_label}
          </Badge>
          {isInActiveItem ? (
            <Badge colorPalette="green" size="xs" variant="subtle">
              <IconCheck size={10} /> In WI
            </Badge>
          ) : piece.working_item_references.length > 0 && (
            <Badge colorPalette="gray" size="xs" variant="outline">
              in {piece.working_item_references.length} item{piece.working_item_references.length > 1 ? "s" : ""}
            </Badge>
          )}
        </HStack>
        {piece.title && (
          <Text fontSize="sm" fontWeight="medium" lineClamp={1}>{piece.title}</Text>
        )}
        <Text fontSize="xs" color="gray.500" lineClamp={2}>
          {piece.excerpt || "(no content)"}
        </Text>
        {hasActiveItem && !isInActiveItem && (
          <Button
            size="xs"
            variant="ghost"
            colorPalette="blue"
            mt={1}
            onClick={(e) => { e.stopPropagation(); onAddToItem(); }}
          >
            <IconPlus size={12} />
            Add to working item
          </Button>
        )}
      </Card.Body>
    </Card.Root>
  );
}

function SortableMembershipRow({
  membership,
  borderColor,
  onRemove,
}: {
  membership: WorkingItemMembership;
  borderColor: string;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: membership.id,
    disabled: false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <HStack
      ref={setNodeRef}
      style={style}
      gap={2}
      p={1}
      borderRadius="sm"
      borderWidth="1px"
      borderColor={isDragging ? "blue.300" : borderColor}
      bg={isDragging ? "blue.50" : undefined}
    >
      <Box
        {...attributes}
        {...listeners}
        cursor="grab"
        color="gray.400"
        _hover={{ color: "gray.600" }}
        _active={{ cursor: "grabbing" }}
      >
        <IconGripVertical size={14} />
      </Box>
      <Badge colorPalette={TYPE_COLOURS[membership.type_label] || "gray"} size="xs">
        {TYPE_LABELS[membership.type_label] || membership.type_label}
      </Badge>
      <Text fontSize="xs" flex={1} lineClamp={1} color="gray.600">
        {membership.content_snapshot.slice(0, 60) || "(empty)"}
      </Text>
      <Button
        size="xs"
        variant="ghost"
        colorPalette="red"
        onClick={onRemove}
      >
        <IconX size={12} />
      </Button>
    </HStack>
  );
}

function WorkingItemCard({
  item,
  active,
  onClick,
  onDoubleClick,
}: {
  item: WorkingItemSummary;
  active: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}) {
  const bg = useColorModeValue(active ? "blue.50" : "white", active ? "blue.900" : "gray.800");
  const borderColor = useColorModeValue(active ? "blue.400" : "gray.200", active ? "blue.400" : "gray.600");

  const statusColour: Record<string, string> = {
    assembling: "yellow",
    ready: "green",
    promoted: "blue",
    parked: "gray",
    archived: "red",
  };

  return (
    <Card.Root
      size="sm"
      borderWidth="1px"
      borderColor={borderColor}
      bg={bg}
      cursor="pointer"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <Card.Body p={3} gap={1}>
        <HStack justify="space-between">
          <Badge colorPalette={statusColour[item.status] || "gray"} size="xs">
            {item.status}
          </Badge>
          <Text fontSize="xs" color="gray.400">{item.membership_count} piece{item.membership_count !== 1 ? "s" : ""}</Text>
        </HStack>
        <Text fontSize="sm" fontWeight="medium" lineClamp={2}>
          {item.title || "(untitled)"}
        </Text>
        {item.last_saved_at && (
          <Text fontSize="xs" color="gray.400">
            Saved {new Date(item.last_saved_at).toLocaleTimeString()}
          </Text>
        )}
      </Card.Body>
    </Card.Root>
  );
}

function GateFailureList({ failures }: { failures: GateFailure[] }) {
  return (
    <VStack align="stretch" gap={1}>
      {failures.map(f => (
        <HStack key={f.gate} gap={2}>
          <Badge colorPalette={f.hard ? "red" : "orange"} size="xs">
            {f.hard ? "Required" : "Warning"}
          </Badge>
          <Text fontSize="xs">{f.message}</Text>
        </HStack>
      ))}
    </VStack>
  );
}

// ============================================================================
// Main component
// ============================================================================

export default function WorkbenchCurationWorkArea({
  groupSlug,
  groupId,
  groupTitle,
}: {
  groupSlug: string;
  groupId: string;
  groupTitle: string;
}) {
  const wb = useCurationWorkbench(groupSlug);

  const [focusedLane, setFocusedLane] = useState<LaneKey | null>(null);
  const [selectedPieces, setSelectedPieces] = useState<Set<string>>(new Set());
  const [pieceSearch, setPieceSearch] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [gateFailures, setGateFailures] = useState<GateFailure[]>([]);
  const [promoteSuccess, setPromoteSuccess] = useState<string | null>(null);
  const [activeDraftPieceId, setActiveDraftPieceId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [mergeWarning, setMergeWarning] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [orderedMemberships, setOrderedMemberships] = useState<WorkingItemMembership[]>([]);
  const [lastMergedMembershipSignature, setLastMergedMembershipSignature] = useState<string | null>(null);
  const [sourcePiecesOpen, setSourcePiecesOpen] = useState(true);
  const membershipSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Sync editable fields when the active item changes
  useEffect(() => {
    setTitleDraft(wb.activeItem?.title ?? "");
    const rawBody = wb.activeItem?.body_json as { text?: string } | undefined;
    setBodyText(rawBody?.text ?? "");
    setMergeWarning(false);
    setMergeError(null);
    setOrderedMemberships(wb.activeItem?.memberships ?? []);
    setLastMergedMembershipSignature(null);
    setSourcePiecesOpen(true);
  }, [wb.activeItem?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setOrderedMemberships(wb.activeItem?.memberships ?? []);
  }, [wb.activeItem?.memberships]);

  const executeMerge = useCallback(async () => {
    if (!wb.activeItem) return;
    setMergeError(null);
    const membershipSignature = orderedMemberships.map((membership) => membership.id).join(",");
    try {
      await wb.reorderMemberships(
        wb.activeItem.id,
        orderedMemberships.map((membership) => membership.id),
      );
      const merged = orderedMemberships
        .map(m => m.content_snapshot.trim())
        .filter(Boolean)
        .join("\n\n");
      setBodyText(merged);
      setMergeWarning(false);
      setSourcePiecesOpen(false);
      setLastMergedMembershipSignature(membershipSignature);
      await wb.autosave(wb.activeItem.id, {
        body_json: { text: merged },
        mark_body_editing_started: false,
      });
    } catch (err) {
      setMergeError(err instanceof Error ? err.message : "Failed to merge pieces into body.");
    }
  }, [orderedMemberships, wb]);

  const handleMerge = useCallback(() => {
    if (wb.activeItem?.body_editing_started) {
      setMergeWarning(true);
    } else {
      void executeMerge();
    }
  }, [executeMerge, wb.activeItem?.body_editing_started]);

  const handleMembershipDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrderedMemberships((prev) => {
      const oldIndex = prev.findIndex((membership) => membership.id === String(active.id));
      const newIndex = prev.findIndex((membership) => membership.id === String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  // Set of piece IDs already in the active working item (for L1 indicator)
  const activeItemPieceIds = useMemo(
    () => new Set(orderedMemberships.map(m => m.piece_object_id)),
    [orderedMemberships],
  );

  const hasReorderedMemberships = useMemo(() => {
    const sourceMemberships = wb.activeItem?.memberships ?? [];
    if (sourceMemberships.length !== orderedMemberships.length) return false;
    return sourceMemberships.some((membership, index) => membership.id !== orderedMemberships[index]?.id);
  }, [orderedMemberships, wb.activeItem?.memberships]);

  const membershipOrderSignature = useMemo(
    () => orderedMemberships.map((membership) => membership.id).join(","),
    [orderedMemberships],
  );

  const alreadyMergedCurrentOrder = Boolean(
    lastMergedMembershipSignature &&
      membershipOrderSignature === lastMergedMembershipSignature,
  );

  // Lane 4 — published placements
  const {
    data: placements = [],
    isLoading: placementsLoading,
    refetch: refetchPlacements,
  } = useQuery<FlattenedPlacement[]>({
    queryKey: ["writing", "placements", "group", groupSlug],
    queryFn: () => writingApi.fetchPlacements("group", groupSlug),
    enabled: !!groupSlug,
  });

  const widths = getLaneWidths(focusedLane);

  const handleLaneFocus = useCallback((lane: LaneKey) => {
    setFocusedLane(prev => prev === lane ? null : lane);
  }, []);

  const togglePieceSelect = useCallback((id: string) => {
    setSelectedPieces(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const filteredPieces = pieceSearch
    ? wb.pieces.filter(p =>
        p.excerpt.toLowerCase().includes(pieceSearch.toLowerCase()) ||
        p.title.toLowerCase().includes(pieceSearch.toLowerCase())
      )
    : wb.pieces;

  const handleCreateItem = useCallback(async () => {
    const selected = wb.pieces.filter(p => selectedPieces.has(p.id));
    setCreating(true);
    try {
      const item = await wb.createWorkingItem(newItemTitle, selected);
      setSelectedPieces(new Set());
      setNewItemTitle("");
      await wb.openWorkingItem(item.id);
      setFocusedLane(2);
    } finally {
      setCreating(false);
    }
  }, [wb, selectedPieces, newItemTitle]);

  const handlePromote = useCallback(async (override = false) => {
    if (!wb.activeItem) return;
    setPromoting(true);
    setGateFailures([]);
    setPromoteSuccess(null);
    try {
      const result = await wb.promoteWorkingItem(wb.activeItem.id, override);
      setPromoteSuccess(result.writing_piece_id);
      setActiveDraftPieceId(result.writing_piece_id);
      setGateFailures(result.gate_warnings);
      setFocusedLane(3);
      // Refresh Lane 4 placements in background
      refetchPlacements();
    } catch (err: unknown) {
      const failures: GateFailure[] = (err as { response?: { data?: { failures?: GateFailure[] } } })?.response?.data?.failures || [];
      if (failures.length) {
        setGateFailures(failures);
      }
    } finally {
      setPromoting(false);
    }
  }, [wb, refetchPlacements]);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const laneBg = useColorModeValue("gray.50", "gray.900");
  const mergeWarningBg = useColorModeValue("orange.50", "orange.900");

  return (
    <Box w="full" h="full" overflow="hidden">
      {/* Error banner */}
      {wb.error && (
        <Alert.Root status="error" mb={2}>
          <Alert.Indicator />
          <Alert.Title>{wb.error}</Alert.Title>
          <Button size="xs" variant="ghost" ml="auto" onClick={wb.clearError}><IconX size={14} /></Button>
        </Alert.Root>
      )}

      {/* Four-lane shell */}
      <HStack
        align="stretch"
        h="full"
        gap={0}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        overflow="hidden"
      >

        {/* ================================================================
            Lane 1 — Raw
        ================================================================ */}
        <Box
          w={widths[1]}
          minW={focusedLane && focusedLane !== 1 ? "40px" : "180px"}
          transition="width 0.2s ease"
          borderRightWidth="1px"
          borderColor={borderColor}
          display="flex"
          flexDir="column"
          bg={laneBg}
          overflow="hidden"
        >
          <LaneHeader
            label="Raw"
            icon={<IconInbox size={16} />}
            count={wb.pieces.length}
            focused={focusedLane === 1}
            onFocus={() => handleLaneFocus(1)}
          />

          {focusedLane !== 1 && focusedLane !== null ? (
            // Collapsed state — rotated label
            <Box flex={1} display="flex" alignItems="center" justifyContent="center">
              <Text
                fontSize="xs"
                color="gray.400"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                Raw
              </Text>
            </Box>
          ) : (
            <VStack flex={1} overflow="hidden" p={2} gap={2} align="stretch">
              {/* Search */}
              <Input
                size="sm"
                placeholder="Search pieces..."
                value={pieceSearch}
                onChange={e => setPieceSearch(e.target.value)}
              />

              {/* Selection summary + create CTA */}
              {selectedPieces.size > 0 && (
                <Box>
                  <Input
                    size="sm"
                    placeholder="Working item title..."
                    value={newItemTitle}
                    onChange={e => setNewItemTitle(e.target.value)}
                    mb={1}
                  />
                  <Button
                    size="sm"
                    colorPalette="blue"
                    w="full"
                    loading={creating}
                    onClick={handleCreateItem}
                  >
                    <IconCirclePlus size={14} />
                    Create working item ({selectedPieces.size})
                  </Button>
                </Box>
              )}

              {/* Piece list */}
              <VStack flex={1} overflowY="auto" gap={2} align="stretch">
                {wb.piecesLoading && <Spinner size="sm" mx="auto" />}
                {wb.piecesError && (
                  <Text fontSize="xs" color="red.500">{wb.piecesError}</Text>
                )}
                {!wb.piecesLoading && filteredPieces.length === 0 && (
                  <Text fontSize="xs" color="gray.400" textAlign="center" py={4}>
                    No raw pieces yet.
                  </Text>
                )}
                {filteredPieces.map(piece => (
                  <PieceCard
                    key={piece.id}
                    piece={piece}
                    selected={selectedPieces.has(piece.id)}
                    onSelect={() => togglePieceSelect(piece.id)}
                    onAddToItem={() => wb.activeItem && wb.addPieceToItem(wb.activeItem.id, piece)}
                    hasActiveItem={!!wb.activeItem}
                    isInActiveItem={activeItemPieceIds.has(piece.id)}
                  />
                ))}
              </VStack>
            </VStack>
          )}
        </Box>

        {/* ================================================================
            Lane 2 — Working Set
        ================================================================ */}
        <Box
          w={widths[2]}
          minW={focusedLane && focusedLane !== 2 ? "40px" : "180px"}
          transition="width 0.2s ease"
          borderRightWidth="1px"
          borderColor={borderColor}
          display="flex"
          flexDir="column"
          bg={laneBg}
          overflow="hidden"
        >
          <LaneHeader
            label="Working Set"
            icon={<IconStack2 size={16} />}
            count={wb.workingItems.length}
            focused={focusedLane === 2}
            onFocus={() => handleLaneFocus(2)}
          />

          {focusedLane !== 2 && focusedLane !== null ? (
            <Box flex={1} display="flex" alignItems="center" justifyContent="center">
              <Text
                fontSize="xs"
                color="gray.400"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                Working Set
              </Text>
            </Box>
          ) : (
            <HStack flex={1} overflow="hidden" align="stretch" gap={0}>
              {/* Working item list */}
              <VStack
                w={wb.activeItem ? "220px" : "full"}
                flexShrink={0}
                overflowY="auto"
                p={2}
                gap={2}
                align="stretch"
                borderRightWidth={wb.activeItem ? "1px" : "0"}
                borderColor={borderColor}
              >
                {wb.workingItemsLoading && <Spinner size="sm" mx="auto" />}
                {!wb.workingItemsLoading && wb.workingItems.length === 0 && (
                  <Text fontSize="xs" color="gray.400" textAlign="center" py={4}>
                    No working items yet.<br />Select pieces in Lane 1 to create one.
                  </Text>
                )}
                {wb.workingItems.map(item => (
                  <WorkingItemCard
                    key={item.id}
                    item={item}
                    active={wb.activeItem?.id === item.id}
                    onClick={() => wb.openWorkingItem(item.id)}
                    onDoubleClick={() => setFocusedLane(2)}
                  />
                ))}
              </VStack>

              {/* Active working item editor */}
              {wb.activeItemLoading && (
                <Box flex={1} display="flex" alignItems="center" justifyContent="center">
                  <Spinner />
                </Box>
              )}
              {wb.activeItem && !wb.activeItemLoading && (
                <VStack flex={1} overflow="hidden" p={3} gap={3} align="stretch">
                  <HStack justify="space-between" gap={2}>
                    <Input
                      size="sm"
                      fontWeight="semibold"
                      placeholder="Working item title…"
                      value={titleDraft}
                      onChange={e => setTitleDraft(e.target.value)}
                      onBlur={() => {
                        if (wb.activeItem && titleDraft !== wb.activeItem.title) {
                          wb.autosave(wb.activeItem.id, { title: titleDraft });
                        }
                      }}
                      disabled={wb.activeItem.status === "promoted"}
                      flex={1}
                    />
                    <Button size="xs" variant="ghost" flexShrink={0} onClick={wb.closeWorkingItem}>
                      <IconX size={14} />
                    </Button>
                  </HStack>

                  {/* Status selector */}
                  <HStack gap={1} flexWrap="wrap">
                    {(["assembling", "ready", "parked"] as const).map(s => (
                      <Button
                        key={s}
                        size="xs"
                        variant={wb.activeItem!.status === s ? "solid" : "outline"}
                        colorPalette={s === "ready" ? "green" : s === "parked" ? "gray" : "yellow"}
                        onClick={() => wb.updateWorkingItem(wb.activeItem!.id, { status: s })}
                        disabled={wb.activeItem!.status === "promoted"}
                      >
                        {s}
                      </Button>
                    ))}
                  </HStack>

                  {/* Source pieces */}
                  <Box>
                    <Collapsible.Root
                      open={sourcePiecesOpen}
                      onOpenChange={({ open }) => setSourcePiecesOpen(open)}
                    >
                      <Collapsible.Trigger asChild>
                        <Button variant="outline" size="xs" width="full" justifyContent="space-between" mb={1}>
                          <Text fontSize="xs" fontWeight="semibold" color="gray.500">
                            SOURCE PIECES ({orderedMemberships.length})
                          </Text>
                          <Collapsible.Indicator />
                        </Button>
                      </Collapsible.Trigger>
                      <Collapsible.Content>
                        <Box pt={1}>
                          {mergeError && (
                            <Alert.Root status="error" mb={2}>
                              <Alert.Indicator />
                              <Alert.Title>{mergeError}</Alert.Title>
                            </Alert.Root>
                          )}
                          <DndContext
                            sensors={membershipSensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleMembershipDragEnd}
                          >
                            <SortableContext
                              items={orderedMemberships.map((membership) => membership.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <VStack gap={1} align="stretch">
                                {orderedMemberships.map((membership) => (
                                  <SortableMembershipRow
                                    key={membership.id}
                                    membership={membership}
                                    borderColor={borderColor}
                                    onRemove={() => wb.removePieceFromItem(wb.activeItem!.id, membership.id)}
                                  />
                                ))}
                              </VStack>
                            </SortableContext>
                          </DndContext>
                        </Box>
                      </Collapsible.Content>
                    </Collapsible.Root>
                  </Box>

                  {/* Merge action */}
                  {orderedMemberships.length > 0 && wb.activeItem.status !== "promoted" && (
                    <Box>
                      {mergeWarning ? (
                        <Box
                          p={2}
                          borderRadius="sm"
                          borderWidth="1px"
                          borderColor="orange.300"
                          bg={mergeWarningBg}
                        >
                          <Text fontSize="xs" color="orange.700" mb={2}>
                            This will overwrite your current body copy. Continue?
                          </Text>
                          <HStack gap={2}>
                            <Button size="xs" colorPalette="orange" onClick={() => void executeMerge()}>
                              Yes, overwrite
                            </Button>
                            <Button size="xs" variant="ghost" onClick={() => setMergeWarning(false)}>
                              Cancel
                            </Button>
                          </HStack>
                        </Box>
                      ) : (
                        <Button
                          size="xs"
                          variant="outline"
                          colorPalette="gray"
                          w="full"
                          onClick={handleMerge}
                          disabled={alreadyMergedCurrentOrder}
                        >
                          {alreadyMergedCurrentOrder
                            ? "Already merged"
                            : hasReorderedMemberships
                            ? "For new order to take effect, Merge pieces into body."
                            : "Merge pieces into body"}
                        </Button>
                      )}
                    </Box>
                  )}

                  {/* Body editor */}
                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={1}>
                      BODY
                    </Text>
                    <Textarea
                      size="sm"
                      placeholder="Assemble your working copy here…"
                      value={bodyText}
                      rows={6}
                      resize="vertical"
                      onChange={e => setBodyText(e.target.value)}
                      onBlur={() => {
                        if (wb.activeItem) {
                          const current = (wb.activeItem.body_json as { text?: string } | undefined)?.text ?? "";
                          if (bodyText !== current) {
                            wb.autosave(wb.activeItem.id, { body_json: { text: bodyText } });
                          }
                        }
                      }}
                      disabled={wb.activeItem.status === "promoted"}
                    />
                  </Box>

                  <Separator />

                  {/* Promote section */}
                  <Box>
                    <Text fontSize="xs" fontWeight="semibold" color="gray.500" mb={2}>PROMOTE TO DRAFT</Text>

                    {promoteSuccess && (
                      <Alert.Root status="success" size="sm" mb={2}>
                        <Alert.Indicator />
                        <Alert.Title>Promoted! WritingPiece created.</Alert.Title>
                      </Alert.Root>
                    )}

                    {gateFailures.length > 0 && (
                      <Box mb={2}>
                        <GateFailureList failures={gateFailures} />
                        {gateFailures.every(f => !f.hard) && (
                          <Button
                            size="xs"
                            colorPalette="orange"
                            mt={2}
                            loading={promoting}
                            onClick={() => handlePromote(true)}
                          >
                            Override warnings and promote
                          </Button>
                        )}
                      </Box>
                    )}

                    {!promoteSuccess && wb.activeItem.status !== "promoted" && (
                      <Button
                        size="sm"
                        colorPalette="green"
                        disabled={wb.activeItem.status !== "ready"}
                        loading={promoting}
                        onClick={() => handlePromote(false)}
                        w="full"
                      >
                        <IconSend size={14} />
                        Promote to Draft
                      </Button>
                    )}
                    {wb.activeItem.status !== "ready" && wb.activeItem.status !== "promoted" && (
                      <Text fontSize="xs" color="gray.400" mt={1}>
                        Set status to "ready" to enable promotion.
                      </Text>
                    )}
                    {wb.activeItem.status === "promoted" && (
                      <Badge colorPalette="blue">Promoted</Badge>
                    )}
                  </Box>
                </VStack>
              )}
            </HStack>
          )}
        </Box>

        {/* ================================================================
            Lane 3 — Craft
        ================================================================ */}
        <Box
          w={widths[3]}
          minW={focusedLane && focusedLane !== 3 ? "40px" : "180px"}
          transition="width 0.2s ease"
          borderRightWidth="1px"
          borderColor={borderColor}
          display="flex"
          flexDir="column"
          bg={laneBg}
          overflow="hidden"
        >
          <LaneHeader
            label="Craft"
            icon={<IconEdit size={16} />}
            focused={focusedLane === 3}
            onFocus={() => handleLaneFocus(3)}
          />
          {focusedLane !== 3 && focusedLane !== null ? (
            <Box flex={1} display="flex" alignItems="center" justifyContent="center">
              <Text
                fontSize="xs"
                color="gray.400"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                Craft
              </Text>
            </Box>
          ) : activeDraftPieceId ? (
            <Box flex={1} overflow="hidden" display="flex" flexDir="column">
              <HStack px={3} py={1} borderBottomWidth="1px" borderColor={borderColor} justify="space-between">
                <Text fontSize="xs" color="gray.500">Editing promoted draft</Text>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setActiveDraftPieceId(null)}
                >
                  <IconX size={12} />
                  Close
                </Button>
              </HStack>
              <Box flex={1} overflow="hidden">
                <WritingEditorWrapper
                  sponsor={{
                    type: "group",
                    id: groupId,
                    slug: groupSlug,
                    displayName: groupTitle,
                  }}
                  writingKind="post"
                  pieceId={activeDraftPieceId}
                  onPublished={() => {
                    refetchPlacements();
                    setActiveDraftPieceId(null);
                    setFocusedLane(4);
                  }}
                  onBack={() => setActiveDraftPieceId(null)}
                />
              </Box>
            </Box>
          ) : (
            <Box flex={1} p={3} display="flex" alignItems="center" justifyContent="center">
              <Text fontSize="sm" color="gray.400" textAlign="center">
                Promote a working item to open the editor here.
              </Text>
            </Box>
          )}
        </Box>

        {/* ================================================================
            Lane 4 — Published
        ================================================================ */}
        <Box
          w={widths[4]}
          minW={focusedLane && focusedLane !== 4 ? "40px" : "180px"}
          transition="width 0.2s ease"
          display="flex"
          flexDir="column"
          bg={laneBg}
          overflow="hidden"
        >
          <LaneHeader
            label="Published"
            icon={<IconCheck size={16} />}
            count={placements.length}
            focused={focusedLane === 4}
            onFocus={() => handleLaneFocus(4)}
          />
          {focusedLane !== 4 && focusedLane !== null ? (
            <Box flex={1} display="flex" alignItems="center" justifyContent="center">
              <Text
                fontSize="xs"
                color="gray.400"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                Published
              </Text>
            </Box>
          ) : (
            <VStack flex={1} overflowY="auto" p={2} gap={2} align="stretch">
              {placementsLoading && <Spinner size="sm" mx="auto" />}
              {!placementsLoading && placements.length === 0 && (
                <Text fontSize="xs" color="gray.400" textAlign="center" py={4}>
                  No published pieces yet.
                </Text>
              )}
              {placements.map(p => (
                <Card.Root
                  key={p.id}
                  size="sm"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Card.Body p={3} gap={1}>
                    <Text fontSize="sm" fontWeight="medium" lineClamp={2}>
                      {p.piece_title || "(untitled)"}
                    </Text>
                    {p.display?.excerpt && (
                      <Text fontSize="xs" color="gray.500" lineClamp={2}>
                        {p.display.excerpt}
                      </Text>
                    )}
                    <Text fontSize="xs" color="gray.400">
                      {new Date(p.published_at).toLocaleDateString()}
                    </Text>
                  </Card.Body>
                </Card.Root>
              ))}
            </VStack>
          )}
        </Box>

      </HStack>
    </Box>
  );
}

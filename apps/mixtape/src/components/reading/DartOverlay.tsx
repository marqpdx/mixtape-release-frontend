"use client";

import {
  useState,
  useEffect,
  useCallback,
  RefObject,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Text,
  VStack,
  HStack,
  IconButton,
  Textarea,
  Button,
} from "@chakra-ui/react";
import {
  IconBookmark,
  IconBookmarkFilled,
  IconTrash,
  IconX,
  IconTarget,
} from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import {
  fetchDarts,
  createDart,
  updateDart,
  deleteDart,
} from "@mixtape/api/clients/reading/readingApi";
import type { Dart } from "@mixtape/api/clients/reading/readingApi";


// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Find the top offset (relative to container) of the first occurrence of
 * `text` in the container's DOM using TreeWalker + Range.
 * Returns null if not found.
 */
function findTextTop(container: HTMLElement, text: string): number | null {
  if (!text) return null;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    nodes.push(node as Text);
  }

  const full = nodes.map((n) => n.textContent ?? "").join("");
  const idx = full.indexOf(text);
  if (idx === -1) return null;

  // Walk nodes again to find which node contains offset idx
  let accumulated = 0;
  for (const textNode of nodes) {
    const len = textNode.textContent?.length ?? 0;
    if (accumulated + len > idx) {
      const localOffset = idx - accumulated;
      const range = document.createRange();
      range.setStart(textNode, localOffset);
      range.setEnd(textNode, Math.min(localOffset + text.length, len));
      const rect = range.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      return rect.top - containerRect.top + container.scrollTop;
    }
    accumulated += len;
  }
  return null;
}

function getSelectionOffsets(container: HTMLElement): {
  text: string;
  start: number;
  end: number;
} | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const range = sel.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;
  const text = sel.toString().trim();
  if (!text) return null;

  // Compute character offsets relative to container plain text
  const preRange = document.createRange();
  preRange.selectNodeContents(container);
  preRange.setEnd(range.startContainer, range.startOffset);
  const start = preRange.toString().length;
  return { text, start, end: start + text.length };
}


// ---------------------------------------------------------------------------
// Margin indicator dot
// ---------------------------------------------------------------------------

function DartIndicator({
  top,
  dart,
  isActive,
  onClick,
}: {
  top: number;
  dart: Dart;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      position="absolute"
      left="-24px"
      top={`${top}px`}
      transform="translateY(-50%)"
      w="14px"
      h="14px"
      borderRadius="full"
      bg={dart.is_flagged ? "orange.400" : isActive ? "blue.500" : "blue.300"}
      cursor="pointer"
      onClick={onClick}
      title={dart.note_text || "Dart"}
      _hover={{ bg: "blue.500", transform: "translateY(-50%) scale(1.2)" }}
      transition="all 0.15s"
      zIndex={10}
    />
  );
}


// ---------------------------------------------------------------------------
// Dart panel (right sidebar)
// ---------------------------------------------------------------------------

function DartPanel({
  darts,
  activeDartId,
  onActivate,
  onClose,
  artifactId,
  isOwn,
}: {
  darts: Dart[];
  activeDartId: string | null;
  onActivate: (id: string | null) => void;
  onClose: () => void;
  artifactId: string;
  isOwn: boolean;
}) {
  const queryClient = useQueryClient();
  const panelBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");
  const activeBg = useColorModeValue("blue.50", "blue.900");
  const hoverBg = useColorModeValue("gray.50", "gray.750");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");

  const updateMutation = useMutation({
    mutationFn: ({ id, note_text }: { id: string; note_text: string }) =>
      updateDart(id, { note_text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["darts", artifactId] });
      setEditingId(null);
    },
  });

  const flagMutation = useMutation({
    mutationFn: ({ id, is_flagged }: { id: string; is_flagged: boolean }) =>
      updateDart(id, { is_flagged }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["darts", artifactId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["darts", artifactId] });
      onActivate(null);
    },
  });

  return (
    <Box
      position="fixed"
      right={0}
      top={0}
      bottom={0}
      w="300px"
      bg={panelBg}
      borderLeftWidth="1px"
      borderColor={borderColor}
      overflowY="auto"
      zIndex={100}
      boxShadow="-4px 0 12px rgba(0,0,0,0.08)"
    >
      <HStack
        justify="space-between"
        px={4}
        py={3}
        borderBottomWidth="1px"
        borderColor={borderColor}
        position="sticky"
        top={0}
        bg={panelBg}
        zIndex={1}
      >
        <HStack gap={2}>
          <IconTarget size={16} />
          <Text fontWeight="semibold" fontSize="sm">
            Darts ({darts.length})
          </Text>
        </HStack>
        <IconButton
          aria-label="Close darts"
          size="sm"
          variant="ghost"
          onClick={onClose}
        >
          <IconX size={16} />
        </IconButton>
      </HStack>

      {darts.length === 0 && (
        <Box px={4} py={6}>
          <Text fontSize="sm" color={mutedColor}>
            No darts yet. Select text in the article to add one.
          </Text>
        </Box>
      )}

      <VStack gap={0} align="stretch">
        {darts.map((dart) => {
          const isActive = activeDartId === dart.id;
          return (
            <Box
              key={dart.id}
              px={4}
              py={3}
              borderBottomWidth="1px"
              borderColor={borderColor}
              bg={isActive ? activeBg : "transparent"}
              cursor="pointer"
              onClick={() => onActivate(isActive ? null : dart.id)}
              _hover={{ bg: isActive ? activeBg : hoverBg }}
            >
              {dart.selected_text && (
                <Text
                  fontSize="xs"
                  color={mutedColor}
                  fontStyle="italic"
                  mb={1}
                  lineClamp={2}
                  borderLeftWidth="2px"
                  borderColor="var(--theme-accent)"
                  pl={2}
                >
                  &ldquo;{dart.selected_text}&rdquo;
                </Text>
              )}
              {!dart.selected_text && (
                <Text fontSize="xs" color={mutedColor} mb={1}>
                  Document-level dart
                </Text>
              )}

              {editingId === dart.id ? (
                <Box onClick={(e) => e.stopPropagation()}>
                  <Textarea
                    size="sm"
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    rows={3}
                    mb={2}
                    autoFocus
                  />
                  <HStack gap={2}>
                    <Button
                      size="xs"
                      colorPalette="blue"
                      loading={updateMutation.isPending}
                      onClick={() => updateMutation.mutate({ id: dart.id, note_text: editNote })}
                    >
                      Save
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </HStack>
                </Box>
              ) : (
                <Text
                  fontSize="sm"
                  color={dart.note_text ? undefined : mutedColor}
                  fontStyle={dart.note_text ? "normal" : "italic"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(dart.id);
                    setEditNote(dart.note_text);
                  }}
                >
                  {dart.note_text || "Add a note…"}
                </Text>
              )}

              {isOwn && (
                <HStack gap={1} mt={2} justify="flex-end" onClick={(e) => e.stopPropagation()}>
                  <IconButton
                    aria-label={dart.is_flagged ? "Unflag" : "Flag"}
                    size="xs"
                    variant="ghost"
                    color={dart.is_flagged ? "orange.400" : mutedColor}
                    loading={flagMutation.isPending}
                    onClick={() => flagMutation.mutate({ id: dart.id, is_flagged: !dart.is_flagged })}
                  >
                    {dart.is_flagged ? <IconBookmarkFilled size={14} /> : <IconBookmark size={14} />}
                  </IconButton>
                  <IconButton
                    aria-label="Delete dart"
                    size="xs"
                    variant="ghost"
                    color="red.400"
                    loading={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(dart.id)}
                  >
                    <IconTrash size={14} />
                  </IconButton>
                </HStack>
              )}
            </Box>
          );
        })}
      </VStack>
    </Box>
  );
}


// ---------------------------------------------------------------------------
// Floating "Add Dart" button (appears on text selection)
// ---------------------------------------------------------------------------

function SelectionButton({
  artifactId,
  containerRef,
  onCreated,
}: {
  artifactId: string;
  containerRef: RefObject<HTMLElement | null>;
  onCreated: (dart: Dart) => void;
}) {
  const queryClient = useQueryClient();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [pending, setPending] = useState<{
    text: string;
    start: number;
    end: number;
  } | null>(null);
  const [note, setNote] = useState("");
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: () =>
      createDart({
        artifact_id: artifactId,
        anchor_type: "selection",
        selected_text: pending!.text,
        anchor_start_offset: pending!.start,
        anchor_end_offset: pending!.end,
        note_text: note,
      }),
    onSuccess: (dart) => {
      queryClient.invalidateQueries({ queryKey: ["darts", artifactId] });
      onCreated(dart);
      setPos(null);
      setPending(null);
      setNote("");
      setShowForm(false);
      window.getSelection()?.removeAllRanges();
    },
  });

  useEffect(() => {
    const handleMouseUp = () => {
      if (!containerRef.current) return;
      const result = getSelectionOffsets(containerRef.current);
      if (!result) {
        setPos(null);
        setPending(null);
        setShowForm(false);
        return;
      }
      const sel = window.getSelection()!;
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setPending(result);
      setPos({ x: rect.left + rect.width / 2, y: rect.top - 8 });
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [containerRef]);

  if (!pos || !pending) return null;

  return (
    <Box
      position="fixed"
      left={`${pos.x}px`}
      top={`${pos.y}px`}
      transform="translate(-50%, -100%)"
      zIndex={200}
      bg="var(--theme-surface)"
      color="var(--theme-text)"
      borderRadius="md"
      boxShadow="lg"
      p={showForm ? 3 : 0}
      minW={showForm ? "220px" : undefined}
    >
      {!showForm ? (
        <Button
          size="xs"
          colorPalette="blue"
          onClick={() => setShowForm(true)}
        >
          <IconTarget size={12} />
          <Text ml={1}>Dart</Text>
        </Button>
      ) : (
        <VStack gap={2} align="stretch">
          <Text fontSize="xs" fontStyle="italic" color="var(--theme-text-secondary)" lineClamp={2}>
            &ldquo;{pending.text}&rdquo;
          </Text>
          <Textarea
            size="sm"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            bg="var(--theme-bg)"
            borderColor="var(--theme-border)"
            color="var(--theme-text)"
            _placeholder={{ color: "var(--theme-text-muted)" }}
            autoFocus
          />
          <HStack gap={2} justify="flex-end">
            <Button
              size="xs"
              variant="ghost"
              color="var(--theme-text-muted)"
              onClick={() => {
                setPos(null);
                setPending(null);
                setShowForm(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="xs"
              colorPalette="blue"
              loading={createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              Save
            </Button>
          </HStack>
        </VStack>
      )}
    </Box>
  );
}


// ---------------------------------------------------------------------------
// Main DartOverlay
// ---------------------------------------------------------------------------

export interface DartOverlayProps {
  artifactId: string;
  articleRef: RefObject<HTMLElement | null>;
  isOwn: boolean;
}

export function DartOverlay({ artifactId, articleRef, isOwn }: DartOverlayProps) {
  const [showPanel, setShowPanel] = useState(false);
  const [activeDartId, setActiveDartId] = useState<string | null>(null);
  const [indicators, setIndicators] = useState<Map<string, number>>(new Map());

  const { data: darts = [], isLoading } = useQuery({
    queryKey: ["darts", artifactId],
    queryFn: () => fetchDarts(artifactId),
    enabled: !!artifactId,
    staleTime: 60 * 1000,
  });

  const toggleBg = useColorModeValue("white", "gray.800");
  const toggleBorder = useColorModeValue("gray.200", "gray.600");

  // Recompute indicator positions when darts or article content changes
  const computeIndicators = useCallback(() => {
    if (!articleRef.current) return;
    const container = articleRef.current;
    const next = new Map<string, number>();
    for (const dart of darts) {
      if (dart.anchor_type === "document" || !dart.selected_text) {
        next.set(dart.id, 0);
      } else {
        const top = findTextTop(container, dart.selected_text);
        next.set(dart.id, top ?? 0);
      }
    }
    setIndicators(next);
  }, [darts, articleRef]);

  useEffect(() => {
    // Small delay to let TipTap finish rendering
    const t = setTimeout(computeIndicators, 200);
    return () => clearTimeout(t);
  }, [computeIndicators]);

  if (isLoading) return null;

  return (
    <>
      {/* Toggle button */}
      <Box
        position="fixed"
        bottom="24px"
        right={showPanel ? "316px" : "16px"}
        zIndex={150}
        transition="right 0.2s"
      >
        <Button
          size="sm"
          variant="outline"
          bg={toggleBg}
          borderColor={toggleBorder}
          boxShadow="md"
          onClick={() => setShowPanel((v) => !v)}
          gap={2}
        >
          <IconTarget size={16} />
          <Text>
            {showPanel ? "Hide" : "Darts"}
            {darts.length > 0 && ` (${darts.length})`}
          </Text>
        </Button>
      </Box>

      {/* Margin indicators — positioned relative to article container */}
      {darts.map((dart) => {
        const top = indicators.get(dart.id);
        if (top === undefined) return null;
        return (
          <DartIndicator
            key={dart.id}
            top={top}
            dart={dart}
            isActive={activeDartId === dart.id}
            onClick={() => {
              setActiveDartId(activeDartId === dart.id ? null : dart.id);
              setShowPanel(true);
            }}
          />
        );
      })}

      {/* Selection button — only for own pieces */}
      {isOwn && (
        <SelectionButton
          artifactId={artifactId}
          containerRef={articleRef}
          onCreated={(dart) => {
            setActiveDartId(dart.id);
            setShowPanel(true);
          }}
        />
      )}

      {/* Panel */}
      {showPanel && (
        <DartPanel
          darts={darts}
          activeDartId={activeDartId}
          onActivate={setActiveDartId}
          onClose={() => setShowPanel(false)}
          artifactId={artifactId}
          isOwn={isOwn}
        />
      )}
    </>
  );
}

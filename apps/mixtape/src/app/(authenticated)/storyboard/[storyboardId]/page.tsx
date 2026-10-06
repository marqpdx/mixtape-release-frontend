"use client";

import { use, useMemo, useRef, useState } from "react";
import { Box, Button, Container, Heading, HStack, IconButton, Skeleton, Text, VStack } from "@chakra-ui/react";
import { IconChevronDown, IconChevronUp, IconPlus } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { toaster } from "@components/ui/toaster";
import {
  useCreateStoryboardItem,
  useReorderStoryboardItems,
  useResetStoryboardLayout,
  useStoryboardDetail,
  useStoryboardSurfaceState,
} from "@mixtape/api/hooks/storyboard";
import type { StoryboardItem } from "@mixtape/api/clients/storyboard/storyboardApi";
import DraftRoomBodyEditor from "@/components/writing/draft-room/DraftRoomBodyEditor";
import StoryboardContextRail from "./StoryboardContextRail";

// Linear and spatial projections share the same canonical StoryboardItem tree.

interface TreeNode extends StoryboardItem {
  children: TreeNode[];
}

function buildTree(items: StoryboardItem[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  items.forEach((item) => byId.set(item.id, { ...item, children: [] }));
  const roots: TreeNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortByRank = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.rank - b.rank);
    nodes.forEach((n) => sortByRank(n.children));
  };
  sortByRank(roots);
  return roots;
}

export default function StoryboardLinearViewPage({
  params,
}: {
  params: Promise<{ storyboardId: string }>;
}) {
  const { storyboardId } = use(params);
  const { data, isLoading } = useStoryboardDetail(storyboardId);
  const { mutate: createItem, isPending: isCreating } = useCreateStoryboardItem(storyboardId);
  const { mutate: reorder } = useReorderStoryboardItems(storyboardId);
  const { mutate: saveSurface } = useStoryboardSurfaceState(storyboardId);
  const { mutate: resetLayout } = useResetStoryboardLayout(storyboardId);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [view, setView] = useState<"linear" | "spatial">("linear");
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const drag = useRef<{ id: string; startX: number; startY: number; x: number; y: number } | null>(null);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const tree = useMemo(() => buildTree(data?.items ?? []), [data?.items]);
  const selectedScene = useMemo(
    () => (data?.items ?? []).find((item) => item.id === selectedSceneId) ?? null,
    [data?.items, selectedSceneId],
  );
  const selectedItem = useMemo(
    () => (data?.items ?? []).find((item) => item.id === selectedItemId) ?? null,
    [data?.items, selectedItemId],
  );
  const avatarColor = (id: string) => {
    const palette = ["purple.600", "teal.600", "orange.600", "blue.600", "pink.600"];
    const hash = [...id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
    return palette[hash % palette.length];
  };
  const chapters = useMemo(() => {
    const ordered: StoryboardItem[] = [];
    const walk = (nodes: TreeNode[]) => nodes.forEach((node) => {
      if (node.level === "chapter") ordered.push(node);
      walk(node.children);
    });
    walk(tree);
    return ordered;
  }, [tree]);
  const chapterPosition = (item: StoryboardItem, index: number) => {
    const saved = data?.surface_states.find((state) => state.item_id === item.id);
    return positions[item.id] ?? {
      x: saved?.x ?? 48 + (index % 4) * 300,
      y: saved?.y ?? 48 + Math.floor(index / 4) * 300,
    };
  };
  const chapterState = (id: string) => data?.surface_states.find((state) => state.item_id === id);
  const beginDrag = (event: React.PointerEvent, item: StoryboardItem, index: number) => {
    const position = chapterPosition(item, index);
    drag.current = { id: item.id, startX: event.clientX - position.x, startY: event.clientY - position.y, ...position };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveDrag = (event: React.PointerEvent) => {
    if (!drag.current) return;
    const x = Math.max(0, event.clientX - drag.current.startX);
    const y = Math.max(0, event.clientY - drag.current.startY);
    drag.current.x = x;
    drag.current.y = y;
    setPositions((current) => ({ ...current, [drag.current!.id]: { x, y } }));
  };
  const endDrag = () => {
    if (!drag.current) return;
    const { id, x, y } = drag.current;
    drag.current = null;
    saveSurface({ itemId: id, payload: { x, y } });
  };

  const handleAdd = (level: "part" | "chapter" | "scene", parentId?: string) => {
    createItem(
      { level, parent_id: parentId ?? null, title: "" },
      {
        onError: (error) => {
          const detail = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
          toaster.create({
            title: `Could not add ${level}`,
            description: detail,
            type: "error",
          });
        },
        onSuccess: (item) => {
          if (level === "scene") { setSelectedSceneId(item.id); setSelectedItemId(item.id); }
        },
      },
    );
  };

  const handleMove = (node: TreeNode, siblings: TreeNode[], direction: -1 | 1) => {
    const index = siblings.findIndex((s) => s.id === node.id);
    const swapWith = index + direction;
    if (swapWith < 0 || swapWith >= siblings.length) return;
    const orderedIds = siblings.map((s) => s.id);
    [orderedIds[index], orderedIds[swapWith]] = [orderedIds[swapWith], orderedIds[index]];
    reorder({ parent_id: node.parent_id, ordered_item_ids: orderedIds });
  };

  function renderNode(node: TreeNode, siblings: TreeNode[]) {
    const isScene = node.level === "scene";
    return (
      <Box key={node.id} className={`sb-item sb-item-${node.level}`} pl={node.level === "scene" ? 4 : node.level === "chapter" ? 2 : 0}>
        <HStack className="sb-item-row" gap={2} py={1}>
          <VStack gap={0}>
            <IconButton
              aria-label="Move up"
              size="2xs"
              variant="ghost"
              onClick={() => handleMove(node, siblings, -1)}
            >
              <IconChevronUp size={14} />
            </IconButton>
            <IconButton
              aria-label="Move down"
              size="2xs"
              variant="ghost"
              onClick={() => handleMove(node, siblings, 1)}
            >
              <IconChevronDown size={14} />
            </IconButton>
          </VStack>
          {isScene ? (
            <Button
              variant={selectedSceneId === node.id ? "solid" : "ghost"}
              size="sm"
              onClick={() => { setSelectedSceneId(node.id); setSelectedItemId(node.id); }}
            >
              {node.title || "Untitled Scene"}
            </Button>
          ) : (
            <Text cursor="pointer" onClick={() => setSelectedItemId(node.id)} fontWeight={node.level === "part" ? "700" : "600"} fontSize={node.level === "part" ? "lg" : "md"}>
              {node.title || (node.level === "part" ? "Untitled Part" : "Untitled Chapter")}
            </Text>
          )}
          {node.level === "part" && (
            <Button size="xs" variant="ghost" onClick={() => handleAdd("chapter", node.id)}>
              <IconPlus size={14} /> Chapter
            </Button>
          )}
          {node.level === "chapter" && (
            <Button size="xs" variant="ghost" onClick={() => handleAdd("scene", node.id)}>
              <IconPlus size={14} /> Scene
            </Button>
          )}
        </HStack>
        {node.children.length > 0 && (
          <Box className="sb-item-children" borderLeftWidth={node.level !== "scene" ? "1px" : undefined} borderColor={borderColor} ml={2}>
            {node.children.map((child) => renderNode(child, node.children))}
          </Box>
        )}
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Container className="sb-linear-root" maxW="900px" py={12}>
        <Skeleton height="200px" />
      </Container>
    );
  }

  if (!data) {
    return (
      <Container className="sb-linear-root" maxW="900px" py={12}>
        <Text color={mutedColor}>Storyboard not found.</Text>
      </Container>
    );
  }

  return (
    <Container className="sb-linear-root" maxW="1500px" py={10}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">{data.storyboard.title || "Untitled Storyboard"}</Heading>
        <HStack className="sb-view-actions">
          <Button size="sm" variant={view === "linear" ? "solid" : "outline"} onClick={() => setView("linear")}>Linear</Button>
          <Button size="sm" variant={view === "spatial" ? "solid" : "outline"} onClick={() => setView("spatial")}>Storyboard</Button>
          {selectedEntityId && <Button size="sm" variant="outline" onClick={() => setSelectedEntityId(null)}>Clear character filter</Button>}
          {view === "spatial" && <Button size="sm" variant="outline" onClick={() => resetLayout(undefined, { onSuccess: () => setPositions({}) })}>Reset Layout</Button>}
          <Button size="sm" variant="outline" onClick={() => handleAdd("part")} loading={isCreating}>
            <IconPlus size={14} /> Part
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleAdd("chapter")} loading={isCreating}>
            <IconPlus size={14} /> Chapter
          </Button>
        </HStack>
      </HStack>

      <HStack className="sb-workspace-layout" align="start" gap={4}>
      {view === "spatial" ? (
        <Box className="sb-spatial-surface" flex="1" minW="0" position="relative" overflow="auto" minH="680px" borderWidth="1px" borderColor={borderColor} borderRadius="md">
          <Box className="sb-spatial-canvas" position="relative" minW="1250px" minH={`${Math.max(650, Math.ceil(chapters.length / 4) * 320)}px`}>
            <svg aria-hidden="true" width="100%" height="100%" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
              {chapters.slice(0, -1).map((chapter, index) => {
                const from = chapterPosition(chapter, index);
                const to = chapterPosition(chapters[index + 1], index + 1);
                return <line key={chapter.id} x1={from.x + 235} y1={from.y + 58} x2={to.x} y2={to.y + 58} stroke="currentColor" strokeWidth="2" markerEnd="url(#sb-arrow)" />;
              })}
              <defs><marker id="sb-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="currentColor" /></marker></defs>
            </svg>
            {chapters.map((chapter, index) => {
              const position = chapterPosition(chapter, index);
              const state = chapterState(chapter.id);
              const scenes = data.items.filter((item) => item.parent_id === chapter.id && item.level === "scene").sort((a, b) => a.rank - b.rank);
              const participants = data.participations.filter((part) => (part.item_id === chapter.id || scenes.some((scene) => scene.id === part.item_id)) && (part.kind === "character" || part.kind === "setting"));
              const uniqueParticipants = [...new Map(participants.map((part) => [part.entity_id, part])).values()];
              return <Box key={chapter.id} className="sb-chapter-card" position="absolute" left={`${position.x}px`} top={`${position.y}px`} w={state?.size === "small" ? "190px" : state?.size === "large" ? "330px" : "240px"} bg="bg.panel" borderWidth="1px" borderColor={borderColor} borderRadius="md" boxShadow="md" p={3} opacity={selectedEntityId && !uniqueParticipants.some((part) => part.entity_id === selectedEntityId) ? 0.35 : 1}>
                <Box className="sb-chapter-drag-handle" cursor="grab" touchAction="none" fontWeight="bold" onPointerDown={(event) => beginDrag(event, chapter, index)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag}>
                  {chapter.title || `Chapter ${index + 1}`}
                </Box>
                <Button size="2xs" variant="ghost" onClick={() => setSelectedItemId(chapter.id)}>Details</Button>
                <HStack className="sb-chapter-controls" mt={2} gap={1}>
                  <Button size="2xs" onClick={() => saveSurface({ itemId: chapter.id, payload: { expanded: !state?.expanded } })}>{state?.expanded ? "Collapse" : "Expand"}</Button>
                  <Button size="2xs" aria-label="Shrink card" onClick={() => saveSurface({ itemId: chapter.id, payload: { size: state?.size === "large" ? "normal" : "small" } })}>−</Button>
                  <Button size="2xs" aria-label="Enlarge card" onClick={() => saveSurface({ itemId: chapter.id, payload: { size: state?.size === "small" ? "normal" : "large" } })}>+</Button>
                </HStack>
                {state?.expanded && <VStack className="sb-chapter-scenes" align="stretch" mt={3} gap={2}>
                  {scenes.map((scene) => <Button key={scene.id} size="sm" variant="ghost" height="auto" whiteSpace="normal" textAlign="left" onClick={() => { setSelectedSceneId(scene.id); setSelectedItemId(scene.id); setView("linear"); }}>
                    <Box><Text fontWeight="semibold">{scene.title || "Untitled Scene"}</Text><Text fontSize="xs" color={mutedColor}>{scene.preview}</Text></Box>
                  </Button>)}
                </VStack>}
                <HStack className="sb-chapter-satellites" gap={1} mt={2} flexWrap="wrap">
                  {uniqueParticipants.map((part) => <Button key={part.entity_id} size="2xs" minW="24px" h="24px" p={1} borderRadius="full" bg={avatarColor(part.entity_id)} color="white" title={`${part.name} · ${part.kind}`} onClick={() => setSelectedEntityId(selectedEntityId === part.entity_id ? null : part.entity_id)}>{part.name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase()}</Button>)}
                </HStack>
              </Box>;
            })}
            {chapters.length === 0 && <Text p={8} color={mutedColor}>Add a Chapter to start the Storyboard.</Text>}
          </Box>
        </Box>
      ) : <HStack className="sb-linear-layout" align="flex-start" gap={8} flex="1" minW="0">
        <Box className="sb-linear-tree" flex="1" minW="280px" borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
          {tree.length === 0 ? (
            <Text color={mutedColor} fontSize="sm">
              No Parts or Chapters yet -- start with one above.
            </Text>
          ) : (
            tree.map((node) => renderNode(node, tree))
          )}
        </Box>

        <Box className="sb-linear-editor" flex="2" minW="0">
          {selectedScene && selectedScene.reference ? (
            <DraftRoomBodyEditor
              key={selectedScene.id}
              pieceId={selectedScene.reference.id}
              pieceSlug={selectedScene.reference.slug ?? ""}
              title={selectedScene.title}
              published={false}
              excerpt=""
              onExcerptChange={() => undefined}
              onBodyLoaded={() => undefined}
              onBodyChange={() => undefined}
              hideSummary
            />
          ) : (
            <Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={8} textAlign="center">
              <Text color={mutedColor}>Select a Scene to write.</Text>
            </Box>
          )}
        </Box>
      </HStack>}
      <StoryboardContextRail storyboardId={storyboardId} detail={data} item={selectedItem} />
      </HStack>
    </Container>
  );
}

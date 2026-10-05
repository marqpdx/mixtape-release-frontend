"use client";

import { use, useMemo, useState } from "react";
import { Box, Button, Container, Heading, HStack, IconButton, Skeleton, Text, VStack } from "@chakra-ui/react";
import { IconChevronDown, IconChevronUp, IconPlus } from "@tabler/icons-react";
import { useColorModeValue } from "@components/ui/color-mode";
import { toaster } from "@components/ui/toaster";
import {
  useCreateStoryboardItem,
  useReorderStoryboardItems,
  useStoryboardDetail,
} from "@mixtape/api/hooks/storyboard";
import type { StoryboardItem } from "@mixtape/api/clients/storyboard/storyboardApi";
import DraftRoomBodyEditor from "@/components/writing/draft-room/DraftRoomBodyEditor";

// Phase 5 Linear View (decisions/folio/folio-storyboard-build-plan.md §54,
// §19, puddlejump): Part -> Chapter -> Scene, read and edited as one
// continuous manuscript. Deliberately NOT built here (later phases, see
// folio-storyboard-build-handoff.md §4): Participation/Character satellites
// (Phase 7), the spatial Storyboard View / SurfaceState (Phase 6),
// FolioNote -> StoryboardItem attachment (Phase 8).

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
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);

  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedColor = useColorModeValue("gray.500", "gray.400");

  const tree = useMemo(() => buildTree(data?.items ?? []), [data?.items]);
  const selectedScene = useMemo(
    () => (data?.items ?? []).find((item) => item.id === selectedSceneId) ?? null,
    [data?.items, selectedSceneId],
  );

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
          if (level === "scene") setSelectedSceneId(item.id);
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
              onClick={() => setSelectedSceneId(node.id)}
            >
              {node.title || "Untitled Scene"}
            </Button>
          ) : (
            <Text fontWeight={node.level === "part" ? "700" : "600"} fontSize={node.level === "part" ? "lg" : "md"}>
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
    <Container className="sb-linear-root" maxW="1100px" py={10}>
      <HStack justify="space-between" mb={4}>
        <Heading size="lg">{data.storyboard.title || "Untitled Storyboard"}</Heading>
        <HStack>
          <Button size="sm" variant="outline" onClick={() => handleAdd("part")} loading={isCreating}>
            <IconPlus size={14} /> Part
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleAdd("chapter")} loading={isCreating}>
            <IconPlus size={14} /> Chapter
          </Button>
        </HStack>
      </HStack>

      <HStack align="flex-start" gap={8}>
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
      </HStack>
    </Container>
  );
}

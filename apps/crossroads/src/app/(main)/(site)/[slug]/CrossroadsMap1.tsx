// apps/crossroads/src/app/(main)/(site)/[slug]/CrossroadsMap1.tsx

"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Box, Checkbox, HStack, Text, VStack } from "@chakra-ui/react";
import { fetchPublicGroups } from "@mixtape/api/clients/public/publicApi";
import type { PublicGroup } from "@mixtape/api/clients/public/publicApi";

// ---- Types ----

type GroupNodeData = {
  group: PublicGroup;
  label: string;
};

// ---- Constants ----

const GROUP_TYPE_STYLES: Record<
  string,
  { color: string; label: string }
> = {
  community: { color: "#2d6a4f", label: "Community" },
  circle: { color: "#5a3e8a", label: "Circle" },
  coalition: { color: "#9c5a1c", label: "Coalition" },
  persona: { color: "#7a3b3b", label: "Persona" },
};

// ---- Earthy Map Background (Layer 1) ----

function MapBackground({ groups }: { groups: PublicGroup[] }) {
  const regions = useMemo(() => {
    if (groups.length === 0) return [];
    return groups.map((g, i) => {
      const hash = stableHash(g.id);
      const colors = getGroupColors(g);
      const angle = (2 * Math.PI * i) / groups.length;
      const spread = 25 + (hash % 15);
      const cx = 50 + Math.cos(angle) * spread;
      const cy = 50 + Math.sin(angle) * spread;
      const size = g.group_type === "community" ? 28 : 18;
      return { id: g.id, cx, cy, size, color: colors.primary };
    });
  }, [groups]);

  return (
    <Box position="absolute" inset="0" overflow="hidden">
      {/* Base: warm parchment */}
      <Box
        position="absolute"
        inset="0"
        bg="#e8dfc9"
        backgroundImage={[
          "radial-gradient(ellipse at 20% 30%, #ddd5be 0%, transparent 50%)",
          "radial-gradient(ellipse at 75% 60%, #d5cdb8 0%, transparent 45%)",
          "radial-gradient(ellipse at 50% 80%, #e0d8c2 0%, transparent 40%)",
        ].join(", ")}
      />

      {/* Terrain SVG */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        <defs>
          <filter id="region-soft">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="contour-rough">
            <feTurbulence
              type="turbulence"
              baseFrequency="0.02"
              numOctaves="2"
              seed="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="2"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        {/* Soft color regions */}
        <g filter="url(#region-soft)">
          {regions.map((r) => (
            <ellipse
              key={r.id}
              cx={r.cx}
              cy={r.cy}
              rx={r.size}
              ry={r.size * 0.75}
              fill={r.color}
              opacity={0.12}
            />
          ))}
        </g>

        {/* Topographic contours */}
        <g opacity="0.08" filter="url(#contour-rough)">
          {[15, 25, 35, 45, 55, 65, 75].map((r, i) => (
            <ellipse
              key={`contour-${i}`}
              cx={50 + (i % 3 - 1) * 8}
              cy={50 + (i % 2 === 0 ? -5 : 5)}
              rx={r}
              ry={r * 0.65}
              fill="none"
              stroke="#6b5e4a"
              strokeWidth="0.15"
            />
          ))}
        </g>

        {/* Grid lines */}
        <g opacity="0.05" stroke="#6b5e4a" strokeWidth="0.08">
          {Array.from({ length: 11 }).map((_, i) => (
            <React.Fragment key={`grid-${i}`}>
              <line x1={i * 10} y1="0" x2={i * 10} y2="100" />
              <line x1="0" y1={i * 10} x2="100" y2={i * 10} />
            </React.Fragment>
          ))}
        </g>
      </svg>

      {/* Paper grain */}
      <Box
        position="absolute"
        inset="0"
        opacity={0.06}
        backgroundImage="url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIxIi8+PC9zdmc+)"
        backgroundRepeat="repeat"
        mixBlendMode="multiply"
      />

      {/* Vignette */}
      <Box
        position="absolute"
        inset="0"
        background="radial-gradient(ellipse at center, transparent 50%, rgba(90,75,55,0.12) 100%)"
      />
    </Box>
  );
}

// ---- Group Node (Layer 2) ----

function GroupBlobNode({ data }: NodeProps<Node<GroupNodeData>>) {
  const [hovered, setHovered] = useState(false);
  const group = data.group;
  const colors = getGroupColors(group);
  const typeStyle = GROUP_TYPE_STYLES[group.group_type] || GROUP_TYPE_STYLES.circle;
  const isCommunity = group.group_type === "community";
  const size = isCommunity ? 88 : 62;
  const hasImage = !!group.profile_image_url;

  return (
    <Box
      position="relative"
      w={`${size}px`}
      h={`${size}px`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      cursor="pointer"
      transition="transform 0.2s ease"
      transform={hovered ? "scale(1.1)" : "scale(1)"}
    >
      {/* Ground shadow */}
      <Box
        position="absolute"
        bottom="-5px"
        left="10%"
        right="10%"
        h="10px"
        borderRadius="full"
        bg="rgba(40,30,15,0.25)"
        filter="blur(5px)"
      />

      {/* Main node */}
      <Box
        position="absolute"
        inset="0"
        borderRadius="full"
        overflow="hidden"
        border="3px solid"
        borderColor={hovered ? "white" : "rgba(255,255,255,0.7)"}
        boxShadow={
          hovered
            ? `0 4px 20px rgba(0,0,0,0.3), 0 0 0 4px ${colors.primary}50`
            : `0 3px 12px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.2)`
        }
        transition="all 0.2s ease"
      >
        {/* Strong color base — high saturation, dark enough to pop */}
        <Box
          position="absolute"
          inset="0"
          background={`linear-gradient(145deg, ${colors.primary}, ${colors.secondary})`}
        />

        {/* Profile image — lightly softened */}
        {hasImage && (
          <Box
            position="absolute"
            inset="0"
            backgroundImage={`url(${group.profile_image_url})`}
            backgroundSize="cover"
            backgroundPosition="center"
            filter="blur(1px) saturate(1.1)"
            opacity={0.85}
          />
        )}

        {/* Inner highlight for depth */}
        <Box
          position="absolute"
          inset="0"
          background="linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 40%, rgba(0,0,0,0.1) 100%)"
        />
      </Box>

      {/* Initial letter (when no image) */}
      {!hasImage && (
        <Box
          position="absolute"
          inset="0"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1}
        >
          <Text
            fontSize={isCommunity ? "2xl" : "lg"}
            fontWeight="800"
            color="white"
            textShadow="0 2px 4px rgba(0,0,0,0.4)"
          >
            {group.title.charAt(0).toUpperCase()}
          </Text>
        </Box>
      )}

      {/* Type indicator dot */}
      <Box
        position="absolute"
        top="-2px"
        right="-2px"
        w="14px"
        h="14px"
        borderRadius="full"
        bg={typeStyle.color}
        border="2.5px solid white"
        boxShadow="0 1px 3px rgba(0,0,0,0.2)"
        zIndex={2}
      />

      {/* Always-visible label (name below the node, small) */}
      <Box
        position="absolute"
        top="105%"
        left="50%"
        transform="translateX(-50%)"
        zIndex={2}
        pointerEvents="none"
        whiteSpace="nowrap"
      >
        <Text
          fontSize="xs"
          fontWeight="600"
          color="rgba(60,50,35,0.7)"
          textAlign="center"
          textShadow="0 1px 2px rgba(255,255,255,0.8)"
        >
          {group.title}
        </Text>
      </Box>

      {/* Hover detail tooltip */}
      <Box
        position="absolute"
        bottom="115%"
        left="50%"
        zIndex={10}
        opacity={hovered ? 1 : 0}
        transition="opacity 0.2s ease, transform 0.2s ease"
        transform={
          hovered
            ? "translateX(-50%) translateY(0)"
            : "translateX(-50%) translateY(4px)"
        }
        pointerEvents="none"
      >
        <Box
          bg="rgba(45,40,32,0.92)"
          backdropFilter="blur(6px)"
          borderRadius="md"
          px="3"
          py="2"
          boxShadow="0 3px 12px rgba(0,0,0,0.2)"
          whiteSpace="nowrap"
          minW="100px"
        >
          <Text fontSize="sm" fontWeight="600" color="white" textAlign="center">
            {group.title}
          </Text>
          <Text fontSize="xs" color="rgba(255,255,255,0.7)" textAlign="center">
            {typeStyle.label} &middot; {group.member_count}{" "}
            {group.member_count === 1 ? "member" : "members"}
          </Text>
          {group.quick_intro && (
            <Text
              fontSize="xs"
              color="rgba(255,255,255,0.55)"
              textAlign="center"
              mt="1"
              maxW="200px"
              whiteSpace="normal"
              lineClamp={2}
            >
              {group.quick_intro}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
}

const nodeTypes: NodeTypes = {
  groupBlob: GroupBlobNode,
};

// ---- Controls + Legend ----

function MapControls({
  showGroups,
  setShowGroups,
  showMembers,
  setShowMembers,
  showRelationships,
  setShowRelationships,
  groups,
}: {
  showGroups: boolean;
  setShowGroups: (v: boolean) => void;
  showMembers: boolean;
  setShowMembers: (v: boolean) => void;
  showRelationships: boolean;
  setShowRelationships: (v: boolean) => void;
  groups: PublicGroup[];
}) {
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const g of groups) {
      c[g.group_type] = (c[g.group_type] || 0) + 1;
    }
    return c;
  }, [groups]);

  const totalMembers = useMemo(
    () => groups.reduce((sum, g) => sum + g.member_count, 0),
    [groups]
  );

  return (
    <Box position="absolute" top="16px" left="16px" zIndex={10}>
      <VStack
        align="start"
        gap="3"
        bg="rgba(255,252,245,0.9)"
        backdropFilter="blur(8px)"
        borderWidth="1px"
        borderColor="rgba(120,100,70,0.15)"
        borderRadius="12px"
        p="14px"
        boxShadow="0 2px 10px rgba(0,0,0,0.08)"
        minW="170px"
      >
        {/* Legend */}
        <Text
          fontSize="xs"
          fontWeight="700"
          color="rgba(80,65,45,0.7)"
          textTransform="uppercase"
          letterSpacing="0.05em"
        >
          Legend
        </Text>

        <VStack align="start" gap="1.5">
          {Object.entries(GROUP_TYPE_STYLES).map(([type, style]) => {
            const count = counts[type];
            if (!count) return null;
            return (
              <HStack key={type} gap="2">
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="full"
                  bg={style.color}
                  border="1px solid rgba(255,255,255,0.5)"
                  flexShrink={0}
                />
                <Text fontSize="xs" color="rgba(80,65,45,0.8)">
                  {style.label}
                  <Text as="span" color="rgba(80,65,45,0.45)">
                    {" "}
                    ({count})
                  </Text>
                </Text>
              </HStack>
            );
          })}
          {/* Members count */}
          <HStack gap="2">
            <Box
              w="10px"
              h="10px"
              borderRadius="full"
              bg="rgba(80,65,45,0.3)"
              border="1px solid rgba(255,255,255,0.5)"
              flexShrink={0}
            />
            <Text fontSize="xs" color="rgba(80,65,45,0.8)">
              Members
              <Text as="span" color="rgba(80,65,45,0.45)">
                {" "}
                ({totalMembers})
              </Text>
            </Text>
          </HStack>
        </VStack>

        {/* Divider */}
        <Box w="full" h="1px" bg="rgba(120,100,70,0.1)" />

        {/* Layers */}
        <Text
          fontSize="xs"
          fontWeight="700"
          color="rgba(80,65,45,0.7)"
          textTransform="uppercase"
          letterSpacing="0.05em"
        >
          Layers
        </Text>

        <VStack align="start" gap="1.5">
          <Checkbox.Root
            checked={showGroups}
            onCheckedChange={(e) => setShowGroups(!!e.checked)}
            size="sm"
          >
            <Checkbox.Control />
            <Checkbox.Label>
              <Text fontSize="xs" color="rgba(80,65,45,0.8)">
                Groups
              </Text>
            </Checkbox.Label>
          </Checkbox.Root>

          <Checkbox.Root
            checked={showMembers}
            onCheckedChange={(e) => setShowMembers(!!e.checked)}
            size="sm"
          >
            <Checkbox.Control />
            <Checkbox.Label>
              <Text fontSize="xs" color="rgba(80,65,45,0.8)">
                Members
              </Text>
            </Checkbox.Label>
          </Checkbox.Root>

          <Checkbox.Root
            checked={showRelationships}
            onCheckedChange={(e) => setShowRelationships(!!e.checked)}
            size="sm"
          >
            <Checkbox.Control />
            <Checkbox.Label>
              <Text fontSize="xs" color="rgba(80,65,45,0.8)">
                Relationships
              </Text>
            </Checkbox.Label>
          </Checkbox.Root>
        </VStack>

        <Text
          fontSize="xs"
          color="rgba(80,65,45,0.4)"
          maxW="150px"
          lineHeight="1.3"
        >
          Hover a node for details. Larger nodes are communities.
        </Text>
      </VStack>
    </Box>
  );
}

// ---- Layout ----

function layoutGroups(groups: PublicGroup[]): Node<GroupNodeData>[] {
  if (groups.length === 0) return [];

  const communities = groups.filter((g) => g.group_type === "community");
  const others = groups.filter((g) => g.group_type !== "community");
  const nodes: Node<GroupNodeData>[] = [];
  const centerX = 0;
  const centerY = 0;

  const innerRadius = communities.length <= 1 ? 0 : 180;
  const communityPts = radialPositions(
    communities.length,
    innerRadius,
    centerX,
    centerY
  );
  communities.forEach((g, i) => {
    const jitter = stableJitter(g.id, 20);
    nodes.push({
      id: g.id,
      type: "groupBlob",
      position: {
        x: communityPts[i].x + jitter.dx,
        y: communityPts[i].y + jitter.dy,
      },
      data: { group: g, label: g.title },
    });
  });

  const outerRadius = communities.length === 0 ? 160 : 280;
  const otherPts = radialPositions(others.length, outerRadius, centerX, centerY);
  others.forEach((g, i) => {
    const jitter = stableJitter(g.id, 25);
    nodes.push({
      id: g.id,
      type: "groupBlob",
      position: {
        x: otherPts[i].x + jitter.dx,
        y: otherPts[i].y + jitter.dy,
      },
      data: { group: g, label: g.title },
    });
  });

  return nodes;
}

function buildEdges(groups: PublicGroup[]): Edge[] {
  const edges: Edge[] = [];
  const slugToId = new Map(groups.map((g) => [g.slug, g.id]));

  for (const g of groups) {
    if (g.parent_slug) {
      const parentId = slugToId.get(g.parent_slug);
      if (parentId) {
        edges.push({
          id: `e-${g.id}-${parentId}`,
          source: g.id,
          target: parentId,
          type: "default",
          style: {
            stroke: "rgba(80,65,45,0.2)",
            strokeWidth: 1.5,
            strokeDasharray: "6 4",
          },
        });
      }
    }
  }

  return edges;
}

// ---- Main Component ----

export default function CrossroadsMap() {
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGroups, setShowGroups] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showRelationships, setShowRelationships] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPublicGroups()
      .then((data) => {
        setGroups(data);
      })
      .catch((err) => {
        console.error("Failed to load groups:", err);
        setError("Could not load groups. Is the backend running?");
      })
      .finally(() => setLoading(false));
  }, []);

  const allNodes = useMemo(() => layoutGroups(groups), [groups]);
  const nodes = showGroups ? allNodes : [];
  const allEdges = useMemo(() => buildEdges(groups), [groups]);
  const edges = showRelationships ? allEdges : [];

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    console.log("Group clicked:", node.data);
  }, []);

  if (loading) {
    return (
      <Box
        w="100%"
        h="calc(100vh - 120px)"
        borderRadius="16px"
        overflow="hidden"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="#e8dfc9"
      >
        <Text color="rgba(80,65,45,0.5)" fontSize="sm">
          Loading the map...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        w="100%"
        h="calc(100vh - 120px)"
        borderRadius="16px"
        overflow="hidden"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        gap="2"
        bg="#e8dfc9"
      >
        <Text color="rgba(120,60,30,0.7)" fontSize="sm" fontWeight="500">
          {error}
        </Text>
        <Text color="rgba(80,65,45,0.4)" fontSize="xs">
          Check that the Django server is running on port 8010.
        </Text>
      </Box>
    );
  }

  return (
    <Box
      ref={containerRef}
      position="relative"
      w="100%"
      h="calc(100vh - 120px)"
      borderRadius="16px"
      overflow="hidden"
      border="1px solid rgba(120,100,70,0.15)"
    >
      {/* Layer 1: Earthy map background */}
      <MapBackground groups={groups} />

      {/* Controls + Legend */}
      <MapControls
        showGroups={showGroups}
        setShowGroups={setShowGroups}
        showMembers={showMembers}
        setShowMembers={setShowMembers}
        showRelationships={showRelationships}
        setShowRelationships={setShowRelationships}
        groups={groups}
      />

      {/* Layer 2 & 3: ReactFlow canvas */}
      <Box position="absolute" inset="0" zIndex={1}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          onNodeClick={onNodeClick}
          proOptions={{ hideAttribution: true }}
        >
          <Controls showInteractive={false} />
        </ReactFlow>
      </Box>
    </Box>
  );
}

// ---- Helpers ----

function getGroupColors(group: PublicGroup): {
  primary: string;
  secondary: string;
} {
  const emblem = group.emblem;

  if (emblem && (emblem.bg || emblem.fg)) {
    const primary = emblem.bg || emblem.fg || "#2d6a4f";
    const secondary =
      (emblem.palette && emblem.palette.length > 0
        ? emblem.palette[0]
        : null) ||
      emblem.fg ||
      darken(primary, 0.2);
    return { primary, secondary };
  }

  // Strong fallback: use group type color (dark, saturated — pops on parchment)
  const typeStyle =
    GROUP_TYPE_STYLES[group.group_type] || GROUP_TYPE_STYLES.circle;
  return {
    primary: typeStyle.color,
    secondary: darken(typeStyle.color, 0.15),
  };
}

function darken(hex: string, amount: number): string {
  const c = hex.replace("#", "");
  if (c.length !== 6) return hex;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const blend = (v: number) => Math.max(0, Math.round(v * (1 - amount)));
  return `#${blend(r).toString(16).padStart(2, "0")}${blend(g).toString(16).padStart(2, "0")}${blend(b).toString(16).padStart(2, "0")}`;
}

function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function stableJitter(id: string, amount: number) {
  const hash = stableHash(id);
  const r1 = (hash % 1000) / 1000;
  const r2 = ((hash / 1000) % 1000) / 1000;
  return { dx: (r1 - 0.5) * amount, dy: (r2 - 0.5) * amount };
}

function radialPositions(
  count: number,
  radius: number,
  cx: number,
  cy: number
) {
  if (count <= 0) return [];
  if (count === 1) return [{ x: cx, y: cy }];

  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    pts.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return pts;
}

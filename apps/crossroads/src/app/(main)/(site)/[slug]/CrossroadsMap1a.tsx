// apps/crossroads/src/app/(main)/(site)/[slug]/CrossroadsMap1a.tsx

"use client";

  // 1. Interactive nodes:
  // - Draggable — grab any node and reposition it (useNodesState for mutable positions)
  // - Click — toggles selection, node expands to 1.35x with stronger glow and shadow
  // - Double-click — navigates to /group/{slug} (the future group page)
  // - Click background — deselects

  // 2. Semiotic indicator rings:
  // - Concentric colored rings outside each node, each ring = a trait:
  //   - Blue ring — "Welcomes new members" (on communities)
  //   - Green ring — "Recently active" (has members)
  //   - Amber ring — "Publishing content" (has decorators)
  //   - Red ring — "Invite only" (available for future use)
  // - Rings are subtle at rest (35% opacity), brighten on hover/select (70%)
  // - Legend panel includes a "Signals" section explaining each ring color
  // - Tooltip also lists which signals apply to the hovered group


import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Controls,
  useNodesState,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useParams, useRouter } from "next/navigation";

import { Box, Button, Checkbox, HStack, Text, VStack } from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { fetchPublicGroups } from "@mixtape/api/clients/public/publicApi";
import type { PublicGroup } from "@mixtape/api/clients/public/publicApi";

// ---- Types ----

type GroupNodeData = {
  group: PublicGroup;
  label: string;
  selected?: boolean;
};

// ---- Constants ----

const GROUP_TYPE_STYLES: Record<string, { color: string; label: string }> = {
  community: { color: "#2d6a4f", label: "Community" },
  circle: { color: "#5a3e8a", label: "Circle" },
  coalition: { color: "#9c5a1c", label: "Coalition" },
};

// Semiotic indicator ring definitions
// Each ring conveys a trait about the group. Colors are intentional signals.
const INDICATOR_RINGS = {
  welcomes: { color: "#3b82f6", label: "Welcomes new members" },        // blue
  active: { color: "#22c55e", label: "Recently active" },               // green
  publishing: { color: "#f59e0b", label: "Publishing content" },        // amber
  inviteOnly: { color: "#ef4444", label: "Invite only" },               // red
} as const;

type IndicatorKey = keyof typeof INDICATOR_RINGS;

// Derive indicators from group data
function getIndicators(group: PublicGroup): IndicatorKey[] {
  const indicators: IndicatorKey[] = [];

  // For now, derive from what we have. This will grow as the data model expands.
  if (group.member_count > 0) indicators.push("active");
  if (group.group_type === "community") indicators.push("welcomes");
  if (group.decorators?.length > 0) indicators.push("publishing");

  return indicators;
}

// ---- Position Persistence ----

const STORAGE_PREFIX = "crossroads-positions:";

function getSavedPositions(slug: string): Record<string, { x: number; y: number }> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + slug);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePositions(slug: string, nodes: Node<GroupNodeData>[]) {
  if (typeof window === "undefined") return;
  const positions: Record<string, { x: number; y: number }> = {};
  for (const n of nodes) {
    positions[n.id] = { x: n.position.x, y: n.position.y };
  }
  localStorage.setItem(STORAGE_PREFIX + slug, JSON.stringify(positions));
}

function clearSavedPositions(slug: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_PREFIX + slug);
}

// ---- Map Background (Layer 1) ----

function MapBackground({
  groups,
  bgBase,
  bgWarm,
  bgCool,
  bgMid,
  contourColor,
  gridColor,
  vignetteColor,
}: {
  groups: PublicGroup[];
  bgBase: string;
  bgWarm: string;
  bgCool: string;
  bgMid: string;
  contourColor: string;
  gridColor: string;
  vignetteColor: string;
}) {
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
      {/* Base */}
      <Box
        position="absolute"
        inset="0"
        bg={bgBase}
        backgroundImage={[
          `radial-gradient(ellipse at 20% 30%, ${bgWarm} 0%, transparent 50%)`,
          `radial-gradient(ellipse at 75% 60%, ${bgCool} 0%, transparent 45%)`,
          `radial-gradient(ellipse at 50% 80%, ${bgMid} 0%, transparent 40%)`,
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
          <filter id="region-soft-1a">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="contour-rough-1a">
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
        <g filter="url(#region-soft-1a)">
          {regions.map((r) => (
            <ellipse
              key={r.id}
              cx={r.cx}
              cy={r.cy}
              rx={r.size}
              ry={r.size * 0.75}
              fill={r.color}
              opacity={0.08}
            />
          ))}
        </g>

        {/* Topographic contours */}
        <g opacity="0.06" filter="url(#contour-rough-1a)">
          {[15, 25, 35, 45, 55, 65, 75].map((r, i) => (
            <ellipse
              key={`contour-${i}`}
              cx={50 + (i % 3 - 1) * 8}
              cy={50 + (i % 2 === 0 ? -5 : 5)}
              rx={r}
              ry={r * 0.65}
              fill="none"
              stroke={contourColor}
              strokeWidth="0.15"
            />
          ))}
        </g>

        {/* Grid lines */}
        <g opacity="0.04" stroke={gridColor} strokeWidth="0.08">
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
        opacity={0.04}
        backgroundImage="url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48ZmlsdGVyIGlkPSJuIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSI0IiBzdGl0Y2hUaWxlcz0ic3RpdGNoIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI24pIiBvcGFjaXR5PSIxIi8+PC9zdmc+)"
        backgroundRepeat="repeat"
        mixBlendMode="multiply"
      />

      {/* Vignette */}
      <Box
        position="absolute"
        inset="0"
        background={`radial-gradient(ellipse at center, transparent 55%, ${vignetteColor} 100%)`}
      />
    </Box>
  );
}

// ---- Group Node (Layer 2) ----

function GroupBlobNode({ data }: NodeProps<Node<GroupNodeData>>) {
  const [hovered, setHovered] = useState(false);
  const group = data.group;
  const isSelected = !!data.selected;
  const colors = getGroupColors(group);
  const typeStyle =
    GROUP_TYPE_STYLES[group.group_type] || GROUP_TYPE_STYLES.circle;
  const isCommunity = group.group_type === "community";
  const isCoalition = group.group_type === "coalition";

  // Communities: subtle size boost for active groups (88–104px)
  const communityBase = isCommunity
    ? 88 + Math.min(group.member_count * 0.8, 16)
    : 62;
  // Coalitions: 78% of community base, rendered as rounded rect
  const baseSize = isCoalition ? Math.round(88 * 0.78) : communityBase;
  const size = isSelected ? baseSize * 1.35 : baseSize;

  // Coalition aspect ratio: wider than tall
  const nodeW = isCoalition ? size * 1.3 : size;
  const nodeH = isCoalition ? size * 0.9 : size;
  const nodeRadius = isCoalition ? "16px" : "9999px";

  const hasImage = !!group.profile_image_url;
  const indicators = getIndicators(group);

  // Colors for label text (mode-aware via CSS custom properties won't work
  // inside ReactFlow nodes easily, so we use a neutral that works on both)
  const labelColor = "rgba(80,65,45,0.8)";
  const labelShadow = "0 1px 2px rgba(255,255,255,0.6)";

  return (
    <Box
      position="relative"
      w={`${nodeW}px`}
      h={`${nodeH}px`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      cursor="grab"
      transition="width 0.3s ease, height 0.3s ease"
    >
      {/* Ground shadow */}
      <Box
        position="absolute"
        bottom="-5px"
        left={isCoalition ? "5%" : "10%"}
        right={isCoalition ? "5%" : "10%"}
        h="10px"
        borderRadius="full"
        bg="rgba(40,30,15,0.2)"
        filter="blur(5px)"
      />

      {/* Semiotic indicator rings */}
      {indicators.map((key, i) => {
        const ring = INDICATOR_RINGS[key];
        const pad = 12 + i * 8;
        const ringW = nodeW + pad;
        const ringH = nodeH + pad;
        const offsetX = (ringW - nodeW) / 2;
        const offsetY = (ringH - nodeH) / 2;
        return (
          <Box
            key={key}
            position="absolute"
            top={`${-offsetY}px`}
            left={`${-offsetX}px`}
            w={`${ringW}px`}
            h={`${ringH}px`}
            borderRadius={isCoalition ? "20px" : "full"}
            border="2px solid"
            borderColor={ring.color}
            opacity={hovered || isSelected ? 0.7 : 0.35}
            transition="opacity 0.2s ease"
            pointerEvents="none"
          />
        );
      })}

      {/* Main node */}
      <Box
        position="absolute"
        inset="0"
        borderRadius={nodeRadius}
        overflow="hidden"
        border="3px solid"
        borderColor={
          isSelected
            ? "white"
            : hovered
              ? "rgba(255,255,255,0.9)"
              : "rgba(255,255,255,0.6)"
        }
        boxShadow={
          isSelected
            ? `0 6px 24px rgba(0,0,0,0.35), 0 0 0 5px ${colors.primary}40`
            : hovered
              ? `0 4px 20px rgba(0,0,0,0.3), 0 0 0 3px ${colors.primary}30`
              : "0 3px 12px rgba(0,0,0,0.2)"
        }
        transition="all 0.2s ease"
      >
        {/* Color base */}
        <Box
          position="absolute"
          inset="0"
          background={`linear-gradient(145deg, ${colors.primary}, ${colors.secondary})`}
        />

        {/* Profile image */}
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

        {/* Highlight */}
        <Box
          position="absolute"
          inset="0"
          background="linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 40%, rgba(0,0,0,0.1) 100%)"
        />
      </Box>

      {/* Initial letter */}
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
            fontSize={isSelected ? "3xl" : isCommunity ? "2xl" : "lg"}
            fontWeight="800"
            color="white"
            textShadow="0 2px 4px rgba(0,0,0,0.4)"
            transition="font-size 0.3s ease"
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

      {/* Always-visible label */}
      <Box
        position="absolute"
        top="108%"
        left="50%"
        transform="translateX(-50%)"
        zIndex={2}
        pointerEvents="none"
        whiteSpace="nowrap"
      >
        <Text
          fontSize={isSelected ? "sm" : "xs"}
          fontWeight="600"
          color={labelColor}
          textAlign="center"
          textShadow={labelShadow}
          transition="font-size 0.3s ease"
        >
          {group.title}
        </Text>
      </Box>

      {/* Hover / selected detail tooltip */}
      <Box
        position="absolute"
        bottom="115%"
        left="50%"
        zIndex={10}
        opacity={hovered || isSelected ? 1 : 0}
        transition="opacity 0.2s ease, transform 0.2s ease"
        transform={
          hovered || isSelected
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
          minW="120px"
        >
          <Text
            fontSize="sm"
            fontWeight="600"
            color="white"
            textAlign="center"
          >
            {group.title}
          </Text>
          <Text
            fontSize="xs"
            color="rgba(255,255,255,0.7)"
            textAlign="center"
          >
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
          {/* Indicator legend in tooltip */}
          {indicators.length > 0 && (
            <HStack gap="1" mt="1.5" justify="center" flexWrap="wrap">
              {indicators.map((key) => {
                const ring = INDICATOR_RINGS[key];
                return (
                  <HStack key={key} gap="1">
                    <Box
                      w="6px"
                      h="6px"
                      borderRadius="full"
                      bg={ring.color}
                    />
                    <Text fontSize="2xs" color="rgba(255,255,255,0.5)">
                      {ring.label}
                    </Text>
                  </HStack>
                );
              })}
            </HStack>
          )}
          {isSelected && (
            <Text
              fontSize="2xs"
              color="rgba(255,255,255,0.4)"
              textAlign="center"
              mt="1"
            >
              Double-click to visit
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
  onResetLayout,
  groups,
  panelBg,
  panelBorder,
  textColor,
  textMuted,
}: {
  showGroups: boolean;
  setShowGroups: (v: boolean) => void;
  showMembers: boolean;
  setShowMembers: (v: boolean) => void;
  showRelationships: boolean;
  setShowRelationships: (v: boolean) => void;
  onResetLayout: () => void;
  groups: PublicGroup[];
  panelBg: string;
  panelBorder: string;
  textColor: string;
  textMuted: string;
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
        bg={panelBg}
        backdropFilter="blur(8px)"
        borderWidth="1px"
        borderColor={panelBorder}
        borderRadius="12px"
        p="14px"
        boxShadow="0 2px 10px rgba(0,0,0,0.08)"
        minW="170px"
      >
        {/* Legend */}
        <Text
          fontSize="xs"
          fontWeight="700"
          color={textMuted}
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
                  border="1px solid rgba(255,255,255,0.3)"
                  flexShrink={0}
                />
                <Text fontSize="xs" color={textColor}>
                  {style.label}
                  <Text as="span" color={textMuted}>
                    {" "}({count})
                  </Text>
                </Text>
              </HStack>
            );
          })}
          <HStack gap="2">
            <Box
              w="10px"
              h="10px"
              borderRadius="full"
              bg="rgba(120,100,70,0.3)"
              border="1px solid rgba(255,255,255,0.3)"
              flexShrink={0}
            />
            <Text fontSize="xs" color={textColor}>
              Members
              <Text as="span" color={textMuted}>
                {" "}({totalMembers})
              </Text>
            </Text>
          </HStack>
        </VStack>

        {/* Indicator rings legend */}
        <Box w="full" h="1px" bg={panelBorder} />

        <Text
          fontSize="xs"
          fontWeight="700"
          color={textMuted}
          textTransform="uppercase"
          letterSpacing="0.05em"
        >
          Signals
        </Text>

        <VStack align="start" gap="1">
          {Object.entries(INDICATOR_RINGS).map(([key, ring]) => (
            <HStack key={key} gap="2">
              <Box
                w="8px"
                h="8px"
                borderRadius="full"
                border="2px solid"
                borderColor={ring.color}
                flexShrink={0}
              />
              <Text fontSize="2xs" color={textMuted}>
                {ring.label}
              </Text>
            </HStack>
          ))}
        </VStack>

        <Box w="full" h="1px" bg={panelBorder} />

        {/* Layers */}
        <Text
          fontSize="xs"
          fontWeight="700"
          color={textMuted}
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
              <Text fontSize="xs" color={textColor}>Groups</Text>
            </Checkbox.Label>
          </Checkbox.Root>

          <Checkbox.Root
            checked={showMembers}
            onCheckedChange={(e) => setShowMembers(!!e.checked)}
            size="sm"
          >
            <Checkbox.Control />
            <Checkbox.Label>
              <Text fontSize="xs" color={textColor}>Members</Text>
            </Checkbox.Label>
          </Checkbox.Root>

          <Checkbox.Root
            checked={showRelationships}
            onCheckedChange={(e) => setShowRelationships(!!e.checked)}
            size="sm"
          >
            <Checkbox.Control />
            <Checkbox.Label>
              <Text fontSize="xs" color={textColor}>Relationships</Text>
            </Checkbox.Label>
          </Checkbox.Root>
        </VStack>

        <Text fontSize="xs" color={textMuted} maxW="150px" lineHeight="1.3">
          Drag nodes to rearrange. Click to focus, double-click to visit.
        </Text>

        <Button
          size="xs"
          variant="outline"
          onClick={onResetLayout}
          w="full"
          fontSize="xs"
        >
          Reset layout
        </Button>
      </VStack>
    </Box>
  );
}

// ---- Layout ----

// Golden angle in radians (~137.508°) — produces natural, non-repeating spacing
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function organicPositions(
  count: number,
  nominalRadius: number,
  cx: number,
  cy: number,
  ids: string[],
  jitterAmount: number
) {
  if (count <= 0) return [];
  if (count === 1) {
    const j = stableJitter(ids[0], jitterAmount * 0.5);
    return [{ x: cx + j.dx, y: cy + j.dy }];
  }

  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = GOLDEN_ANGLE * i - Math.PI / 2;
    // Vary radius per item using its hash (±15% of nominal)
    const hash = stableHash(ids[i]);
    const radiusVariation = 0.85 + ((hash % 300) / 1000); // 0.85–1.15
    const r = nominalRadius * radiusVariation;
    const jitter = stableJitter(ids[i], jitterAmount);
    pts.push({
      x: cx + r * Math.cos(angle) + jitter.dx,
      y: cy + r * Math.sin(angle) + jitter.dy,
    });
  }
  return pts;
}

function layoutGroups(groups: PublicGroup[]): Node<GroupNodeData>[] {
  if (groups.length === 0) return [];

  const communities = groups.filter((g) => g.group_type === "community");
  const others = groups.filter((g) => g.group_type !== "community");
  const nodes: Node<GroupNodeData>[] = [];
  const centerX = 0;
  const centerY = 0;

  const innerRadius = communities.length <= 1 ? 0 : 160;
  const communityPts = organicPositions(
    communities.length,
    innerRadius,
    centerX,
    centerY,
    communities.map((g) => g.id),
    25
  );
  communities.forEach((g, i) => {
    nodes.push({
      id: g.id,
      type: "groupBlob",
      position: { x: communityPts[i].x, y: communityPts[i].y },
      data: { group: g, label: g.title },
      draggable: true,
    });
  });

  const outerRadius = communities.length === 0 ? 160 : 260;
  const otherPts = organicPositions(
    others.length,
    outerRadius,
    centerX,
    centerY,
    others.map((g) => g.id),
    20
  );
  others.forEach((g, i) => {
    nodes.push({
      id: g.id,
      type: "groupBlob",
      position: { x: otherPts[i].x, y: otherPts[i].y },
      data: { group: g, label: g.title },
      draggable: true,
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
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string) || "default";
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGroups, setShowGroups] = useState(true);
  const [showMembers, setShowMembers] = useState(true);
  const [showRelationships, setShowRelationships] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastClickTime = useRef<number>(0);
  const lastClickId = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Color mode
  const bgBase = useColorModeValue("#f2ece0", "#1a1a2e");
  const bgWarm = useColorModeValue("#ede7d9", "#1e1e35");
  const bgCool = useColorModeValue("#e8e4da", "#1c1c30");
  const bgMid = useColorModeValue("#eee8dc", "#1d1d32");
  const contourColor = useColorModeValue("#6b5e4a", "#4a4a6a");
  const gridColor = useColorModeValue("#6b5e4a", "#4a4a6a");
  const vignetteColor = useColorModeValue(
    "rgba(90,75,55,0.08)",
    "rgba(0,0,0,0.3)"
  );
  const panelBg = useColorModeValue(
    "rgba(255,252,245,0.9)",
    "rgba(30,30,50,0.9)"
  );
  const panelBorder = useColorModeValue(
    "rgba(120,100,70,0.15)",
    "rgba(100,100,140,0.2)"
  );
  const textColor = useColorModeValue(
    "rgba(80,65,45,0.8)",
    "rgba(200,195,180,0.8)"
  );
  const textMuted = useColorModeValue(
    "rgba(80,65,45,0.45)",
    "rgba(200,195,180,0.45)"
  );
  const borderColor = useColorModeValue(
    "rgba(120,100,70,0.15)",
    "rgba(100,100,140,0.15)"
  );
  const loadingBg = useColorModeValue("#f2ece0", "#1a1a2e");
  const loadingColor = useColorModeValue(
    "rgba(80,65,45,0.5)",
    "rgba(200,195,180,0.5)"
  );

  useEffect(() => {
    fetchPublicGroups()
      .then(setGroups)
      .catch((err) => {
        console.error("Failed to load groups:", err);
        setError("Could not load groups. Is the backend running?");
      })
      .finally(() => setLoading(false));
  }, []);

  // Build initial nodes: merge saved positions with algorithmic layout
  const initialNodes = useMemo(() => {
    const algorithmic = layoutGroups(groups);
    const saved = getSavedPositions(slug);
    if (!saved) return algorithmic;

    return algorithmic.map((node) => {
      const savedPos = saved[node.id];
      if (savedPos) {
        return { ...node, position: savedPos };
      }
      return node;
    });
  }, [groups, slug]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);

  // Sync nodes when groups load (with saved positions merged)
  useEffect(() => {
    const algorithmic = layoutGroups(groups);
    const saved = getSavedPositions(slug);
    if (!saved) {
      setNodes(algorithmic);
      return;
    }

    const merged = algorithmic.map((node) => {
      const savedPos = saved[node.id];
      if (savedPos) {
        return { ...node, position: savedPos };
      }
      return node; // New group — use algorithmic position
    });
    setNodes(merged);
  }, [groups, slug, setNodes]);

  // Update selected state on nodes when selection changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: { ...n.data, selected: n.id === selectedNodeId },
      }))
    );
  }, [selectedNodeId, setNodes]);

  const visibleNodes = showGroups ? nodes : [];
  const allEdges = useMemo(() => buildEdges(groups), [groups]);
  const edges = showRelationships ? allEdges : [];

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const now = Date.now();
      const isDoubleClick =
        now - lastClickTime.current < 400 && lastClickId.current === node.id;

      if (isDoubleClick) {
        // Double-click: navigate to group page
        const group = (node.data as GroupNodeData).group;
        router.push(`/group/${group.slug}`);
      } else {
        // Single click: toggle selection (expand/contract)
        setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
      }

      lastClickTime.current = now;
      lastClickId.current = node.id;
    },
    [router]
  );

  // Click on background deselects
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Debounced save on drag stop
  const onNodeDragStop = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setNodes((currentNodes) => {
        savePositions(slug, currentNodes);
        return currentNodes;
      });
    }, 300);
  }, [slug, setNodes]);

  // Reset layout: clear saved positions and re-run algorithm
  const handleResetLayout = useCallback(() => {
    clearSavedPositions(slug);
    setNodes(layoutGroups(groups));
  }, [slug, groups, setNodes]);

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
        bg={loadingBg}
      >
        <Text color={loadingColor} fontSize="sm">
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
        bg={loadingBg}
      >
        <Text color="rgba(180,80,40,0.8)" fontSize="sm" fontWeight="500">
          {error}
        </Text>
        <Text color={loadingColor} fontSize="xs">
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
      border="1px solid"
      borderColor={borderColor}
    >
      <MapBackground
        groups={groups}
        bgBase={bgBase}
        bgWarm={bgWarm}
        bgCool={bgCool}
        bgMid={bgMid}
        contourColor={contourColor}
        gridColor={gridColor}
        vignetteColor={vignetteColor}
      />

      <MapControls
        showGroups={showGroups}
        setShowGroups={setShowGroups}
        showMembers={showMembers}
        setShowMembers={setShowMembers}
        showRelationships={showRelationships}
        setShowRelationships={setShowRelationships}
        onResetLayout={handleResetLayout}
        groups={groups}
        panelBg={panelBg}
        panelBorder={panelBorder}
        textColor={textColor}
        textMuted={textMuted}
      />

      <Box position="absolute" inset="0" zIndex={1}>
        <ReactFlow
          nodes={visibleNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          nodesDraggable={true}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={onPaneClick}
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


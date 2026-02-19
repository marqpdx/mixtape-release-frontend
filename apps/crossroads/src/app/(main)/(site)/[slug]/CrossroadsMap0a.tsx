// apps/crossroads/src/app/(main)/(site)/[slug]/CrossroadsMap0a.tsx

"use client";

import React, { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Box, HStack, VStack, Text, Image } from "@chakra-ui/react";
import { Checkbox } from "@chakra-ui/react";

/**
 * Minimal demo data. Replace with real API results later.
 * - Groups are the “inner ring”
 * - Members are the “outer ring”
 */
type Group = {
  id: string;
  name: string;
  kind: "community" | "circle" | "coalition";
  color?: string; // hex preferred, ex: "#2B6CB0"
  emblemUrl?: string; // blurred wash (poster/emblem)
  glyphUrl?: string; // simplified mark (small)
};

type Member = {
  id: string;
  name: string;
  groupIds: string[];
};

const DEMO_GROUPS: Group[] = [
  {
    id: "g-crossroads",
    name: "Crossroads",
    kind: "community",
    color: "#2B6CB0",
    // emblemUrl: "/images/emblems/crossroads.jpg",
    // glyphUrl: "/images/glyphs/community.svg",
  },
  { id: "g-mindful", name: "Mindful Brilliance", kind: "community", color: "#2F855A" },
  { id: "g-earthlab", name: "EarthLab", kind: "circle", color: "#B7791F" },
  { id: "g-threadworks", name: "Threadworks", kind: "circle", color: "#6B46C1" },
  { id: "g-coalition", name: "Local Coalition", kind: "coalition", color: "#C05621" },
];

const DEMO_MEMBERS: Member[] = [
  { id: "m-1", name: "Mark", groupIds: ["g-crossroads", "g-mindful"] },
  { id: "m-2", name: "Asha", groupIds: ["g-earthlab"] },
  { id: "m-3", name: "Diego", groupIds: ["g-threadworks", "g-crossroads"] },
  { id: "m-4", name: "Lin", groupIds: ["g-mindful", "g-coalition"] },
  { id: "m-5", name: "Sam", groupIds: ["g-crossroads"] },
];

// ---- Node UI (Icon Panel) ----

type IconPanelData = {
  label: string;
  entityType: "group" | "member";
  kind?: Group["kind"]; // only for groups
  color?: string;
  emblemUrl?: string;
  glyphUrl?: string;
};

function withAlpha(hex: string, alphaHex: string) {
  // expects #RRGGBB, returns #RRGGBBAA
  const clean = hex.trim();
  if (!/^#[0-9A-Fa-f]{6}$/.test(clean)) return undefined;
  return `${clean}${alphaHex}`;
}

function IconPanelNode({ data }: { data: IconPanelData }) {
  const isGroup = data.entityType === "group";

  const tint = data.color ? withAlpha(data.color, "22") : "rgba(0,0,0,0.06)";
  const frameBg = isGroup ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.70)";

  return (
    <VStack gap="1" align="center">
      <Box
        w={isGroup ? "108px" : "88px"}
        h={isGroup ? "72px" : "56px"}
        borderRadius="20px"
        position="relative"
        overflow="hidden"
        bg={frameBg}
        borderWidth="1px"
        borderColor="rgba(0,0,0,0.08)"
        boxShadow="sm"
      >
        {/* subtle tint wash */}
        <Box position="absolute" inset="0" bg={tint as any} />

        {/* blurred emblem wash (optional) */}
        {isGroup && data.emblemUrl ? (
          <Image
            src={data.emblemUrl}
            alt=""
            position="absolute"
            inset="-12px"
            w="calc(100% + 24px)"
            h="calc(100% + 24px)"
            objectFit="cover"
            filter="blur(10px) saturate(1.05)"
            opacity={0.55}
          />
        ) : null}

        {/* crisp glyph (optional) */}
        <Box position="absolute" inset="0" display="flex" alignItems="center" justifyContent="center">
          {isGroup && data.glyphUrl ? (
            <Image src={data.glyphUrl} alt="" w="28px" h="28px" opacity={0.92} />
          ) : (
            <Box
              w={isGroup ? "26px" : "18px"}
              h={isGroup ? "26px" : "18px"}
              borderRadius={isGroup ? "10px" : "999px"}
              bg="rgba(0,0,0,0.14)"
            />
          )}
        </Box>
      </Box>

      <Text
        fontSize="sm"
        fontWeight={isGroup ? "650" : "500"}
        color="rgba(0,0,0,0.78)"
        textAlign="center"
        maxW="160px"
        lineHeight="1.1"
      >
        {data.label}
      </Text>

      {isGroup && data.kind ? (
        <Text fontSize="xs" color="rgba(0,0,0,0.55)">
          {data.kind}
        </Text>
      ) : null}
    </VStack>
  );
}

const nodeTypes: NodeTypes = {
  iconPanel: IconPanelNode,
};

// ---- Layout helpers ----

function radialPositions(count: number, radius: number, centerX: number, centerY: number) {
  const pts: Array<{ x: number; y: number }> = [];
  if (count <= 0) return pts;

  for (let i = 0; i < count; i++) {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2; // start at top
    pts.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return pts;
}

function stableJitter(id: string, amount: number) {
  // Deterministic “organic drift” based on id (so it doesn’t wiggle between renders)
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const r1 = (hash % 1000) / 1000;
  const r2 = ((hash / 1000) % 1000) / 1000;
  return { dx: (r1 - 0.5) * amount, dy: (r2 - 0.5) * amount };
}

// ---- Main component ----

export default function CrossroadsMap() {
  // Default calm: groups only.
  const [showGroups, setShowGroups] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [showStrands, setShowStrands] = useState(false);

  const { nodes, edges } = useMemo(() => {
    const center = { x: 0, y: 0 };

    // Rings (tweak these freely)
    const GROUP_RADIUS = 220;
    const MEMBER_RADIUS = 380;

    const groupPts = radialPositions(DEMO_GROUPS.length, GROUP_RADIUS, center.x, center.y);
    const memberPts = radialPositions(DEMO_MEMBERS.length, MEMBER_RADIUS, center.x, center.y);

    const groupNodes: Node<IconPanelData>[] = DEMO_GROUPS.map((g, idx) => {
      const jitter = stableJitter(g.id, 18);
      return {
        id: g.id,
        type: "iconPanel",
        position: { x: groupPts[idx].x + jitter.dx, y: groupPts[idx].y + jitter.dy },
        data: {
          label: g.name,
          entityType: "group",
          kind: g.kind,
          color: g.color,
          emblemUrl: g.emblemUrl,
          glyphUrl: g.glyphUrl,
        },
      };
    });

    const memberNodes: Node<IconPanelData>[] = DEMO_MEMBERS.map((m, idx) => {
      const jitter = stableJitter(m.id, 16);
      return {
        id: m.id,
        type: "iconPanel",
        position: { x: memberPts[idx].x + jitter.dx, y: memberPts[idx].y + jitter.dy },
        data: { label: m.name, entityType: "member" },
      };
    });

    const membershipEdges: Edge[] = [];
    if (showStrands) {
      for (const m of DEMO_MEMBERS) {
        for (const gid of m.groupIds) {
          membershipEdges.push({
            id: `e-${m.id}-${gid}`,
            source: m.id,
            target: gid,
            type: "smoothstep",
            style: {
              // softer “strand”
              stroke: "rgba(25,25,25,0.14)",
              strokeWidth: 2,
            },
          });
        }
      }
    }

    const visibleNodes = [
      ...(showGroups ? groupNodes : []),
      ...(showMembers ? memberNodes : []),
    ];

    // Only include edges if both endpoints are visible
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = membershipEdges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );

    return { nodes: visibleNodes, edges: visibleEdges };
  }, [showGroups, showMembers, showStrands]);

  return (
    <Box position="relative" w="100%" h="calc(100vh - 120px)" borderRadius="24px" overflow="hidden">
      {/* Soft “paper” field */}
      <Box
        position="absolute"
        inset="0"
        bg="linear-gradient(180deg, rgba(245,242,235,1) 0%, rgba(240,244,248,1) 100%)"
      />
      {/* whisper-light texture dots (optional) */}
      <Box
        position="absolute"
        inset="0"
        pointerEvents="none"
        opacity={0.10}
        bgImage="radial-gradient(circle at 20% 30%, rgba(0,0,0,0.10) 0 1px, transparent 2px),
                 radial-gradient(circle at 80% 60%, rgba(0,0,0,0.08) 0 1px, transparent 2px)"
        bgSize="220px 220px"
      />

      {/* Controls overlay */}
      <Box position="absolute" top="16px" left="16px" zIndex={10}>
        <VStack
          align="start"
          gap="2"
          bg="rgba(255,255,255,0.80)"
          borderWidth="1px"
          borderColor="rgba(0,0,0,0.08)"
          borderRadius="18px"
          p="12px"
          boxShadow="sm"
        >
          <Text fontSize="sm" fontWeight="600" color="rgba(0,0,0,0.75)">
            Layers
          </Text>

          <HStack gap="3">
            <Checkbox.Root checked={showGroups} onCheckedChange={(e) => setShowGroups(!!e.checked)}>
              <Checkbox.Control />
              <Checkbox.Label>Groups</Checkbox.Label>
            </Checkbox.Root>

            <Checkbox.Root checked={showMembers} onCheckedChange={(e) => setShowMembers(!!e.checked)}>
              <Checkbox.Control />
              <Checkbox.Label>Members</Checkbox.Label>
            </Checkbox.Root>
          </HStack>

          <Checkbox.Root
            checked={showStrands}
            onCheckedChange={(e) => setShowStrands(!!e.checked)}
            disabled={!(showGroups && showMembers)}
          >
            <Checkbox.Control />
            <Checkbox.Label>Strands (relationships)</Checkbox.Label>
          </Checkbox.Root>

          <Text fontSize="xs" color="rgba(0,0,0,0.55)" maxW="240px">
            Start calm. Add Members + Strands only when you want more detail.
          </Text>
        </VStack>
      </Box>

      {/* Flow canvas */}
      <Box position="absolute" inset="0" zIndex={1}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag
          zoomOnScroll
          zoomOnPinch
        >
          <Background gap={28} size={1} color="rgba(0,0,0,0.06)" />
          <MiniMap pannable zoomable />
          <Controls showInteractive={false} />
        </ReactFlow>
      </Box>
    </Box>
  );
}

"use client";

import { useColorModeValue } from "@components/ui/color-mode";
import type { Moiety, LikenessRecord, Relation, RelationStrength } from "./fieldData";
import { MoietyNode, nodeDims } from "./MoietyNode";

export const CANVAS_W = 1800;
export const CANVAS_H = 1100;

interface FieldCanvasProps {
  moieties: Moiety[];
  likenesses: LikenessRecord[];
  relations: Relation[];
  visibleIds: Set<string>;
  selectedId: string | null;
  standInId: string | null;
  granularity: number;
  softSnap: boolean;
  selectMode: boolean;
  selectedSet: Set<string>;
  findHitIds: Set<string>;
  effectiveGravity: Map<string, number>;
  showLines: boolean;
  onMoveMoiety: (id: string, x: number, y: number, humanPlaced: boolean) => void;
  onSelectMoiety: (id: string) => void;
}

const LINE_STROKE: Record<RelationStrength, string> = {
  weak: "#CBD5E1", medium: "#94A3B8", strong: "#64748B",
};
const LINE_STROKE_DARK: Record<RelationStrength, string> = {
  weak: "#334155", medium: "#475569", strong: "#64748B",
};
const LINE_DASH: Record<RelationStrength, string> = {
  weak: "5 5", medium: "none", strong: "none",
};
const LINE_WIDTH: Record<RelationStrength, number> = {
  weak: 0.6, medium: 1.2, strong: 2,
};

export function FieldCanvas({
  moieties, relations, visibleIds, selectedId, standInId,
  granularity, softSnap, selectMode, selectedSet, findHitIds,
  effectiveGravity, showLines, onMoveMoiety, onSelectMoiety,
}: FieldCanvasProps) {
  const isDark = useColorModeValue(false, true);
  const canvasBg = useColorModeValue("#F8FAFC", "#0C1020");
  const gridColor = useColorModeValue("rgba(99,102,241,0.05)", "rgba(99,102,241,0.07)");
  const lineStrokes = isDark ? LINE_STROKE_DARK : LINE_STROKE;

  const { w: nodeW, h: nodeH } = nodeDims(granularity);
  const visibleMoieties = moieties.filter(m => visibleIds.has(m.id));
  const moietyMap = new Map(moieties.map(m => [m.id, m]));

  // Stand-in relations set for visual boost
  const standInRelations = new Set<string>();
  if (standInId) {
    const si = moietyMap.get(standInId);
    if (si) {
      for (const rid of si.relations) standInRelations.add(rid);
      for (const m of moieties) {
        if (m.relations.includes(standInId)) standInRelations.add(m.id);
      }
    }
  }

  return (
    <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H, background: canvasBg }}>
      {/* Faint grid */}
      <svg
        style={{ position: "absolute", top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: "none" }}
        aria-hidden
      >
        <defs>
          <pattern id="field-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={gridColor} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#field-grid)" />
      </svg>

      {/* Relationship lines */}
      {showLines && (
        <svg
          style={{ position: "absolute", top: 0, left: 0, width: CANVAS_W, height: CANVAS_H, pointerEvents: "none" }}
          aria-hidden
        >
          {relations.map(rel => {
            if (!visibleIds.has(rel.from) || !visibleIds.has(rel.to)) return null;
            const a = moietyMap.get(rel.from);
            const b = moietyMap.get(rel.to);
            if (!a || !b) return null;
            const x1 = a.x + nodeW / 2;
            const y1 = a.y + nodeH / 2;
            const x2 = b.x + nodeW / 2;
            const y2 = b.y + nodeH / 2;
            return (
              <line
                key={`${rel.from}-${rel.to}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={lineStrokes[rel.strength]}
                strokeWidth={LINE_WIDTH[rel.strength]}
                strokeDasharray={LINE_DASH[rel.strength]}
                opacity={0.6}
              />
            );
          })}
        </svg>
      )}

      {/* Moiety nodes */}
      {visibleMoieties.map(m => (
        <MoietyNode
          key={m.id}
          moiety={m}
          granularity={granularity}
          effectiveGravity={effectiveGravity.get(m.id) ?? m.gravity}
          isSelected={selectedId === m.id}
          isFindHit={findHitIds.has(m.id)}
          isStandIn={standInId === m.id}
          isStandInRelated={standInRelations.has(m.id)}
          isInSelectedSet={selectedSet.has(m.id)}
          selectMode={selectMode}
          softSnap={softSnap}
          isDark={isDark}
          onSelect={onSelectMoiety}
          onMoveMoiety={onMoveMoiety}
        />
      ))}
    </div>
  );
}

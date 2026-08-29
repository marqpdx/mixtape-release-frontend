"use client";

import { useRef } from "react";
import type { Moiety, MoietyKind } from "./fieldData";

const CANVAS_W = 1800;
const CANVAS_H = 1100;
const GRID = 20;

export function nodeDims(gran: number): { w: number; h: number } {
  if (gran < 33) return { w: 100, h: 48 };
  if (gran < 67) return { w: 132, h: 66 };
  return { w: 160, h: 88 };
}

const KIND_LIGHT: Record<MoietyKind, { bg: string; border: string; text: string }> = {
  canon:   { bg: "#EEF2FF", border: "#6366F1", text: "#312E81" },
  data:    { bg: "#F0FDFA", border: "#14B8A6", text: "#134E4A" },
  report:  { bg: "#FFFBEB", border: "#F59E0B", text: "#78350F" },
  drop:    { bg: "#FAF5FF", border: "#A855F7", text: "#3B0764" },
  program: { bg: "#F0FDF4", border: "#22C55E", text: "#14532D" },
  grant:   { bg: "#FFF7ED", border: "#F97316", text: "#7C2D12" },
};

const KIND_DARK: Record<MoietyKind, { bg: string; border: string; text: string }> = {
  canon:   { bg: "#1E1B4B", border: "#818CF8", text: "#C7D2FE" },
  data:    { bg: "#0D3330", border: "#2DD4BF", text: "#99F6E4" },
  report:  { bg: "#2D1A00", border: "#FCD34D", text: "#FEF3C7" },
  drop:    { bg: "#2E1057", border: "#C084FC", text: "#E9D5FF" },
  program: { bg: "#052E16", border: "#4ADE80", text: "#BBF7D0" },
  grant:   { bg: "#2C0D00", border: "#FB923C", text: "#FFEDD5" },
};

const KIND_RADIUS: Record<MoietyKind, string> = {
  canon:   "20px",
  data:    "6px",
  report:  "4px",
  drop:    "4px 18px 4px 18px",
  program: "16px 4px 16px 4px",
  grant:   "20px",
};

const KIND_LABEL: Record<MoietyKind, string> = {
  canon: "Canon", data: "Data", report: "Doc",
  drop: "Drop", program: "Program", grant: "Grant",
};

interface MoietyNodeProps {
  moiety: Moiety;
  granularity: number;
  effectiveGravity: number;
  isSelected: boolean;
  isFindHit: boolean;
  isStandIn: boolean;
  isStandInRelated: boolean;
  isInSelectedSet: boolean;
  selectMode: boolean;
  softSnap: boolean;
  isDark: boolean;
  onSelect: (id: string) => void;
  onMoveMoiety: (id: string, x: number, y: number, humanPlaced: boolean) => void;
}

export function MoietyNode({
  moiety, granularity, effectiveGravity, isSelected, isFindHit, isStandIn,
  isStandInRelated, isInSelectedSet, selectMode, softSnap, isDark,
  onSelect, onMoveMoiety,
}: MoietyNodeProps) {
  const { w, h } = nodeDims(granularity);
  const dragRef = useRef<{
    startX: number; startY: number; startPtrX: number; startPtrY: number; moved: boolean;
  } | null>(null);

  const colors = isDark ? KIND_DARK[moiety.kind] : KIND_LIGHT[moiety.kind];
  const gravNorm = effectiveGravity / 100;
  const borderW = 1 + gravNorm * 2.5;
  const opacity = 0.6 + gravNorm * 0.4;
  const scale = isStandInRelated ? 1.06 : 1;

  const showDistillate = granularity >= 33;
  const distillateLen = granularity >= 67 ? 90 : 44;

  const ringColor = isSelected || isInSelectedSet ? "#F59E0B" : isStandIn ? "#6366F1" : "transparent";

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (selectMode) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: moiety.x, startY: moiety.y,
      startPtrX: e.clientX, startPtrY: e.clientY,
      moved: false,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startPtrX;
    const dy = e.clientY - dragRef.current.startPtrY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragRef.current.moved = true;
      const nx = Math.max(0, Math.min(CANVAS_W - w, dragRef.current.startX + dx));
      const ny = Math.max(0, Math.min(CANVAS_H - h, dragRef.current.startY + dy));
      onMoveMoiety(moiety.id, nx, ny, false);
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startPtrX;
    const dy = e.clientY - dragRef.current.startPtrY;
    if (dragRef.current.moved) {
      let nx = dragRef.current.startX + dx;
      let ny = dragRef.current.startY + dy;
      if (softSnap) {
        nx = Math.round(nx / GRID) * GRID;
        ny = Math.round(ny / GRID) * GRID;
      }
      nx = Math.max(0, Math.min(CANVAS_W - w, nx));
      ny = Math.max(0, Math.min(CANVAS_H - h, ny));
      onMoveMoiety(moiety.id, nx, ny, true);
    } else {
      onSelect(moiety.id);
    }
    dragRef.current = null;
  }

  return (
    <div
      className={isFindHit ? "is-find-beat" : undefined}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: "absolute",
        left: moiety.x,
        top: moiety.y,
        width: w,
        height: h,
        borderRadius: KIND_RADIUS[moiety.kind],
        background: colors.bg,
        border: `${borderW}px solid ${colors.border}`,
        outline: `2px solid ${ringColor}`,
        outlineOffset: "2px",
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: "center",
        cursor: selectMode ? "pointer" : "grab",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "4px 8px",
        userSelect: "none",
        boxSizing: "border-box",
        transition: "opacity 0.15s, transform 0.15s, outline-color 0.1s",
        overflow: "hidden",
      }}
    >
      <div style={{
        fontSize: granularity >= 67 ? "11px" : "10px",
        fontWeight: "600",
        color: colors.border,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        lineHeight: 1,
        marginBottom: "2px",
        opacity: 0.75,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}>
        {KIND_LABEL[moiety.kind]}
        {moiety.temporal && " · ⏱"}
        {moiety.human_placed && " · ⬡"}
      </div>
      <div style={{
        fontSize: granularity >= 67 ? "13px" : "12px",
        fontWeight: effectiveGravity >= 75 ? "700" : effectiveGravity >= 55 ? "600" : "500",
        color: colors.text,
        lineHeight: 1.2,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
      }}>
        {moiety.name}
      </div>
      {showDistillate && (
        <div style={{
          fontSize: "10px",
          color: colors.text,
          opacity: 0.65,
          lineHeight: 1.3,
          marginTop: "3px",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}>
          {moiety.distillate.slice(0, distillateLen)}
          {moiety.distillate.length > distillateLen ? "…" : ""}
        </div>
      )}
    </div>
  );
}

// components/folio/workbench/shapes.ts
//
// Display vocabulary for FolioNote Shapes on the desktop Workbench. The values
// themselves come from core (folio/shapes.py); this only labels them.

import type { FolioNoteShape } from "@mixtape/api/clients/folio/folioApi";

export const SHAPE_ORDER: FolioNoteShape[] = ["character", "scene", "plot", "setting", "world", "meta", "unplaced"];

export const SHAPE_LABELS: Record<FolioNoteShape, string> = {
  character: "Character",
  scene: "Scene",
  plot: "Plot",
  setting: "Setting",
  world: "World",
  meta: "Meta",
  unplaced: "Unplaced",
};

/** MIME type for dragging a note row onto a Shape facet. */
export const NOTE_DRAG_TYPE = "application/x-folio-note-id";

export function noteSnippet(text: string, max = 140): string {
  const flat = (text || "").replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export function shortDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

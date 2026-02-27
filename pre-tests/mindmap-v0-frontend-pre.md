# MindMap v0 — Frontend Pre-Test

**Feature:** Spatial mind map canvas with node types, edge connections, autosave, and viewport persistence
**Date:** 2026-02-26
**Modules:** `components/mindmap/`, `app/(main)/(authenticated)/mindmap/`
**Components:** `MindMapCanvas.tsx`, `MindMapToolbar.tsx`, `NoteNode.tsx`, `LinkNode.tsx`, `ImageNode.tsx`, `LeafNode.tsx`
**Backend dependencies:** MindMap, MindMapNode, MindMapEdge, MindMapNodeAttachment APIs (Phases 1-2)

---

## What was built

### Frontend
- `(authenticated)/mindmap/page.tsx` — List page: user's mindmaps, create button
- `(authenticated)/mindmap/[id]/page.tsx` — Editor page: loads mindmap detail, renders canvas
- `MindMapCanvas.tsx` — XYFlow canvas wrapper: loads nodes + edges in parallel, wires callbacks to persistence
- `MindMapToolbar.tsx` — Title editing + Add Note/Link/Image/Leaf buttons
- `NoteNode.tsx` — Inline note with title/text, double-click to edit, debounced save (500ms)
- `LinkNode.tsx` — URL node with title + link display
- `ImageNode.tsx` — Image node from attachment or primary_url
- `LeafNode.tsx` — Leaf-backed node with green styling

### API Layer
- `packages/core/src/types/mindmapTypes.ts` — TS interfaces for all models + bulk payloads
- `packages/api/src/clients/mindmap/mindmapApi.ts` — Full API client (CRUD + bulk for maps/nodes/edges/attachments)
- `packages/api/src/hooks/useMindmap.ts` — React Query hooks with cache invalidation

---

## Environment contract

- `E2E_BASE_URL` — app base URL
- `E2E_AUTHOR_EMAIL` / `E2E_AUTHOR_PASSWORD` — authenticated user
- Backend running with `mindmap` app migrated

---

## Pre-Test Scenarios

### A. Auth Guard & Routing

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Navigate to `/mindmap` while logged out | Redirect to `/login?redirect=/mindmap` |
| 2 | Navigate to `/mindmap` while logged in | Shows mindmap list page |
| 3 | Navigate to `/mindmap/{id}` with valid id | Shows editor with canvas |
| 4 | Navigate to `/mindmap/{invalid-id}` | Shows "Mind map not found" error |

### B. Mindmap List Page

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Page loads with no mindmaps | Shows empty state: "No mind maps yet" + create button |
| 2 | Click "New Mind Map" | Prompt for title, creates mindmap, redirects to editor |
| 3 | Create with empty title | Creates with "Untitled" as default |
| 4 | Page loads with existing mindmaps | Shows cards with title, status, version, updated date |
| 5 | Click on a mindmap card | Navigates to `/mindmap/{id}` |

### C. Canvas Loading

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Open editor for empty mindmap | Canvas renders with no nodes, toolbar visible |
| 2 | Open editor for mindmap with nodes/edges | All nodes render at correct positions, edges connect correctly |
| 3 | Loading state | Spinner + "Loading mind map..." text while nodes/edges fetch |
| 4 | Viewport restores from saved state | Canvas opens at saved pan/zoom position |

### D. Node Creation (Toolbar)

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Click "Add Note" | Note node appears at viewport center, node persisted to backend |
| 2 | Click "Add Link", enter URL | Link node appears with URL displayed |
| 3 | Click "Add Image", enter URL | Image node appears with image displayed |
| 4 | Click "Link Leaf", enter leaf ID | Leaf-backed node appears with green styling |
| 5 | Cancel any prompt | No node created |
| 6 | Verify version increments after node create | GET mindmap detail shows version +1 |

### E. Note Node Editing

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Double-click note node | Switches to edit mode with title input + text textarea |
| 2 | Type in title field | Title updates locally immediately |
| 3 | Type in text field | Text updates locally immediately |
| 4 | Wait 500ms after typing | Debounced save fires (check network tab for bulk_upsert) |
| 5 | Click away (blur) | Exits edit mode, shows read-only view |
| 6 | Edit title → verify version bump | Mindmap version increments (title is a content field) |

### F. Node Dragging

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Drag a single node | Node moves smoothly |
| 2 | Release drag (drag stop) | Position saved via bulk_upsert (check network) |
| 3 | Drag stop does NOT bump version | Mindmap version unchanged after position-only save |
| 4 | Multi-select + drag | All selected nodes move together |
| 5 | Release multi-drag | All positions saved in single bulk_upsert call |
| 6 | Refresh page after drag | Nodes appear at new positions |

### G. Edge Connection

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Drag from source handle to target handle | Edge created, visible on canvas |
| 2 | Edge persisted | New edge appears in GET edges response |
| 3 | Edge creation bumps version | Mindmap version +1 |
| 4 | Edge shows label if set | Label visible on edge (if applicable) |

### H. Deletion

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Select node + press Delete/Backspace | Node disappears from canvas |
| 2 | Node deletion persisted | Node excluded from GET nodes |
| 3 | Node deletion cascades edges | Connected edges also removed |
| 4 | Select edge + press Delete/Backspace | Edge disappears |
| 5 | Edge deletion persisted | Edge excluded from GET edges |
| 6 | Multi-select nodes + delete | All selected nodes deleted in single bulk_delete |
| 7 | Version bumps on delete | Mindmap version increments |

### I. Viewport & Autosave

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Pan the canvas | No immediate save |
| 2 | Stop panning, wait ~800ms | Viewport saved via PATCH mindmap (check network) |
| 3 | Zoom in/out | Zoom level saved after debounce |
| 4 | Viewport save does NOT bump version | Version unchanged |
| 5 | Refresh page | Canvas reopens at saved viewport position |

### J. Title Editing

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Click title in toolbar | Switches to input mode |
| 2 | Type new title + press Enter | Title saved, toolbar shows new title |
| 3 | Type new title + blur | Title saved on blur |
| 4 | Empty title | Shows "Untitled" as display |

### K. Node Type Rendering

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Note node | Shows title + text, double-click editable |
| 2 | Link node | Shows title + URL with link icon |
| 3 | Image node | Shows image from attachment/primary_url + title |
| 4 | Leaf node | Green border/bg, "Leaf" badge, title + text preview |
| 5 | All nodes have handles | Top (target) and bottom (source) connection handles visible |
| 6 | Selected node | Blue border highlight + shadow |

### L. Canvas Controls

| # | Scenario | Expected |
|---|----------|----------|
| 1 | Controls panel visible | Zoom in/out/fit buttons rendered |
| 2 | MiniMap visible | Overview thumbnail of canvas |
| 3 | Background pattern | Dot grid background rendered |
| 4 | Fit view on first load (no saved viewport) | Canvas auto-fits to show all nodes |

---

## Fixture Requirements

- **User:** Authenticated user with valid JWT
- **Mindmap:** At least one mindmap with 3+ nodes of different types (note, link, image) and 2+ edges
- **Empty mindmap:** One mindmap with no nodes for empty-state testing
- **Leaf:** One Leaf in the system for leaf-backed node testing

## Run Command

```bash
# Dev server
cd apps/crossroads && npm run dev

# TypeScript check
npx tsc --noEmit --project apps/crossroads/tsconfig.json
```

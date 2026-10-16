// apps/mixtape/src/components/writing/dissolve-surface/WritingDissolveSurfaceWorkArea.tsx
//
// Pilot surface for decisions/dissolve-outer-rim-adr (DOR-9) — first real
// nav consumer of the shared <OuterRim> + useDissolve primitive. Additive:
// the six classic Content sub-items (writing, import-document,
// series-writing, dual-panel-editor, editors-desk, draft-room) are
// untouched; this is a parallel sub-item that flattens them into rim
// positions around one dissolving work surface, reusing the same
// components the classic sections already render.

import { useState } from "react";
import { Box, Heading } from "@chakra-ui/react";
import {
  IconArmchair2,
  IconArrowsRightLeft,
  IconBooks,
  IconClipboardCheck,
  IconFileImport,
  IconHome2,
  IconPencil,
} from "@tabler/icons-react";
import { OuterRim, useDissolve, type RimPositionItem } from "@mixtape/ui/dissolve";
import type { Group } from "@mixtape/core/types/groupTypes";

import { Tooltip } from "@components/ui/tooltip";
import { WritingReception } from "@/components/writing/dissolve-surface/WritingReception";
import WritingEditorWrapper from "@/components/writing/WritingEditorWrapper";
import SponsorWritingWrapper from "@/components/writing/SponsorWritingWrapper";
import DocumentImportWorkArea from "@/components/writing/import/DocumentImportWorkArea";
import SeriesWritingWorkArea from "@/components/writing/SeriesWritingWorkArea";
import { DualPanelEditorWorkArea } from "@/components/writing/dual-panel/DualPanelEditorWorkArea";
import { EditorsDeskWorkArea } from "@/components/writing/editors-desk/EditorsDeskWorkArea";
import DraftRoomWorkArea from "@/components/writing/draft-room/DraftRoomWorkArea";

type RimKey =
  | "writing"
  | "import-document"
  | "series-writing"
  | "dual-panel-editor"
  | "editors-desk"
  | "draft-room";

interface WritingDissolveSurfaceWorkAreaProps {
  group: Group;
  isSuperuser: boolean;
  canManagePosts: boolean;
  /** Escape hatch to the classic sections — same contract as the rest of GroupWorkArea, not forked. */
  setActiveSection: (section: string, params?: Record<string, string>) => void;
}

const RIM_LABELS: Record<RimKey, string> = {
  writing: "Writing",
  "import-document": "Import Documents",
  "series-writing": "Series Writing",
  "dual-panel-editor": "Draft ↔ Dispatch",
  "editors-desk": "Editor's Desk",
  "draft-room": "Draft Room",
};

// Area Icons — decisions/dissolve-outer-rim-adr §3a. One fixed Tabler glyph
// per Rim Position, distinct from the Context Icons each active surface
// owns internally (e.g. Editor's Desk's own toolbar).
const RIM_ICONS: Record<RimKey, typeof IconPencil> = {
  writing: IconPencil,
  "import-document": IconFileImport,
  "series-writing": IconBooks,
  "dual-panel-editor": IconArrowsRightLeft,
  "editors-desk": IconClipboardCheck,
  "draft-room": IconArmchair2,
};

const ACCENT_COLOR = "amber";

export function WritingDissolveSurfaceWorkArea({
  group,
  isSuperuser,
  canManagePosts,
  setActiveSection,
}: WritingDissolveSurfaceWorkAreaProps) {
  // null = Writing Reception, the landing (decisions/writing-surface-adr, WR-4).
  const [activeRim, setActiveRim] = useState<RimKey | null>(null);
  // Opening a piece from Reception dissolves in place into WritingEditorWrapper
  // (the same portable editor the classic "write" section renders) instead of
  // escaping to a different GroupWorkArea section — WR-4a, 2026-10-15: "make
  // sure this transition is solid af." `pieceId` undefined = new piece, same
  // contract WritingEditorWrapper already has.
  const [editingPiece, setEditingPiece] = useState<{ pieceId?: string } | null>(null);
  const { dissolving, transitionDuration, dissolveTo } = useDissolve({ regionKey: "writing-dissolve-surface" });

  const sponsor = { type: "group" as const, id: group.id, slug: group.slug, displayName: group.title };

  // Trimmed to the rim per the CTO's "fewer surfaces" direction (2026-10-15):
  // Reception now covers what Writing's own list did (recent/published/new),
  // so Writing, Import Documents, Series Writing and Draft <-> Dispatch are
  // hidden from the rim for now — their code and the classic groupConfig.ts
  // sub-items are untouched, so this is reversible. Draft Room and Editor's
  // Desk stay as the two the CTO named as next most important; a merge
  // between them is a separate, open question (not built here).
  const visibleKeys: RimKey[] = [...(isSuperuser ? (["editors-desk", "draft-room"] as RimKey[]) : [])];

  // No rim position reads as "active" while editing a piece — the editor
  // isn't any one of them, and a stale highlight would be misleading.
  const receptionActive = !editingPiece && activeRim === null;

  const receptionItem: RimPositionItem = {
    id: "reception",
    active: receptionActive,
    content: (
      <Tooltip content="Reception" positioning={{ placement: "right" }}>
        <Box py={2} display="flex" justifyContent="center">
          <IconHome2 size={18} color={receptionActive ? `var(--chakra-colors-${ACCENT_COLOR}-600)` : undefined} />
        </Box>
      </Tooltip>
    ),
    onSelect: () => dissolveTo(() => { setEditingPiece(null); setActiveRim(null); }),
  };

  const items: RimPositionItem[] = [
    receptionItem,
    ...visibleKeys.map((key) => {
      const Icon = RIM_ICONS[key];
      const active = !editingPiece && key === activeRim;
      return {
        id: key,
        active,
        content: (
          <Tooltip content={RIM_LABELS[key]} positioning={{ placement: "right" }}>
            <Box py={2.5} display="flex" justifyContent="center">
              <Icon size={20} color={active ? `var(--chakra-colors-${ACCENT_COLOR}-600)` : undefined} />
            </Box>
          </Tooltip>
        ),
        onSelect: () => dissolveTo(() => { setEditingPiece(null); setActiveRim(key); }),
      };
    }),
  ];

  return (
    <Box display="flex" gap={4} h="100%" minH="0">
      <OuterRim
        items={items}
        placement="left"
        accentColor={ACCENT_COLOR}
        boxProps={{ minW: "52px", borderRight: "1px solid", borderColor: "border.muted", pr: 2 }}
      />
      {/* Centered independently of this component — DashboardLayout's sidebar
          (50px collapsed / 230px only while temporarily expanded) is left
          out of the calc on purpose; centering here keeps the work area
          stable rather than re-centering around a transient width. */}
      <Box flex="1" minH="0" maxW="1200px" mx="auto" opacity={dissolving ? 0 : 1} transition={`opacity ${transitionDuration} ease`}>
        {editingPiece ? (
          <WritingEditorWrapper
            sponsor={sponsor}
            writingKind="post"
            pieceId={editingPiece.pieceId}
            onBack={() => dissolveTo(() => setEditingPiece(null))}
            backLabel="Back to Reception"
          />
        ) : (
          <>
            {activeRim === null && (
              <WritingReception
                sponsor={sponsor}
                canCreatePost={canManagePosts}
                showOpenIssues={isSuperuser}
                onOpenPiece={(pieceId) => dissolveTo(() => setEditingPiece({ pieceId }))}
                onGoToIssues={() => dissolveTo(() => setActiveRim("editors-desk"))}
              />
            )}
            {activeRim !== null && (
              <Heading size="sm" mb={3} color="fg.muted" borderLeft="3px solid" borderColor={`${ACCENT_COLOR}.500`} pl={2}>
                {RIM_LABELS[activeRim]}
              </Heading>
            )}
            {activeRim === "writing" && (
              <SponsorWritingWrapper sponsor={sponsor} setActiveSection={setActiveSection} canManagePosts={canManagePosts} />
            )}
            {activeRim === "import-document" && (
              <DocumentImportWorkArea
                sponsor={sponsor}
                onImported={(piece) => setActiveSection("write", { piece: piece.id })}
                onBack={() => dissolveTo(() => setActiveRim("writing"))}
              />
            )}
            {activeRim === "series-writing" && (
              <SeriesWritingWorkArea
                sponsor={sponsor}
                onNavigateToEditor={(pieceId) => {
                  if (pieceId) setActiveSection("write", { piece: pieceId });
                  else setActiveSection("write");
                }}
                onNavigateToDetail={({ slug }) => setActiveSection("write", { piece: slug })}
              />
            )}
            {activeRim === "dual-panel-editor" && <DualPanelEditorWorkArea sponsor={sponsor} />}
            {activeRim === "editors-desk" && (
              <EditorsDeskWorkArea
                sponsor={sponsor}
                onOpenPiece={(pieceId, issueId) =>
                  setActiveSection("write", {
                    piece: pieceId,
                    returnTo: "editors-desk",
                    ...(issueId ? { issue: issueId } : {}),
                  })
                }
              />
            )}
            {activeRim === "draft-room" && <DraftRoomWorkArea sponsor={sponsor} setActiveSection={setActiveSection} />}
          </>
        )}
      </Box>
    </Box>
  );
}

export default WritingDissolveSurfaceWorkArea;

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
import { Box, Heading, Text } from "@chakra-ui/react";
import { OuterRim, useDissolve, type RimPositionItem } from "@mixtape/ui/dissolve";
import type { Group } from "@mixtape/core/types/groupTypes";

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

export function WritingDissolveSurfaceWorkArea({
  group,
  isSuperuser,
  canManagePosts,
  setActiveSection,
}: WritingDissolveSurfaceWorkAreaProps) {
  const [activeRim, setActiveRim] = useState<RimKey>("writing");
  const { dissolving, transitionDuration, dissolveTo } = useDissolve({ regionKey: "writing-dissolve-surface" });

  const sponsor = { type: "group" as const, id: group.id, slug: group.slug, displayName: group.title };

  const visibleKeys: RimKey[] = [
    "writing",
    "import-document",
    "series-writing",
    "dual-panel-editor",
    ...(isSuperuser ? (["editors-desk", "draft-room"] as RimKey[]) : []),
  ];

  const items: RimPositionItem[] = visibleKeys.map((key) => ({
    id: key,
    active: key === activeRim,
    content: (
      <Text fontWeight={key === activeRim ? "semibold" : "normal"}>{RIM_LABELS[key]}</Text>
    ),
    onSelect: () => dissolveTo(() => setActiveRim(key)),
  }));

  return (
    <Box display="flex" gap={4} h="100%" minH="0">
      <OuterRim items={items} placement="left" boxProps={{ minW: "180px", borderRight: "1px solid", borderColor: "border.muted", pr: 4 }} />
      <Box flex="1" minH="0" opacity={dissolving ? 0 : 1} transition={`opacity ${transitionDuration} ease`}>
        <Heading size="sm" mb={3} color="fg.muted">
          Writing Dissolve Surface — pilot (decisions/dissolve-outer-rim-adr)
        </Heading>
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
      </Box>
    </Box>
  );
}

export default WritingDissolveSurfaceWorkArea;

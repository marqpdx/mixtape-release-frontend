"use client";

import WorkAreaWrapper from "@/components/dashboard/shared/WorkAreaWrapper";
import { DualPanelEditor } from "./DualPanelEditor";

export interface DualPanelSponsor {
  type: "group" | "member";
  id?: string;
  slug: string;
  displayName?: string;
}

interface DualPanelEditorWorkAreaProps {
  sponsor: DualPanelSponsor;
}

export function DualPanelEditorWorkArea({ sponsor }: DualPanelEditorWorkAreaProps) {
  return (
    <WorkAreaWrapper padding={0}>
      <DualPanelEditor sponsor={sponsor} />
    </WorkAreaWrapper>
  );
}

"use client";

import WorkAreaWrapper from "@/components/dashboard/shared/WorkAreaWrapper";
import { DualPanelEditor } from "./DualPanelEditor";

interface Sponsor {
  type: "group" | "member";
  slug: string;
  displayName?: string;
}

interface DualPanelEditorWorkAreaProps {
  sponsor: Sponsor;
}

export function DualPanelEditorWorkArea({ sponsor }: DualPanelEditorWorkAreaProps) {
  return (
    <WorkAreaWrapper padding={0}>
      <DualPanelEditor sponsor={sponsor} />
    </WorkAreaWrapper>
  );
}

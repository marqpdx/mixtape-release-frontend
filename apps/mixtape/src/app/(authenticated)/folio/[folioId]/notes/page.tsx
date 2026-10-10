"use client";

import { use } from "react";
import FolioWorkbench from "@/components/folio/workbench/FolioWorkbench";

// Folio Notes PoC Phase 5 — the desktop Workbench for one Folio's notes.

export default function FolioWorkbenchPage({ params }: { params: Promise<{ folioId: string }> }) {
  const { folioId } = use(params);
  return <FolioWorkbench folioId={folioId} />;
}

// app/(root)/writing/desk/[deskSlug]/page.tsx
// ADR-0054 P1-10 (renamed from WritingRun per Phase 3 amendment): Minimal reader view for a published Issue.
// Route uses "desk" (Editor's Desk), not "issue", per Phase 3 frontend-surface rename — see decisions/writing-assembly-adr/writing-assembly-status.md.

import { Metadata } from "next";
import DeskReaderPageClient from "./DeskReaderPageClient";

interface Props {
  params: Promise<{ deskSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { deskSlug } = await params;
  return { title: `Issue — ${deskSlug}` };
}

export default async function DeskReaderPage({ params }: Props) {
  const { deskSlug } = await params;
  return <DeskReaderPageClient deskSlug={deskSlug} />;
}

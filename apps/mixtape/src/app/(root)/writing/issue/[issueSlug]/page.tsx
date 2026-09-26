// app/(root)/writing/issue/[issueSlug]/page.tsx
// ADR-0054 P1-10 (renamed from WritingRun per Phase 3 amendment): Minimal reader view for a published Issue

import { Metadata } from "next";
import IssueReaderPageClient from "./IssueReaderPageClient";

interface Props {
  params: Promise<{ issueSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { issueSlug } = await params;
  return { title: `Issue — ${issueSlug}` };
}

export default async function IssueReaderPage({ params }: Props) {
  const { issueSlug } = await params;
  return <IssueReaderPageClient issueSlug={issueSlug} />;
}

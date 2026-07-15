// app/(root)/writing/run/[runSlug]/page.tsx
// ADR-0054 P1-10: Minimal reader view for a published WritingRun

import { Metadata } from "next";
import RunReaderPageClient from "./RunReaderPageClient";

interface Props {
  params: Promise<{ runSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { runSlug } = await params;
  return { title: `Run — ${runSlug}` };
}

export default async function RunReaderPage({ params }: Props) {
  const { runSlug } = await params;
  return <RunReaderPageClient runSlug={runSlug} />;
}

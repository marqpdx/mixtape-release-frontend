// apps/crossroads/src/app/(main)/(content)/working-papers/[packet]/[paper]/full/page.tsx
//
// The paper itself, with the response form at its foot.

import { notFound } from "next/navigation";
import {
  Intro,
  PageHeader,
  ProseHtml,
  Respond,
  StatusBadge,
  twoDigits,
  WorkingPapersShell,
} from "@/components/working-papers/WorkingPapers";
import { WorkingPaperResponseForm } from "@/components/working-papers/WorkingPaperResponseForm";
import { formatDate, listPacketSlugs, listPaperSlugs, loadPacket, loadPaper, WORKING_PAPERS_ROBOTS } from "@/lib/workingPapers";

export const dynamic = "force-static";
export const dynamicParams = false;

type Params = { packet: string; paper: string };

export function generateStaticParams(): Params[] {
  return listPacketSlugs().flatMap((packet) => listPaperSlugs(packet).map((paper) => ({ packet, paper })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { packet, paper } = await params;
  const page = await loadPaper(packet, paper);
  return {
    title: `${page?.title ?? "Working Paper"} | Crossroads`,
    description: page?.summary || undefined,
    robots: WORKING_PAPERS_ROBOTS,
  };
}

export default async function PaperPage({ params }: { params: Promise<Params> }) {
  const { packet: packetSlug, paper } = await params;
  const [packet, page] = await Promise.all([loadPacket(packetSlug), loadPaper(packetSlug, paper)]);
  if (!packet || !page) notFound();
  const index = packet.papers.findIndex((p) => p.slug === paper);
  const position = index >= 0 ? `${packet.title}, paper ${index + 1} of ${packet.papers.length}` : packet.title;

  return (
    <WorkingPapersShell
      kind="paper"
      crumbs={[
        { label: "Working Papers", href: "/working-papers" },
        { label: packet.title, href: `/working-papers/${packet.slug}` },
        { label: "TL;DR", href: `/working-papers/${packet.slug}/${paper}` },
        { label: "Paper" },
      ]}
    >
      <PageHeader
        eyebrow={index >= 0 ? `Working paper · ${packet.title} ${twoDigits(index + 1)}` : "Working paper"}
        title={page.title}
        meta={[
          { term: "Status", value: <StatusBadge status={page.status} /> },
          ...(page.version ? [{ term: "Version", value: page.version, showTerm: true }] : []),
          ...(page.date ? [{ term: "Dated", value: formatDate(page.date) }] : []),
          { term: "In this packet", value: position },
        ]}
      />
      {page.summary && (
        <Intro>
          <p>{page.summary}</p>
        </Intro>
      )}
      <ProseHtml html={page.html} />
      <Respond>
        <WorkingPaperResponseForm paperTitle={page.title} paperVersion={page.version} packet={packet.slug} />
      </Respond>
    </WorkingPapersShell>
  );
}

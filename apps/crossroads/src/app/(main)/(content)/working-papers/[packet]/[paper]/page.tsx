// apps/crossroads/src/app/(main)/(content)/working-papers/[packet]/[paper]/page.tsx
//
// A paper's TL;DR: the middle of the three layers, between the packet's
// 3-line summary and the paper itself.

import { notFound } from "next/navigation";
import {
  PageHeader,
  PaperNav,
  StatusBadge,
  TldrBody,
  twoDigits,
  WorkingPapersShell,
} from "@/components/working-papers/WorkingPapers";
import { formatDate, listPacketSlugs, listPaperSlugs, loadPacket, loadTldr, WORKING_PAPERS_ROBOTS } from "@/lib/workingPapers";

export const dynamic = "force-static";
export const dynamicParams = false;

type Params = { packet: string; paper: string };

export function generateStaticParams(): Params[] {
  return listPacketSlugs().flatMap((packet) => listPaperSlugs(packet).map((paper) => ({ packet, paper })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { packet, paper } = await params;
  const tldr = await loadTldr(packet, paper);
  return {
    title: `${tldr?.title ?? "Working Paper"}: TL;DR | Crossroads`,
    description: tldr?.summary || undefined,
    robots: WORKING_PAPERS_ROBOTS,
  };
}

export default async function TldrPage({ params }: { params: Promise<Params> }) {
  const { packet: packetSlug, paper } = await params;
  const [packet, tldr] = await Promise.all([loadPacket(packetSlug), loadTldr(packetSlug, paper)]);
  if (!packet || !tldr) notFound();
  const index = packet.papers.findIndex((p) => p.slug === paper);
  const next = index >= 0 ? packet.papers[index + 1] : undefined;
  const position = index >= 0 ? `${packet.title}, paper ${index + 1} of ${packet.papers.length}` : packet.title;

  return (
    <WorkingPapersShell
      kind="tldr"
      crumbs={[
        { label: "Working Papers", href: "/working-papers" },
        { label: packet.title, href: `/working-papers/${packet.slug}` },
        { label: "TL;DR" },
      ]}
    >
      <PageHeader
        eyebrow={index >= 0 ? `TL;DR · ${packet.title} ${twoDigits(index + 1)}` : "TL;DR"}
        title={tldr.title}
        meta={[
          { term: "Status", value: <StatusBadge status={tldr.status} /> },
          ...(tldr.version ? [{ term: "Version", value: tldr.version, showTerm: true }] : []),
          ...(tldr.date ? [{ term: "Dated", value: formatDate(tldr.date) }] : []),
          { term: "In this packet", value: position },
        ]}
      />
      <TldrBody html={tldr.html} types={tldr.types} namesHtml={tldr.namesHtml} />
      <PaperNav
        full={`/working-papers/${packet.slug}/${paper}/full`}
        next={next && { href: `/working-papers/${packet.slug}/${next.slug}`, title: next.title }}
      />
    </WorkingPapersShell>
  );
}

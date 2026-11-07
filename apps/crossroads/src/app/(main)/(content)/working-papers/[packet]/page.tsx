// apps/crossroads/src/app/(main)/(content)/working-papers/[packet]/page.tsx
//
// A packet's overview: about five papers, each with its 3-line summary, its
// status and links to its TL;DR and to the paper itself.

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  EntryList,
  PageHeader,
  PaperStamp,
  ProseHtml,
  WorkingPapersShell,
} from "@/components/working-papers/WorkingPapers";
import {
  formatDate,
  listPackets,
  listPacketSlugs,
  loadPacket,
  paperCount,
  statusSplit,
  WORKING_PAPERS_ROBOTS,
} from "@/lib/workingPapers";

export const dynamic = "force-static";
export const dynamicParams = false;

type Params = { packet: string };

export function generateStaticParams(): Params[] {
  return listPacketSlugs().map((packet) => ({ packet }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const packet = await loadPacket((await params).packet);
  return {
    title: `${packet?.title ?? "Working Papers"} | Crossroads`,
    description: packet?.summary || undefined,
    robots: WORKING_PAPERS_ROBOTS,
  };
}

export default async function PacketPage({ params }: { params: Promise<Params> }) {
  const packet = await loadPacket((await params).packet);
  if (!packet) notFound();
  const companions = (await listPackets()).filter((other) => other.slug !== packet.slug);

  return (
    <WorkingPapersShell
      kind="packet"
      crumbs={[{ label: "Working Papers", href: "/working-papers" }, { label: packet.title }]}
    >
      <PageHeader
        eyebrow="Working paper packet"
        title={packet.title}
        meta={[
          ...(packet.date ? [{ term: "Published", value: formatDate(packet.date) }] : []),
          {
            term: "Papers",
            value: [paperCount(packet.papers.length), statusSplit(packet.papers)].filter(Boolean).join(" · "),
          },
          ...(companions.length > 0
            ? [
                {
                  term: "Companion packets",
                  showTerm: true,
                  value: companions.map((other, i) => (
                    <span key={other.slug}>
                      {i > 0 && ", "}
                      <Link href={`/working-papers/${other.slug}`}>{other.title}</Link>
                    </span>
                  )),
                },
              ]
            : []),
        ]}
      />
      <ProseHtml html={packet.html} intro />
      <EntryList
        heading="The papers"
        numberWord="Paper"
        entries={packet.papers.map((paper) => {
          const base = `/working-papers/${packet.slug}/${paper.slug}`;
          return {
            key: paper.slug,
            href: base,
            title: paper.title,
            stamp: <PaperStamp status={paper.status} version={paper.version} />,
            summary: paper.summary,
            links: [
              { href: base, label: "TL;DR" },
              { href: `${base}/full`, label: "Read the paper →" },
            ],
          };
        })}
      />
    </WorkingPapersShell>
  );
}

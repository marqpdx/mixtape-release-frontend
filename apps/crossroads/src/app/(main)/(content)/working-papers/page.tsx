// apps/crossroads/src/app/(main)/(content)/working-papers/page.tsx
//
// Working Papers: lists the packets. Unlisted (noindex, linked from nowhere);
// readers arrive by a URL sent to them.

import { EntryList, Intro, PageHeader, WorkingPapersShell } from "@/components/working-papers/WorkingPapers";
import { formatDate, listPackets, paperCount, statusSplit, WORKING_PAPERS_ROBOTS } from "@/lib/workingPapers";

export const dynamic = "force-static";

export const metadata = {
  title: "Working Papers | Crossroads",
  description: "Dated working papers, open to correction before 1.0.",
  robots: WORKING_PAPERS_ROBOTS,
};

export default async function WorkingPapersPage() {
  const packets = await listPackets();
  const papers = packets.flatMap((packet) => packet.papers);

  return (
    <WorkingPapersShell kind="index" crumbs={[{ label: "Working Papers" }]}>
      <PageHeader
        title="Working Papers"
        meta={[
          { term: "Packets", value: `${packets.length} ${packets.length === 1 ? "packet" : "packets"}` },
          { term: "Papers", value: [paperCount(papers.length), statusSplit(papers)].filter(Boolean).join(" · ") },
        ]}
      />
      <Intro>
        <p>
          Work in progress, dated and versioned, and open to correction before it reaches 1.0. Each packet
          gathers a few recent papers: a short summary, a TL;DR, then the paper itself.
        </p>
      </Intro>
      {packets.length === 0 ? (
        <p>No packets yet.</p>
      ) : (
        <EntryList
          heading="Packets"
          numberWord="Packet"
          entries={packets.map((packet) => ({
            key: packet.slug,
            href: `/working-papers/${packet.slug}`,
            title: packet.title,
            stamp: [packet.date && formatDate(packet.date), paperCount(packet.papers.length), statusSplit(packet.papers)]
              .filter(Boolean)
              .join(" · "),
            summary: packet.summary,
          }))}
        />
      )}
    </WorkingPapersShell>
  );
}

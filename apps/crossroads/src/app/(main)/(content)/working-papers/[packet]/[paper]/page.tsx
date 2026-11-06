// apps/crossroads/src/app/(main)/(content)/working-papers/[packet]/[paper]/page.tsx
//
// A paper's TL;DR: the middle of the three layers, between the packet's
// 3-line summary and the paper itself.

import Link from "next/link";
import { notFound } from "next/navigation";
import { Heading, Stack } from "@chakra-ui/react";
import { Prose } from "@/components/ui/prose";
import { PaperStamp, WorkingPaperShell } from "@/components/working-papers/WorkingPaperShell";
import { listPacketSlugs, listPaperSlugs, loadPacket, loadTldr, WORKING_PAPERS_ROBOTS } from "@/lib/workingPapers";

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

  return (
    <WorkingPaperShell
      crumbs={[
        { label: "Working Papers", href: "/working-papers" },
        { label: packet.title, href: `/working-papers/${packet.slug}` },
        { label: "TL;DR" },
      ]}
    >
      <Stack gap={3}>
        <Heading as="h1" size="2xl">
          {tldr.title}
        </Heading>
        <PaperStamp version={tldr.version} date={tldr.date} />
        <Heading as="h2" size="md" mt={4}>
          TL;DR
        </Heading>
        <Prose maxW="none" dangerouslySetInnerHTML={{ __html: tldr.html }} />
        <Link
          href={`/working-papers/${packet.slug}/${paper}/full`}
          style={{ textDecoration: "underline", fontWeight: 600, marginTop: "1.5rem" }}
        >
          Read the full paper →
        </Link>
      </Stack>
    </WorkingPaperShell>
  );
}

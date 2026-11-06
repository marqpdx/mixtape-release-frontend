// apps/crossroads/src/app/(main)/(content)/working-papers/[packet]/[paper]/full/page.tsx
//
// The paper itself, with the response form at its foot.

import { notFound } from "next/navigation";
import { Heading, Stack, Text } from "@chakra-ui/react";
import { Prose } from "@/components/ui/prose";
import { PaperStamp, WorkingPaperShell } from "@/components/working-papers/WorkingPaperShell";
import { WorkingPaperResponseForm } from "@/components/working-papers/WorkingPaperResponseForm";
import { listPacketSlugs, listPaperSlugs, loadPacket, loadPaper, WORKING_PAPERS_ROBOTS } from "@/lib/workingPapers";

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

  return (
    <WorkingPaperShell
      crumbs={[
        { label: "Working Papers", href: "/working-papers" },
        { label: packet.title, href: `/working-papers/${packet.slug}` },
        { label: "TL;DR", href: `/working-papers/${packet.slug}/${paper}` },
        { label: "Paper" },
      ]}
    >
      <Stack gap={3}>
        <Heading as="h1" size="2xl">
          {page.title}
        </Heading>
        <PaperStamp version={page.version} date={page.date} />
        {page.summary && (
          <Text fontSize="lg" color="fg.muted">
            {page.summary}
          </Text>
        )}
        <Prose maxW="none" mt={4} dangerouslySetInnerHTML={{ __html: page.html }} />
      </Stack>
      <WorkingPaperResponseForm paperTitle={page.title} paperVersion={page.version} packet={packet.slug} />
    </WorkingPaperShell>
  );
}

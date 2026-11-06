// apps/crossroads/src/app/(main)/(content)/working-papers/[packet]/page.tsx
//
// A packet's overview: about five papers, each with its 3-line summary and
// links to its TL;DR and to the paper itself.

import Link from "next/link";
import { notFound } from "next/navigation";
import { Box, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { Prose } from "@/components/ui/prose";
import { WorkingPaperShell } from "@/components/working-papers/WorkingPaperShell";
import { listPacketSlugs, loadPacket, WORKING_PAPERS_ROBOTS } from "@/lib/workingPapers";

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

  return (
    <WorkingPaperShell crumbs={[{ label: "Working Papers", href: "/working-papers" }, { label: packet.title }]}>
      <Stack gap={3} mb={8}>
        <Heading as="h1" size="2xl">
          {packet.title}
        </Heading>
        {packet.date && (
          <Text fontSize="sm" color="fg.muted">
            {packet.date}
          </Text>
        )}
        {packet.html && <Prose maxW="none" dangerouslySetInnerHTML={{ __html: packet.html }} />}
      </Stack>

      <Stack as="ol" gap={8} listStyleType="none">
        {packet.papers.map((paper) => {
          const base = `/working-papers/${packet.slug}/${paper.slug}`;
          return (
            <Box as="li" key={paper.slug} borderTopWidth="1px" pt={6}>
              <Heading as="h2" size="lg">
                <Link href={base}>{paper.title}</Link>
              </Heading>
              {paper.version && (
                <Text fontSize="sm" color="fg.muted" mt={1}>
                  Version {paper.version}
                </Text>
              )}
              {paper.summary && <Text mt={3}>{paper.summary}</Text>}
              <HStack gap={5} mt={3} fontWeight="medium">
                <Link href={base} style={{ textDecoration: "underline" }}>
                  TL;DR
                </Link>
                <Link href={`${base}/full`} style={{ textDecoration: "underline" }}>
                  Read the paper
                </Link>
              </HStack>
            </Box>
          );
        })}
      </Stack>
    </WorkingPaperShell>
  );
}

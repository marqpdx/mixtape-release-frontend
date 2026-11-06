// apps/crossroads/src/app/(main)/(content)/working-papers/page.tsx
//
// Working Papers: lists the packets. Unlisted (noindex, linked from nowhere);
// readers arrive by a URL sent to them.

import Link from "next/link";
import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { WorkingPaperShell } from "@/components/working-papers/WorkingPaperShell";
import { formatDate, listPackets, WORKING_PAPERS_ROBOTS } from "@/lib/workingPapers";

export const dynamic = "force-static";

export const metadata = {
  title: "Working Papers | Crossroads",
  description: "Dated working papers, open to correction before 1.0.",
  robots: WORKING_PAPERS_ROBOTS,
};

export default async function WorkingPapersPage() {
  const packets = await listPackets();

  return (
    <WorkingPaperShell crumbs={[{ label: "Working Papers" }]}>
      <Stack gap={4} mb={10}>
        <Heading as="h1" size="2xl">
          Working Papers
        </Heading>
        <Text fontSize="lg" color="fg.muted">
          Work in progress, dated and versioned, and open to correction before it reaches 1.0. Each packet
          gathers a few recent papers: a short summary, a TL;DR, then the paper itself.
        </Text>
      </Stack>

      {packets.length === 0 ? (
        <Text color="fg.muted">No packets yet.</Text>
      ) : (
        <Stack as="ul" gap={6} listStyleType="none">
          {packets.map((packet) => (
            <Box as="li" key={packet.slug} borderTopWidth="1px" pt={6}>
              <Link href={`/working-papers/${packet.slug}`}>
                <Heading as="h2" size="lg" textDecoration="underline">
                  {packet.title}
                </Heading>
              </Link>
              <Text fontSize="sm" color="fg.muted" mt={1}>
                {[packet.date && formatDate(packet.date), `${packet.papers.length} ${packet.papers.length === 1 ? "paper" : "papers"}`].filter(Boolean).join(" · ")}
              </Text>
              {packet.summary && <Text mt={2}>{packet.summary}</Text>}
            </Box>
          ))}
        </Stack>
      )}
    </WorkingPaperShell>
  );
}

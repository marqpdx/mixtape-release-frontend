// apps/crossroads/src/app/(main)/(content)/code-summary/[span]/page.tsx
//
// A code summary on its own public page: what ideas became code over a span
// (CTO, 2026-11-06). Its TL;DR leads, then the summary, then the response form.
// Unlike Working Papers it is public and indexed, with no trail up to them.

import { notFound } from "next/navigation";
import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { Prose } from "@/components/ui/prose";
import { PaperStamp, WorkingPaperShell } from "@/components/working-papers/WorkingPaperShell";
import { WorkingPaperResponseForm } from "@/components/working-papers/WorkingPaperResponseForm";
import { listCodeSummarySlugs, loadCodeSummary } from "@/lib/workingPapers";

export const dynamic = "force-static";
export const dynamicParams = false;

type Params = { span: string };

export function generateStaticParams(): Params[] {
  return listCodeSummarySlugs().map((span) => ({ span }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const summary = await loadCodeSummary((await params).span);
  return {
    title: `${summary?.paper.title ?? "Code summary"} | Crossroads`,
    description: summary?.paper.summary || summary?.tldr?.summary || undefined,
  };
}

export default async function CodeSummaryPage({ params }: { params: Promise<Params> }) {
  const { span } = await params;
  const summary = await loadCodeSummary(span);
  if (!summary) notFound();
  const { tldr, paper } = summary;

  return (
    <WorkingPaperShell crumbs={[{ label: "Code summary" }]} notPublic={false}>
      <Stack gap={3}>
        <Heading as="h1" size="2xl">
          {paper.title}
        </Heading>
        <PaperStamp version={paper.version} date={paper.date} />
        {paper.summary && (
          <Text fontSize="lg" color="fg.muted">
            {paper.summary}
          </Text>
        )}
        {tldr && (
          <Box as="section" aria-labelledby="tldr-heading" mt={4} p={5} borderWidth="1px" borderRadius="md">
            <Heading as="h2" id="tldr-heading" size="md" mb={2}>
              TL;DR
            </Heading>
            <Prose maxW="none" dangerouslySetInnerHTML={{ __html: tldr.html }} />
          </Box>
        )}
        <Prose maxW="none" mt={4} dangerouslySetInnerHTML={{ __html: paper.html }} />
      </Stack>
      <WorkingPaperResponseForm paperTitle={paper.title} paperVersion={paper.version} packet="code-summary" />
    </WorkingPaperShell>
  );
}

import { Box, Container, Heading, Stack, Text } from "@chakra-ui/react";
import { listHelpDocs } from "@/lib/help/helpDocs";
import { HelpIndexClient } from "@/components/help/HelpIndexClient";
import { TechHelpAccessGate } from "@/components/help/TechHelpAccessGate";
import type { HelpDocSummary } from "@/types/help";

export const metadata = {
  title: "Technical Help",
  description: "Technical reference articles for admins and developers.",
};

export default async function TechHelpIndexPage() {
  const docs = await listHelpDocs("tech");
  const adaptedDocs: HelpDocSummary[] = docs.map((doc) => ({
    key: `tech:${doc.slug}`,
    slug: doc.slug,
    feature: doc.feature,
    title: doc.title,
    summary: doc.summary,
    excerpt: doc.summary,
    plainText: doc.plainText,
    headings: doc.headings,
    metadata: {
      status: doc.metadata.status,
      library: doc.metadata.library,
      lastUpdated: doc.metadata.lastUpdated,
      audience: doc.metadata.audience,
      class: doc.metadata.class,
      audit: doc.metadata.audit,
    },
    tags: [],
    subsystem: "technical-reference",
    area: doc.feature,
    workAreas: [],
    routes: [],
  }));

  return (
    <Box as="main" py={{ base: 8, md: 10 }}>
      <Container maxW="6xl" px={{ base: 4, md: 6 }}>
        <TechHelpAccessGate>
          <Stack gap={8}>
            <Stack gap={3}>
              <Heading as="h1" size="2xl">
                Technical Reference
              </Heading>
              <Text fontSize="md" color="fg.muted" maxW="3xl">
                Admin and implementation-oriented help for systems, permissions,
                routes, and operational details.
              </Text>
            </Stack>

            <HelpIndexClient docs={adaptedDocs} baseHref="/help/tech" />
          </Stack>
        </TechHelpAccessGate>
      </Container>
    </Box>
  );
}

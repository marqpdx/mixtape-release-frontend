import NextLink from "next/link";
import { notFound } from "next/navigation";
import { Box, Container, Flex, Link, Stack, Text } from "@chakra-ui/react";
import { getHelpEntryBySlug, listHelpEntries } from "@/lib/help/helpManifest";
import { Prose } from "@components/ui/prose";
import { HelpArticleSidebar } from "@/components/help/HelpArticleSidebar";

interface HelpArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: HelpArticlePageProps) {
  const { slug } = await params;
  const doc = await getHelpEntryBySlug(slug);

  if (!doc) {
    return {
      title: "Help article not found",
    };
  }

  return {
    title: `${doc.title} | Help`,
    description: doc.summary || undefined,
  };
}

export default async function HelpArticlePage({ params }: HelpArticlePageProps) {
  const { slug } = await params;
  const [doc, allDocs] = await Promise.all([getHelpEntryBySlug(slug), listHelpEntries()]);

  if (!doc) {
    notFound();
  }

  const relatedDocs = allDocs
    .filter((candidate) => candidate.slug !== doc.slug)
    .sort((a, b) => {
      const aSameFeature = a.feature === doc.feature ? 0 : 1;
      const bSameFeature = b.feature === doc.feature ? 0 : 1;
      if (aSameFeature !== bSameFeature) return aSameFeature - bSameFeature;
      return a.title.localeCompare(b.title);
    })
    .slice(0, 3);

  return (
    <Box as="main" py={{ base: 8, md: 10 }}>
      <Container maxW="6xl" px={{ base: 4, md: 6 }}>
        <Flex
          direction={{ base: "column", lg: "row" }}
          gap={{ base: 8, lg: 12 }}
          align={{ base: "stretch", lg: "flex-start" }}
        >
          <HelpArticleSidebar
            headings={doc.headings}
            metadataLabel="LIBRARY"
            metadataValue={doc.metadata.library || `help/${doc.feature}`}
          />

          <Box flex="1" minW={0}>
            <Stack gap={5}>
              <Link asChild fontSize="sm" color="fg.muted">
                <NextLink href="/help">← Back to help</NextLink>
              </Link>

              <Stack gap={3}>
                <Text fontSize="sm" color="fg.subtle" textTransform="uppercase" letterSpacing="0.2em">
                  {doc.feature}
                </Text>
                <Text as="h1" fontSize={{ base: "3xl", md: "4xl" }} fontWeight="semibold" color="fg">
                  {doc.title}
                </Text>
                {doc.summary ? (
                  <Text fontSize="lg" color="fg.muted" maxW="3xl">
                    {doc.summary}
                  </Text>
                ) : null}
              </Stack>

              <Prose
                maxW="none"
                intent="article"
                dangerouslySetInnerHTML={{ __html: doc.html }}
              />

              {relatedDocs.length > 0 ? (
                <Stack gap={3} pt={4}>
                  <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="0.22em">
                    Related Help
                  </Text>
                  <Stack gap={2}>
                    {relatedDocs.map((related) => (
                      <Link key={related.slug} asChild color="fg" textDecoration="underline" textUnderlineOffset="3px">
                        <NextLink href={`/help/${related.slug}`}>{related.title}</NextLink>
                      </Link>
                    ))}
                  </Stack>
                </Stack>
              ) : null}
            </Stack>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}

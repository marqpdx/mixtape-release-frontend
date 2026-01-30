// apps/crossroads/src/app/(main)/(content)/about/crossroads/page.tsx

import path from "path";
import { notFound } from "next/navigation";
import { Box, Container, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { loadMarkdownFromRoot } from "@mixtape/content";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import { ArticleSidebar } from "@/components/content/ArticleSidebar";
import { Prose } from "@/components/ui/prose";

export const dynamic = "force-static";

const contentRoot = path.join(process.cwd(), "content");
const contentPath = path.join("about", "crossroads.md");

export async function generateMetadata() {
  try {
    const { frontmatter } = await loadMarkdownFromRoot(contentRoot, contentPath);
    const title =
      typeof frontmatter.title === "string" ? frontmatter.title : "Crossroads";
    const description =
      typeof frontmatter.summary === "string" ? frontmatter.summary : undefined;
    return {
      title: `${title} | Crossroads`,
      description,
    };
  } catch {
    return { title: "Crossroads | About" };
  }
}

export default async function AboutCrossroadsPage() {
  let result;
  try {
    result = await loadMarkdownFromRoot(contentRoot, contentPath);
  } catch {
    notFound();
  }

  if (!result) {
    notFound();
  }

  const { html, headings, frontmatter } = result;
  const title =
    typeof frontmatter.title === "string" ? frontmatter.title : "Crossroads";
  const summary =
    typeof frontmatter.summary === "string" ? frontmatter.summary : undefined;
  const author =
    typeof frontmatter.author === "string" ? frontmatter.author : undefined;
  const tags = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.filter((tag): tag is string => typeof tag === "string")
    : undefined;

  return (
    <>
      <UnifiedNavbar extraCompact />
      <Box as="main" py={{ base: 10, md: 16 }}>
        <Container maxW="6xl" px={{ base: 4, md: 6, lg: 8 }}>
          <Flex
            direction={{ base: "column", lg: "row" }}
            gap={{ base: 8, lg: 14 }}
            align={{ base: "flex-start", lg: "stretch" }}
          >
            <Box w={{ base: "full", lg: "221px" }} display={{ base: "block", lg: "none" }}>
              <ArticleSidebar headings={headings} author={author} tags={tags} />
            </Box>
            <Box display={{ base: "none", lg: "block" }} minW="221px" aria-hidden="true">
              <ArticleSidebar headings={headings} author={author} tags={tags} />
            </Box>
            <Box flex="1">
              <Stack gap={4}>
                <Heading as="h1" size="xl">
                  {title}
                </Heading>
                {summary && (
                  <Text fontSize="lg" color="fg.subtle">
                    {summary}
                  </Text>
                )}
                <Prose maxW="none" dangerouslySetInnerHTML={{ __html: html }} />
              </Stack>
            </Box>
          </Flex>
        </Container>
      </Box>
    </>
  );
}

// (group-landing)/groups/[slug]/writing/page.tsx
//
// Group writing index — all published WritingPieces for this Group.
// Server component. No platform chrome (Decision 11).

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Box, Flex, Text, Grid } from "@chakra-ui/react";
import type { PublicGroup, PublicLibraryPiece } from "@mixtape/api/clients/public/publicApi";
import { GroupPublicFooter } from "../sections/GroupPublicFooter";

const baseUrl = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "";

async function fetchGroup(slug: string): Promise<PublicGroup | null> {
  try {
    const res = await fetch(`${baseUrl}/api/public/groups/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchWriting(slug: string): Promise<PublicLibraryPiece[]> {
  try {
    const res = await fetch(`${baseUrl}/api/public/groups/${slug}/writing`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const group = await fetchGroup(slug);
  if (!group) return { title: "Writing" };
  return {
    title: `Writing — ${group.title}`,
    description: group.quick_intro || undefined,
    openGraph: {
      title: `Writing — ${group.title}`,
      images: group.background_image_url
        ? [{ url: group.background_image_url }]
        : group.profile_image_url
        ? [{ url: group.profile_image_url }]
        : undefined,
    },
  };
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function GroupWritingIndexPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [group, pieces] = await Promise.all([fetchGroup(slug), fetchWriting(slug)]);
  if (!group) notFound();

  const hasBg = !!group.background_image_url;

  return (
    <main className="gwi-root">
      {/* Full-bleed banner — same pattern as T1 */}
      <Box
        className="gwi-banner"
        as="section"
        position="relative"
        minH={{ base: "240px", md: "320px" }}
        display="flex"
        alignItems="flex-end"
        style={
          hasBg
            ? {
                backgroundImage: `url(${group.background_image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : { background: "linear-gradient(135deg, #3730a3 0%, #6d28d9 100%)" }
        }
      >
        <Box
          position="absolute"
          inset={0}
          style={{ background: "rgba(0,0,0,0.45)" }}
        />
        <Box
          className="gwi-banner-content"
          position="relative"
          zIndex={1}
          px={{ base: 6, md: 12, lg: 20 }}
          py={{ base: 8, md: 12 }}
          maxW="720px"
        >
          <Link
            href={`/groups/${slug}`}
            style={{ textDecoration: "none" }}
          >
            <Text
              fontSize="xs"
              fontWeight="600"
              color="whiteAlpha.700"
              textTransform="uppercase"
              letterSpacing="wider"
              mb={3}
              _hover={{ color: "white" }}
            >
              ← {group.title}
            </Text>
          </Link>
          <Text
            as="h1"
            fontSize={{ base: "2xl", md: "3xl" }}
            fontWeight="700"
            color="white"
            lineHeight={1.2}
          >
            Writing
          </Text>
        </Box>
      </Box>

      {/* Writing list */}
      <Box
        className="gwi-list"
        as="section"
        px={{ base: 6, md: 12, lg: 20 }}
        py={{ base: 16, md: 20 }}
        maxW="860px"
      >
        {pieces.length === 0 ? (
          <Text fontSize="md" color="gray.500">
            No published writing yet.
          </Text>
        ) : (
          <Grid templateColumns="1fr" gap={8}>
            {pieces.map((piece) => (
              <Link
                key={piece.id}
                href={`/reading/${piece.slug}`}
                style={{ textDecoration: "none" }}
              >
                <Box
                  className="gwi-piece"
                  borderBottomWidth="1px"
                  borderColor="gray.200"
                  pb={8}
                  _hover={{ "& h2": { textDecoration: "underline" } }}
                >
                  <Text
                    as="h2"
                    fontSize={{ base: "xl", md: "2xl" }}
                    fontWeight="700"
                    lineHeight={1.3}
                    mb={2}
                  >
                    {piece.title}
                  </Text>
                  {piece.excerpt && (
                    <Text
                      fontSize="md"
                      color="gray.600"
                      lineHeight={1.6}
                      mb={3}
                      overflow="hidden"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {piece.excerpt}
                    </Text>
                  )}
                  <Flex align="center" gap={2} flexWrap="wrap">
                    <Text fontSize="sm" color="gray.500">
                      {piece.author.display_name}
                    </Text>
                    {piece.published_at && (
                      <>
                        <Text fontSize="sm" color="gray.400">·</Text>
                        <Text fontSize="sm" color="gray.500">
                          {formatDate(piece.published_at)}
                        </Text>
                      </>
                    )}
                    {piece.reading_time && (
                      <>
                        <Text fontSize="sm" color="gray.400">·</Text>
                        <Text fontSize="sm" color="gray.500">
                          {piece.reading_time} min read
                        </Text>
                      </>
                    )}
                  </Flex>
                </Box>
              </Link>
            ))}
          </Grid>
        )}
      </Box>

      <GroupPublicFooter groupTitle={group.title} />
    </main>
  );
}

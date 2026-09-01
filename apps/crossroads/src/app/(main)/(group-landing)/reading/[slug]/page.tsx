// (group-landing)/reading/[slug]/page.tsx
//
// Public WritingPiece reader. Server component for SSR + metadata.
// No platform chrome (Decision 11). Back link → sponsoring group when known.

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Box, Flex, Text } from "@chakra-ui/react";
import type { PublicWritingPiece } from "@mixtape/api/clients/public/publicApi";
import { PieceBody } from "./PieceBody";
import { GroupPublicFooter } from "../../groups/[slug]/sections/GroupPublicFooter";

const baseUrl = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "";

async function fetchPiece(slug: string): Promise<PublicWritingPiece | null> {
  try {
    const res = await fetch(`${baseUrl}/api/public/writing/${slug}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const piece = await fetchPiece(slug);
  if (!piece) return { title: "Writing" };
  return {
    title: piece.title,
    description: piece.excerpt || undefined,
    openGraph: {
      title: piece.title,
      description: piece.excerpt || undefined,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PublicPieceReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const piece = await fetchPiece(slug);
  if (!piece) notFound();

  const backHref = piece.sponsor_group
    ? `/groups/${piece.sponsor_group.slug}/writing`
    : `/members/${piece.author.username}`;
  const backLabel = piece.sponsor_group
    ? `← ${piece.sponsor_group.title}`
    : `← ${piece.author.display_name}`;

  const footerTitle = piece.sponsor_group?.title ?? piece.author.display_name;

  return (
    <main className="gpr-root">
      <Box
        className="gpr-content"
        px={{ base: 6, md: 12, lg: 20 }}
        py={{ base: 10, md: 14 }}
        maxW="760px"
        mx="auto"
      >
        {/* Back link */}
        <Link href={backHref} style={{ textDecoration: "none" }}>
          <Text
            fontSize="sm"
            fontWeight="500"
            color="indigo.600"
            mb={8}
            display="inline-block"
            _hover={{ textDecoration: "underline" }}
          >
            {backLabel}
          </Text>
        </Link>

        {/* Header */}
        <Text
          as="h1"
          fontSize={{ base: "3xl", md: "4xl" }}
          fontWeight="700"
          lineHeight={1.2}
          mb={4}
        >
          {piece.title}
        </Text>

        <Flex
          className="gpr-meta"
          align="center"
          gap={2}
          flexWrap="wrap"
          mb={10}
        >
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
          {piece.writing_kind && (
            <>
              <Text fontSize="sm" color="gray.400">·</Text>
              <Text fontSize="sm" color="gray.500" textTransform="capitalize">
                {piece.writing_kind.replace(/_/g, " ")}
              </Text>
            </>
          )}
        </Flex>

        {/* Body — rendered via client component to accommodate TipTap hooks */}
        {piece.body_json && <PieceBody body_json={piece.body_json} />}
      </Box>

      <GroupPublicFooter groupTitle={footerTitle} />
    </main>
  );
}

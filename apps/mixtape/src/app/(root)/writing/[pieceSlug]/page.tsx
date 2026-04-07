// src/app/(root)/writing/[pieceSlug]/page.tsx

import type { Metadata } from "next";
import WritingPublicPageClient from "./WritingPublicPageClient";

const ROOT_API_URL = process.env.NEXT_PUBLIC_ROOT_API_URL ?? "http://127.0.0.1:8010";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3010";

async function fetchPiece(slug: string) {
  try {
    const res = await fetch(`${ROOT_API_URL}/api/writing/pieces/view/${slug}`, {
      next: { revalidate: 60 },
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
  params: Promise<{ pieceSlug: string }>;
}): Promise<Metadata> {
  const { pieceSlug } = await params;
  const piece = await fetchPiece(pieceSlug);

  if (!piece) {
    return { title: "Writing" };
  }

  const title = piece.title || "Untitled";
  const description = piece.excerpt || piece.synopsis?.teaser || "";
  const url = `${SITE_URL}/writing/${pieceSlug}`;
  const image = piece.og_image || piece.synopsis?.thumbnail_url || undefined;

  return {
    title,
    description: description || undefined,
    openGraph: {
      title,
      description: description || undefined,
      url,
      type: "article",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description: description || undefined,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function WritingPublicPage({
  params,
}: {
  params: Promise<{ pieceSlug: string }>;
}) {
  const { pieceSlug } = await params;
  return <WritingPublicPageClient pieceSlug={pieceSlug} />;
}

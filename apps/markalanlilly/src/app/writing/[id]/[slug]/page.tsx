import type { Metadata } from "next";
import Link from "next/link";

import { PieceBody } from "@/components/PieceBody";
import { StateNotice } from "@/components/StateNotice";
import { formatPublishedDate, loadWritingPiece } from "@/lib/public-site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reading" };

interface WritingPiecePageProps {
  params: Promise<{ id: string; slug: string }>;
}

export default async function WritingPiecePage({ params }: WritingPiecePageProps) {
  const { id } = await params;
  const result = await loadWritingPiece(id);
  if (!result.data) return <StateNotice>{result.error}</StateNotice>;

  const piece = result.data;

  return (
    <main className="mals-reading-page">
      <Link className="mals-back-link" href="/writing">
        &lt;- Writing
      </Link>
      <article className="mals-reading-article">
        <header className="mals-reading-header">
          <p>{piece.writing_kind}</p>
          <h1>{piece.title}</h1>
          <div className="mals-reading-byline">
            <span>{piece.author.display_name}</span>
            <time dateTime={piece.published_at}>
              {formatPublishedDate(piece.published_at)}
            </time>
            {piece.sponsor_group && <span>{piece.sponsor_group.title}</span>}
          </div>
          {piece.excerpt && <div className="mals-reading-excerpt">{piece.excerpt}</div>}
        </header>
        <PieceBody content={piece.body_json} />
      </article>
    </main>
  );
}

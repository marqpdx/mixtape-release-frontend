import Image from "next/image";
import Link from "next/link";

import { CatalogLayout } from "@/components/CatalogLayout";
import { StateNotice } from "@/components/StateNotice";
import { WritingList } from "@/components/WritingList";
import { loadCatalog } from "@/lib/public-site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const catalog = await loadCatalog({ limit: 8 });

  return (
    <main className="mals-home">
      <section className="mals-home-hero">
        <div className="mals-hero-image">
          <Image
            src="/images/land-at-dusk.jpg"
            alt="A green field and tree-covered mountains beneath a wide evening sky"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 70vw"
          />
          <div className="mals-hero-caption">
            <span>Field note 001</span>
            <p>Attention changes the shape of a place.</p>
          </div>
        </div>
        <div className="mals-hero-notes">
          <Link className="mals-note-card is-lime" href="/about">
            <span>About</span>
            <p>
              A life of inquiry, service, repair, and making room for what is
              still becoming known.
            </p>
          </Link>
          <Link className="mals-note-card is-amber" href="/writing">
            <span>Writing</span>
            <p>
              Notes from lived experience, attentive work, and the long
              practice of becoming more human.
            </p>
          </Link>
        </div>
      </section>

      {catalog.data ? (
        <CatalogLayout facets={catalog.data.facets}>
          <section className="mals-section mals-recent-section">
            <div className="mals-section-heading">
              <p>From the archive and the present</p>
              <h1>Recent writing</h1>
            </div>
            <WritingList items={catalog.data.items} compact />
            <Link className="mals-text-link" href="/writing">
              Browse all public writing <span aria-hidden="true">-&gt;</span>
            </Link>
          </section>
        </CatalogLayout>
      ) : (
        <StateNotice>{catalog.error}</StateNotice>
      )}
    </main>
  );
}

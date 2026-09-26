import type { Metadata } from "next";
import Link from "next/link";

import { CatalogLayout } from "@/components/CatalogLayout";
import { StateNotice } from "@/components/StateNotice";
import { loadCatalog } from "@/lib/public-site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Collections" };

export default async function CollectionsPage() {
  const catalog = await loadCatalog({ limit: 1 });
  if (!catalog.data) return <StateNotice>{catalog.error}</StateNotice>;

  return (
    <CatalogLayout facets={catalog.data.facets}>
      <section className="mals-section mals-taxonomy-page">
        <div className="mals-section-heading">
          <p>Curated gatherings of related work</p>
          <h1>Collections</h1>
        </div>
        <div className="mals-taxonomy-grid">
          {catalog.data.facets.collections.map((collection) => (
            <Link
              className="mals-taxonomy-card"
              href={`/collections/${encodeURIComponent(collection.key)}`}
              key={collection.key}
            >
              <small>{collection.sponsor.title}</small>
              <h2>{collection.title}</h2>
              {collection.summary && <p>{collection.summary}</p>}
              <strong>{collection.count} pieces</strong>
            </Link>
          ))}
        </div>
      </section>
    </CatalogLayout>
  );
}

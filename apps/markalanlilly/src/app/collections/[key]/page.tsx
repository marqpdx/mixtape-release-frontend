import type { Metadata } from "next";

import { CatalogLayout } from "@/components/CatalogLayout";
import { StateNotice } from "@/components/StateNotice";
import { WritingList } from "@/components/WritingList";
import { loadCatalog } from "@/lib/public-site";

export const dynamic = "force-dynamic";

interface CollectionPageProps {
  params: Promise<{ key: string }>;
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { key } = await params;
  return { title: key.split(":").at(-1) ?? "Collection" };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { key } = await params;
  const catalog = await loadCatalog({ collection: key });
  if (!catalog.data) return <StateNotice>{catalog.error}</StateNotice>;

  const collection = catalog.data.facets.collections.find((item) => item.key === key);

  return (
    <CatalogLayout facets={catalog.data.facets}>
      <section className="mals-section mals-index-page">
        <div className="mals-section-heading">
          <p>{collection?.sponsor.title ?? "Collection"}</p>
          <h1>{collection?.title ?? "Writing collection"}</h1>
          {collection?.summary && <div className="mals-heading-copy">{collection.summary}</div>}
          <div className="mals-heading-rule" />
        </div>
        <WritingList items={catalog.data.items} />
      </section>
    </CatalogLayout>
  );
}

import type { Metadata } from "next";

import { CatalogLayout } from "@/components/CatalogLayout";
import { StateNotice } from "@/components/StateNotice";
import { WritingList } from "@/components/WritingList";
import { loadCatalog } from "@/lib/public-site";

export const dynamic = "force-dynamic";

interface CategoryPageProps {
  params: Promise<{ key: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { key } = await params;
  return { title: key.split(":").at(-1) ?? "Category" };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { key } = await params;
  const catalog = await loadCatalog({ category: key });
  if (!catalog.data) return <StateNotice>{catalog.error}</StateNotice>;

  const category = catalog.data.facets.categories.find((item) => item.key === key);

  return (
    <CatalogLayout facets={catalog.data.facets}>
      <section className="mals-section mals-index-page">
        <div className="mals-section-heading">
          <p>{category?.sponsor.title ?? "Category"}</p>
          <h1>{category?.title ?? "Writing category"}</h1>
          {category?.summary && <div className="mals-heading-copy">{category.summary}</div>}
          <div className="mals-heading-rule" />
        </div>
        <WritingList items={catalog.data.items} />
      </section>
    </CatalogLayout>
  );
}

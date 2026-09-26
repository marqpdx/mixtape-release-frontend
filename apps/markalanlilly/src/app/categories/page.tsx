import type { Metadata } from "next";
import Link from "next/link";

import { CatalogLayout } from "@/components/CatalogLayout";
import { StateNotice } from "@/components/StateNotice";
import { loadCatalog } from "@/lib/public-site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const catalog = await loadCatalog({ limit: 1 });
  if (!catalog.data) return <StateNotice>{catalog.error}</StateNotice>;

  return (
    <CatalogLayout facets={catalog.data.facets}>
      <section className="mals-section mals-taxonomy-page">
        <div className="mals-section-heading">
          <p>Source-scoped paths through the work</p>
          <h1>Categories</h1>
        </div>
        <div className="mals-taxonomy-grid">
          {catalog.data.facets.categories.map((category) => (
            <Link
              className="mals-taxonomy-card"
              href={`/categories/${encodeURIComponent(category.key)}`}
              key={category.key}
            >
              <small>{category.sponsor.title}</small>
              <h2>{category.title}</h2>
              {category.summary && <p>{category.summary}</p>}
              <strong>{category.count} pieces</strong>
            </Link>
          ))}
        </div>
      </section>
    </CatalogLayout>
  );
}

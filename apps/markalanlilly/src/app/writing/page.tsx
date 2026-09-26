import type { Metadata } from "next";

import { CatalogLayout } from "@/components/CatalogLayout";
import { StateNotice } from "@/components/StateNotice";
import { WritingList } from "@/components/WritingList";
import { loadCatalog } from "@/lib/public-site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Writing" };

interface WritingPageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function WritingPage({ searchParams }: WritingPageProps) {
  const { tag } = await searchParams;
  const catalog = await loadCatalog({ tag });

  if (!catalog.data) return <StateNotice>{catalog.error}</StateNotice>;

  const activeTag = tag
    ? catalog.data.facets.tags.find((item) => item.slug === tag)
    : null;

  return (
    <CatalogLayout facets={catalog.data.facets}>
      <section className="mals-section mals-index-page">
        <div className="mals-section-heading">
          <p>{activeTag ? "Following a thread" : "Notes, essays, and inquiries"}</p>
          <h1>{activeTag?.title ?? "Writing"}</h1>
          <div className="mals-heading-rule" />
        </div>
        <WritingList items={catalog.data.items} />
      </section>
    </CatalogLayout>
  );
}

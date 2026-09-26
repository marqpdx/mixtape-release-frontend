import type { Metadata } from "next";
import Link from "next/link";

import { CatalogLayout } from "@/components/CatalogLayout";
import { StateNotice } from "@/components/StateNotice";
import { formatPublishedDate, loadCatalog } from "@/lib/public-site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Archives" };

interface ArchivesPageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function ArchivesPage({ searchParams }: ArchivesPageProps) {
  const { year: yearValue } = await searchParams;
  const parsedYear = yearValue ? Number.parseInt(yearValue, 10) : undefined;
  const year = Number.isFinite(parsedYear) ? parsedYear : undefined;
  const catalog = await loadCatalog({ year });
  if (!catalog.data) return <StateNotice>{catalog.error}</StateNotice>;

  const monthFormatter = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const grouped = new Map<string, typeof catalog.data.items>();
  for (const item of catalog.data.items) {
    const label = item.published_at
      ? monthFormatter.format(new Date(item.published_at))
      : "Undated";
    grouped.set(label, [...(grouped.get(label) ?? []), item]);
  }

  return (
    <CatalogLayout facets={catalog.data.facets}>
      <section className="mals-section mals-archive-page">
        <div className="mals-section-heading">
          <p>{year ? `A year in the work` : "A record kept over time"}</p>
          <h1>{year ? `Archives: ${year}` : "Recent archives"}</h1>
        </div>
        <div className="mals-archive-list">
          {[...grouped.entries()].map(([month, items]) => (
            <section className="mals-archive-month" key={month}>
              <h2>{month}</h2>
              <ul>
                {items.map((item) => (
                  <li key={item.id}>
                    <span aria-hidden="true">/</span>
                    <div>
                      <Link href={`/writing/${item.id}/${item.slug}`}>
                        {item.title}
                      </Link>
                      <small>{formatPublishedDate(item.published_at, true)}</small>
                      {item.excerpt && <p>{item.excerpt}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </CatalogLayout>
  );
}

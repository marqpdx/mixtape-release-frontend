import Link from "next/link";
import type { PublicSiteWritingResponse } from "@mixtape/api/clients/public/publicApi";

interface CatalogSidebarProps {
  facets: PublicSiteWritingResponse["facets"];
}

export function CatalogSidebar({ facets }: CatalogSidebarProps) {
  return (
    <aside className="mals-sidebar" aria-label="Browse the writing">
      <section className="mals-sidebar-section">
        <h2>Categories</h2>
        {facets.categories.length ? (
          <ul>
            {facets.categories.map((category) => (
              <li key={category.key}>
                <Link href={`/categories/${encodeURIComponent(category.key)}`}>
                  <span>{category.title}</span>
                  <small>{category.count}</small>
                </Link>
                <em>{category.sponsor.title}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mals-sidebar-empty">No categories yet.</p>
        )}
      </section>

      {facets.collections.length > 0 && (
        <section className="mals-sidebar-section">
          <h2>Collections</h2>
          <ul>
            {facets.collections.map((collection) => (
              <li key={collection.key}>
                <Link href={`/collections/${encodeURIComponent(collection.key)}`}>
                  <span>{collection.title}</span>
                  <small>{collection.count}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {facets.tags.length > 0 && (
        <section className="mals-sidebar-section">
          <h2>Threads</h2>
          <div className="mals-tag-cloud">
            {facets.tags.slice(0, 18).map((tag) => (
              <Link key={tag.slug} href={`/writing?tag=${encodeURIComponent(tag.slug)}`}>
                {tag.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mals-sidebar-section mals-sidebar-archive">
        <h2>Archives</h2>
        <ul>
          {facets.archives.map((archive) => (
            <li key={archive.year}>
              <Link href={`/archives?year=${archive.year}`}>
                <span>{archive.year}</span>
                <small>{archive.count}</small>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

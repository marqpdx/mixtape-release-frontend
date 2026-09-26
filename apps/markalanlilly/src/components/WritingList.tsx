import Link from "next/link";
import type { PublicSiteWritingItem } from "@mixtape/api/clients/public/publicApi";

import { formatPublishedDate } from "@/lib/public-site";

interface WritingListProps {
  items: PublicSiteWritingItem[];
  compact?: boolean;
}

export function WritingList({ items, compact = false }: WritingListProps) {
  if (!items.length) {
    return <p className="mals-empty-copy">No public writing is here yet.</p>;
  }

  return (
    <div className={`mals-writing-list${compact ? " is-compact" : ""}`}>
      {items.map((item) => (
        <article className="mals-writing-card" key={item.id}>
          <div className="mals-writing-kicker">
            <span aria-hidden="true">/</span>
            <time dateTime={item.published_at ?? undefined}>
              {formatPublishedDate(item.published_at, compact)}
            </time>
            {item.sponsor_group && <em>{item.sponsor_group.title}</em>}
          </div>
          <h2>
            <Link href={`/writing/${item.id}/${item.slug}`}>{item.title}</Link>
          </h2>
          {!compact && item.body_preview && <p>{item.body_preview}</p>}
          <div className="mals-writing-meta">
            {item.categories.map((category) => (
              <Link
                key={category.key}
                href={`/categories/${encodeURIComponent(category.key)}`}
              >
                {category.title}
              </Link>
            ))}
            {item.collections.map((collection) => (
              <Link
                key={collection.key}
                href={`/collections/${encodeURIComponent(collection.key)}`}
              >
                {collection.title}
              </Link>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

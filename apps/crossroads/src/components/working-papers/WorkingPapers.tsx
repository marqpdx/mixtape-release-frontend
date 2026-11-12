// apps/crossroads/src/components/working-papers/WorkingPapers.tsx
//
// The Working Papers pages, built once and styled three ways (Editorial,
// Index, Cards) by WorkingPapers.module.css off html[data-wp-view]. DOM
// order, headings, links and landmarks are the same in every view; the
// views differ in placement, type and density only.
//
// Spec: Puddlejump zz/spec-working-papers-reading-views.md (and its Headnote).

import type { ReactNode } from "react";
import Link from "next/link";
import { LuLock } from "react-icons/lu";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";
import { ViewSwitcher } from "@/components/reading-views/ViewSwitcher";
import { READING_ANCHOR } from "@/components/reading-views/readingViews";
import { STATUS_LABEL, type PaperStatus, type PaperType } from "@/lib/workingPapers";
import { wpSerif } from "./fonts";
import { WORKING_PAPER_VIEWS } from "./views";
import styles from "./WorkingPapers.module.css";

export type Crumb = { label: string; href?: string };
export type PageKind = "index" | "packet" | "tldr" | "paper";

const anchor = { [READING_ANCHOR]: "" };

// Shown on every Working Papers page (CTO, 2026-11-06).
const NOT_PUBLIC =
  "Not yet a public document. Shared with you, the intended reader, for review; please don't pass it on.";

/** "01", "02": papers are numbered within their packet. */
export const twoDigits = (n: number) => String(n).padStart(2, "0");

export function WorkingPapersShell({
  crumbs,
  kind,
  children,
}: {
  crumbs: Crumb[];
  kind: PageKind;
  children: ReactNode;
}) {
  return (
    <>
      <UnifiedNavbar extraCompact />
      <div className={`${styles.root} ${wpSerif.variable}`} data-kind={kind}>
        <div className={styles.main}>
          <div className={styles.container}>
            <div className={styles.topRow}>
              <nav aria-label="Breadcrumb">
                <ol className={styles.crumbs}>
                  {crumbs.map((crumb) => (
                    <li key={crumb.label}>
                      {crumb.href ? (
                        <Link href={crumb.href}>{crumb.label}</Link>
                      ) : (
                        <span aria-current="page">{crumb.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
              <ViewSwitcher config={WORKING_PAPER_VIEWS} />
            </div>
            <div className={styles.page}>{children}</div>
          </div>
        </div>
      </div>
    </>
  );
}

export type MetaItem = {
  term: string;
  value: ReactNode;
  /** Show the term in the inline views (Editorial line, Cards chips) too. */
  showTerm?: boolean;
};

export function PageHeader({ eyebrow, title, meta }: { eyebrow?: string; title: string; meta: MetaItem[] }) {
  return (
    <header className={styles.header}>
      {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
      <h1 className={styles.title} {...anchor}>
        {title}
      </h1>
      {/* The details and the review notice: a rail in Index, placed apart in the other views. */}
      <div className={styles.aside}>
        {meta.length > 0 && (
          <dl className={styles.meta}>
            {meta.map((item) => (
              <div key={item.term} className={`${styles.metaItem} ${item.showTerm ? "" : styles.termHidden}`}>
                <dt>{item.term}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <p role="note" className={styles.notice}>
          <LuLock aria-hidden="true" size="0.95em" />
          <span>{NOT_PUBLIC}</span>
        </p>
      </div>
    </header>
  );
}

export function StatusBadge({ status }: { status: PaperStatus }) {
  return (
    <span className={styles.badge} data-status={status}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Markdown-rendered prose (packet intros, TL;DRs, papers). */
export function ProseHtml({ html, intro = false }: { html: string; intro?: boolean }) {
  if (!html) return null;
  return (
    <div
      className={`${styles.prose} ${intro ? styles.intro : styles.body}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/** An intro whose first paragraph reads as the lede. */
export function Intro({ children }: { children: ReactNode }) {
  return <div className={`${styles.prose} ${styles.intro}`}>{children}</div>;
}

export type Entry = {
  key: string;
  href: string;
  title: string;
  stamp: ReactNode;
  summary?: string;
  links?: { href: string; label: string }[];
};

export function EntryList({
  heading,
  numberWord,
  entries,
}: {
  heading: string;
  numberWord: string;
  entries: Entry[];
}) {
  return (
    <section className={styles.list} aria-labelledby="wp-list-heading">
      <h2 id="wp-list-heading" className={styles.listHeading}>
        {heading}
      </h2>
      <ol className={styles.entries}>
        {entries.map((entry, i) => (
          <li key={entry.key} className={styles.entry} {...anchor}>
            <span className={styles.num}>
              <span className={styles.numWord}>{numberWord} </span>
              {twoDigits(i + 1)}
            </span>
            <h3 className={styles.entryTitle}>
              <Link href={entry.href}>{entry.title}</Link>
            </h3>
            <p className={styles.stamp}>{entry.stamp}</p>
            {entry.summary && <p className={styles.summary}>{entry.summary}</p>}
            {entry.links && entry.links.length > 0 && (
              <p className={styles.links}>
                {entry.links.map((link) => (
                  <Link key={link.href} href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** A paper's status and version, as a list entry shows it. */
export function PaperStamp({ status, version }: { status: PaperStatus; version?: string }) {
  return (
    <>
      <StatusBadge status={status} />
      {version && <span>Version {version}</span>}
    </>
  );
}

/** Split rendered Markdown at its first paragraph: the lede, then the rest. */
function splitLede(html: string): [string, string] {
  const trimmed = html.trim();
  if (!trimmed.startsWith("<p>")) return ["", trimmed];
  const end = trimmed.indexOf("</p>");
  if (end === -1) return ["", trimmed];
  return [trimmed.slice(3, end), trimmed.slice(end + 4)];
}

export function TldrBody({ html, types, namesHtml }: { html: string; types: PaperType[]; namesHtml: string }) {
  const [lede, rest] = splitLede(html);
  return (
    <div className={`${styles.body} ${styles.tldr}`}>
      {lede && <p className={styles.lede} dangerouslySetInnerHTML={{ __html: lede }} />}
      {types.length > 0 && (
        <dl className={styles.types}>
          {types.map((type, i) => (
            <div key={type.name} className={styles.type}>
              <dt>
                <span className={styles.typeNum} aria-hidden="true">
                  {i + 1}
                </span>
                {type.name}
              </dt>
              <dd>{type.meaning}</dd>
            </div>
          ))}
        </dl>
      )}
      {rest && <div className={styles.prose} dangerouslySetInnerHTML={{ __html: rest }} />}
      {namesHtml && (
        <aside className={styles.names} aria-label="Names in this paper">
          <p>
            <strong className={styles.namesLabel}>
              Names<span className={styles.colon}>:</span>
            </strong>{" "}
            <span dangerouslySetInnerHTML={{ __html: namesHtml }} />
          </p>
        </aside>
      )}
    </div>
  );
}

export function PaperNav({ full, next }: { full: string; next?: { href: string; title: string } }) {
  return (
    <nav aria-label="Paper" className={styles.paperNav}>
      <Link href={full} className={styles.primary}>
        Read the full paper →
      </Link>
      {next && (
        <Link href={next.href} className={styles.next}>
          Next: {next.title} →
        </Link>
      )}
    </nav>
  );
}

export function Respond({ children }: { children: ReactNode }) {
  return <div className={styles.respond}>{children}</div>;
}

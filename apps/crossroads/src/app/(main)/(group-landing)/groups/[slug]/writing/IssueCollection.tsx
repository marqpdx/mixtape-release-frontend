import Link from "next/link";
import localFont from "next/font/local";
import type { PublicGroupIssue, PublicLibraryPiece } from "@mixtape/api/clients/public/publicApi";
import { IssueCard } from "./IssueCard";
import { presentIssue } from "./issuePresentation";
import styles from "./IssueCollection.module.css";

const heading = localFont({
  src: "./fonts/dm-serif-display-latin-400-normal.woff2",
  weight: "400",
  variable: "--issue-font-heading",
  display: "swap",
});
const body = localFont({
  src: [
    { path: "./fonts/inter-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/inter-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/inter-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--issue-font-body",
  display: "swap",
});
const mono = localFont({
  src: [
    { path: "./fonts/ibm-plex-mono-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/ibm-plex-mono-latin-600-normal.woff2", weight: "600" },
  ],
  variable: "--issue-font-mono",
  display: "swap",
});

export function IssueCollection({ issues, groupSlug, writing }: {
  issues: PublicGroupIssue[];
  groupSlug: string;
  writing: PublicLibraryPiece[];
}) {
  // The public endpoint orders Issues by publication date, newest first.
  const [latest, ...past] = issues;
  if (!latest) return null;

  return (
    <section
      className={`gwi-issues ${styles.collection} ${heading.variable} ${body.variable} ${mono.variable}`}
      aria-labelledby="group-issues-heading"
    >
      <h2 id="group-issues-heading" className={styles.sectionHeading}>Issues</h2>
      <IssueCard issue={latest} groupSlug={groupSlug} writing={writing} />
      {past.length > 0 && (
        <section className={`gic-past ${styles.past}`} aria-labelledby="group-past-issues-heading">
          <h3 id="group-past-issues-heading" className={styles.sectionHeading}>Past Issues</h3>
          <ul className={styles.pastGrid}>
            {past.map((issue) => {
              const { label, readingTime, pieces } = presentIssue(issue, writing);
              return (
                <li key={issue.id}>
                  <Link href={`/groups/${groupSlug}/writing/issues/${issue.slug}`} className={styles.tile}>
                    <span className={styles.coverLabel}>{label}</span>
                    <span className={styles.tileTitle}>{issue.title || label}</span>
                    <span className={styles.meta}>
                      {pieces.length} {pieces.length === 1 ? "piece" : "pieces"}
                      {readingTime !== null && ` · ${readingTime} min`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </section>
  );
}

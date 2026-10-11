import Link from "next/link";
import type { PublicGroupIssue, PublicLibraryPiece } from "@mixtape/api/clients/public/publicApi";
import { IssueContents, IssueContentsToggle, IssueDisclosure } from "./IssueContentsToggle";
import { issueIntroduction, presentIssue } from "./issuePresentation";
import styles from "./IssueCollection.module.css";

export function IssueCard({ issue, groupSlug, writing }: {
  issue: PublicGroupIssue;
  groupSlug: string;
  writing: PublicLibraryPiece[];
}) {
  const { number, label, date, byline, readingTime, pieces } = presentIssue(issue, writing);
  const introduction = issueIntroduction(issue.description);
  const titleId = `issue-title-${issue.id}`;
  const contentsId = `issue-contents-${issue.id}`;
  const readerUrl = `/groups/${groupSlug}/writing/issues/${issue.slug}`;
  const pieceUrl = (slug: string) => `/groups/${groupSlug}/reading/${slug}`;
  const count = pieces.length;

  return (
    <IssueDisclosure>
      <article className={`gic-card ${styles.card}`} aria-labelledby={titleId}>
        <div className={`gic-header ${styles.header}`}>
          <div className={`gic-cover ${styles.cover}`}>
            <span className={styles.coverLabel}>Issue</span>
            {(number || issue.designation) && (
              <span className={number ? styles.numeral : styles.designation}>{number || issue.designation}</span>
            )}
            {date && <span className={styles.date}>{date}</span>}
          </div>
          <div className={`gic-summary ${styles.summary}`}>
            <h3 id={titleId} className={styles.title}>{issue.title || label}</h3>
            {byline && <p className={styles.meta}>By {byline}</p>}
            {introduction && <p className={styles.introduction}>{introduction}</p>}
            <div className={`gic-inline-contents ${styles.inlineContents}`}>
              <p className={styles.eyebrow}>
                In this Issue · {count} {count === 1 ? "piece" : "pieces"}
                {readingTime !== null && ` · ${readingTime} min read`}
              </p>
              <ol className={styles.inlineList}>
                {pieces.slice(0, 8).map((piece, index) => (
                  <li key={piece.id}>
                    <Link href={pieceUrl(piece.slug)}>
                      <span className={styles.pieceNumber}>{String(index + 1).padStart(2, "0")}</span>
                      <span>{piece.title}</span>
                    </Link>
                  </li>
                ))}
                {count > 8 && <li><IssueContentsToggle contentsId={contentsId} count={count} remaining={count - 8} /></li>}
              </ol>
            </div>
            <div className={`gic-actions ${styles.actions}`}>
              <Link href={readerUrl} className={`${styles.button} ${styles.primary}`}>Read {number ? label : "Issue"}</Link>
              {pieces[0] && <Link href={pieceUrl(pieces[0].slug)} className={styles.button}>Start with piece 1</Link>}
              <IssueContentsToggle contentsId={contentsId} count={count} />
            </div>
          </div>
        </div>
        <IssueContents id={contentsId}>
          <ol className={styles.expandedList}>
            {pieces.map((piece, index) => (
              <li key={piece.id} className={styles.expandedPiece}>
                <span className={styles.expandedNumber}>{String(index + 1).padStart(2, "0")}</span>
                <div className={styles.pieceDetail}>
                  <Link href={pieceUrl(piece.slug)} className={styles.pieceTitle}>{piece.title}</Link>
                  {piece.excerpt && <p className={styles.excerpt}>{piece.excerpt}</p>}
                </div>
                {piece.readingTime !== null && <span className={styles.minutes}>{piece.readingTime} min</span>}
              </li>
            ))}
          </ol>
        </IssueContents>
      </article>
    </IssueDisclosure>
  );
}

import Link from "next/link";
import type { PublicGroupIssue, PublicLibraryPiece } from "@mixtape/api/clients/public/publicApi";
import { PieceBody } from "../../../reading/[articleSlug]/PieceBody";
import { presentIssue } from "../../issuePresentation";
import { heading, body, mono } from "../../issueFonts";
import styles from "./IssueReader.module.css";

function PieceDate({ publishedAt }: { publishedAt: string | null }) {
  if (!publishedAt) return null;
  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  const format = (options: Intl.DateTimeFormatOptions) => date.toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
  return (
    <time className={`gwir-piece-date ${styles.pieceDate}`} dateTime={publishedAt} aria-label={format({ weekday: "long", year: "numeric", month: "long", day: "numeric" })}>
      <span className={styles.dateWeekday}>{format({ weekday: "short" })}</span>
      <span className={styles.dateMonth}>{format({ month: "short" })}</span>
      <span className={styles.dateYear}>{format({ year: "numeric" })}</span>
      <span className={styles.dateDay}>{format({ day: "numeric" })}</span>
    </time>
  );
}

export function IssueReader({ issue, groupSlug, groupTitle, writing = [] }: {
  issue: PublicGroupIssue;
  groupSlug: string;
  groupTitle: string;
  writing?: PublicLibraryPiece[];
}) {
  const { label, date, byline, pieces, readingTime } = presentIssue(issue, writing);
  const total = String(pieces.length).padStart(2, "0");
  return (
    <article className={`gwir-issue ${styles.scope} ${heading.variable} ${body.variable} ${mono.variable}`}>
      <header className={`gwir-title-page ${styles.titlePage}`}>
        <Link className={styles.back} href={`/groups/${groupSlug}/writing`}>← Writing</Link>
        <p className={`${styles.eyebrow} ${styles.accent}`}>{groupTitle} · {label}{date && ` · ${date}`}</p>
        <h1 className={styles.title}>{issue.title || label}</h1>
        {issue.description && (
          <div className={`gwir-introduction ${styles.introduction} ${styles.prose}`}>
            <PieceBody body_json={issue.description} />
          </div>
        )}
        <p className={styles.meta}>
          {byline && `${byline} · `}{pieces.length} {pieces.length === 1 ? "piece" : "pieces"}
          {readingTime !== null && pieces.length > 0 && ` · ${readingTime} min read`}
        </p>
        {pieces.length > 0 && (
          <nav className={`gwir-contents ${styles.contents}`} aria-label="Issue contents">
            <ol>
              {pieces.map((piece, index) => {
                const number = String(index + 1).padStart(2, "0");
                return (
                  <li key={piece.id}>
                    <Link className={styles.contentsLink} href={`#piece-${number}`}>
                      <span className={styles.number}>{number}</span>
                      <span>{piece.title}</span>
                      {piece.readingTime !== null && <span className={styles.minutes}>{piece.readingTime} min</span>}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
      </header>
      <div className="gwir-pieces">
        {pieces.map((piece, index) => {
          const number = String(index + 1).padStart(2, "0");
          return (
            <section key={piece.id} id={`piece-${number}`} className={`gwir-piece ${styles.piece}`} aria-labelledby={`piece-title-${number}`}>
              <p className={`${styles.eyebrow} ${styles.accent} ${styles.position}`}>{number} of {total}</p>
              <div className={`gwir-piece-heading ${styles.pieceHeading}`}>
                <h2 id={`piece-title-${number}`} className={styles.pieceTitle}>
                  <Link href={`/groups/${groupSlug}/reading/${piece.slug}`}>{piece.title}</Link>
                </h2>
                {piece.excerpt?.trim() && <p className={`gwir-piece-summary ${styles.summary}`}>{piece.excerpt}</p>}
              </div>
              <PieceDate publishedAt={piece.published_at} />
              {piece.author && <p className={`gwir-piece-author ${styles.meta} ${styles.author}`}>{piece.author}</p>}
              {piece.body_json && <div className={`gwir-piece-content ${styles.prose}`}><PieceBody body_json={piece.body_json} /></div>}
              {index < pieces.length - 1 && <div className={styles.separator} aria-hidden="true">· · ·</div>}
            </section>
          );
        })}
      </div>
    </article>
  );
}

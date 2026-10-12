import Link from "next/link";
import type { PublicGroupIssue } from "@mixtape/api/clients/public/publicApi";
import { presentIssue } from "../../writing/issuePresentation";
import { heading, body, mono } from "../../writing/issueFonts";
import styles from "./PieceIssueNavigation.module.css";

export function pieceIssueContext(issues: PublicGroupIssue[], pieceId: string) {
  // Keep the public endpoint's newest-first priority if a piece is in several Issues.
  const issue = issues.find((candidate) => candidate.pieces.some((piece) => piece.id === pieceId));
  if (!issue) return null;
  const { label, pieces } = presentIssue(issue, []);
  const index = pieces.findIndex((piece) => piece.id === pieceId);
  return { issue, label, pieces, index, previous: pieces[index - 1], next: pieces[index + 1] };
}

type Props = {
  context: NonNullable<ReturnType<typeof pieceIssueContext>>;
  groupSlug: string;
};
const fonts = `${heading.variable} ${body.variable} ${mono.variable}`;

export function PieceIssueBar({ context, groupSlug }: Props) {
  const { issue, label, pieces, index, previous, next } = context;
  return (
    <nav className={`pin-bar ${styles.scope} ${styles.bar} ${fonts}`} aria-label="Issue navigation">
      <div className={`pin-bar-inner ${styles.barInner}`}>
        <Link className={styles.issueLink} href={`/groups/${groupSlug}/writing/issues/${issue.slug}`}>
          <span className={`${styles.eyebrow} ${styles.accent}`}>{label} · {index + 1} of {pieces.length}</span>
          {issue.title && <span className={styles.issueTitle}>{issue.title}</span>}
        </Link>
        <div className={`pin-arrows ${styles.arrows}`}>
          {previous && <Link className={styles.arrow} href={`/groups/${groupSlug}/reading/${previous.slug}`} aria-label={`Previous in Issue: ${previous.title}`}><span aria-hidden="true">‹</span></Link>}
          {next && <Link className={styles.arrow} href={`/groups/${groupSlug}/reading/${next.slug}`} aria-label={`Next in Issue: ${next.title}`}><span aria-hidden="true">›</span></Link>}
        </div>
      </div>
    </nav>
  );
}

export function PieceIssueContinue({ context, groupSlug }: Props) {
  const { issue, label, pieces, index, previous, next } = context;
  return (
    <section className={`pin-continue ${styles.scope} ${styles.continue} ${fonts}`} aria-labelledby="continue-issue-heading">
      <h2 id="continue-issue-heading" className={styles.eyebrow}>Continue {label}</h2>
      {(previous || next) && (
        <nav className={`pin-neighbors ${styles.neighbors}`} aria-label="Continue reading this Issue">
          {previous && <Link className={styles.neighbor} href={`/groups/${groupSlug}/reading/${previous.slug}`}>
            <span className={styles.eyebrow}>← Previous · {index}</span>
            <span className={styles.pieceTitle}>{previous.title}</span>
          </Link>}
          {next && <Link className={`${styles.neighbor} ${styles.next}`} href={`/groups/${groupSlug}/reading/${next.slug}`}>
            <span className={`${styles.eyebrow} ${styles.accent}`}>Next · {index + 2} →</span>
            <span className={styles.pieceTitle}>{next.title}</span>
          </Link>}
        </nav>
      )}
      <ol className={`pin-contents ${styles.contents}`}>
        {pieces.map((piece, position) => (
          <li key={piece.id}>
            <Link href={`/groups/${groupSlug}/reading/${piece.slug}`} className={styles.contentsLink} aria-current={position === index ? "page" : undefined}>
              <span className={styles.number}>{String(position + 1).padStart(2, "0")}</span>
              <span>{piece.title}{position === index && <span className={styles.here}> — you’re here</span>}</span>
            </Link>
          </li>
        ))}
      </ol>
      <Link className={styles.readerLink} href={`/groups/${groupSlug}/writing/issues/${issue.slug}`}>Read all of {label} on one page</Link>
    </section>
  );
}

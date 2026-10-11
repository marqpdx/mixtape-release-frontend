import type { PublicGroupIssue, PublicLibraryPiece } from "@mixtape/api/clients/public/publicApi";

export function presentIssue(issue: PublicGroupIssue, writing: PublicLibraryPiece[]) {
  const writingById = new Map(writing.map((piece) => [piece.id, piece]));
  const pieces = [...issue.pieces]
    .sort((a, b) => a.order_index - b.order_index)
    .map((piece) => ({
      ...piece,
      readingTime: writingById.get(piece.id)?.reading_time ?? null,
    }));
  const number = issue.designation?.match(/^issue\s*#?\s*(\d+)\s*$/i)?.[1] ?? null;
  const label = number ? `Issue #${number}` : issue.designation || "Issue";
  const dates = pieces.map((piece) => piece.published_at).filter((date): date is string => !!date).sort();
  const publishedAt = issue.published_at || dates[0] || null;
  const date = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })
    : null;
  const authors = [...new Set(pieces.map((piece) => piece.author.trim()).filter(Boolean))];
  const byline = authors.length <= 2
    ? authors.join(" and ")
    : `${authors[0]}, ${authors[1]} and ${authors.length - 2} ${authors.length === 3 ? "other" : "others"}`;
  const readingTime = pieces.every((piece) => piece.readingTime !== null)
    ? pieces.reduce((total, piece) => total + (piece.readingTime ?? 0), 0)
    : null;

  return { number, label, date, byline, readingTime, pieces };
}

// The card uses a short text introduction; the reader retains the full rich text.
export function issueIntroduction(description: PublicGroupIssue["description"]): string {
  function text(node: unknown): string {
    if (!node || typeof node !== "object") return "";
    const { text: value, content, type } = node as { text?: string; content?: unknown[]; type?: string };
    if (typeof value === "string") return value;
    const children = Array.isArray(content) ? content.map(text).join("") : "";
    return ["paragraph", "heading", "hardBreak", "listItem"].includes(type || "") ? `${children} ` : children;
  }
  const plainText = text(description).replace(/\s+/g, " ").trim();
  return plainText.match(/[^.!?]+(?:[.!?]+(?:\s|$)|$)/g)?.slice(0, 3).join("").trim() || plainText;
}

// apps/crossroads/src/lib/workingPapers.ts
//
// Working Papers (Puddlejump zz/spike-peer-review.md, Phase 1): static pages
// built from Markdown in content/working-papers/, written by Puddlejump.
//
//   content/working-papers/<packet>/index.md         packet overview
//   content/working-papers/<packet>/<paper>/tldr.md  TL;DR
//   content/working-papers/<packet>/<paper>/paper.md the artifact itself
//   content/code-summary/<span>/tldr.md, paper.md    a code summary, on its own
//
// Working Papers are unlisted: reachable only by a URL sent to a reader, and
// every page is noindex. Code summaries are public pages.
// Puddlejump writes all of it (tools/publish-working-papers.py); never edit here.

import fs from "fs";
import path from "path";
import { loadMarkdownFile, renderMarkdown, type MarkdownFileResult } from "@mixtape/content";

const ROOT = path.join(process.cwd(), "content", "working-papers");
const CODE_SUMMARY_ROOT = path.join(process.cwd(), "content", "code-summary");
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export const WORKING_PAPERS_ROBOTS = { index: false, follow: false };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-06" → "Nov 6, 2026": no day/month ambiguity between UK and US readers. */
export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${Number(match[3])}, ${match[1]}` : iso;
}

/** From each paper's source document (publish script), never from its version. */
export type PaperStatus = "ratified" | "proposed" | "draft";

export const STATUS_LABEL: Record<PaperStatus, string> = {
  ratified: "Ratified",
  proposed: "Proposed",
  draft: "Draft",
};

export type PaperType = { name: string; meaning: string };

export type PacketEntry = {
  slug: string;
  title: string;
  summary: string;
  version: string;
  status: PaperStatus;
};

export type Packet = {
  slug: string;
  title: string;
  date: string;
  summary: string;
  html: string;
  papers: PacketEntry[];
};

export type PaperPage = {
  packet: string;
  slug: string;
  title: string;
  version: string;
  date: string;
  summary: string;
  status: PaperStatus;
  /** The TL;DR's structured list (optional `types` frontmatter). */
  types: PaperType[];
  /** The "Names" line as inline HTML (optional `names` frontmatter). */
  namesHtml: string;
  html: string;
};

/** "Nov 6, 2026 · 5 papers · 4 ratified, 1 draft" (spec: the packet meta line). */
export function statusSplit(papers: { status: PaperStatus }[]): string {
  return (Object.keys(STATUS_LABEL) as PaperStatus[])
    .map((status) => [status, papers.filter((p) => p.status === status).length] as const)
    .filter(([, count]) => count > 0)
    .map(([status, count]) => `${count} ${status}`)
    .join(", ");
}

export const paperCount = (n: number) => `${n} ${n === 1 ? "paper" : "papers"}`;

const statusOf = (value: unknown): PaperStatus =>
  value === "ratified" || value === "proposed" ? value : "draft";

const typesOf = (value: unknown): PaperType[] =>
  Array.isArray(value)
    ? value.flatMap((item) =>
        item && typeof item.name === "string" && typeof item.meaning === "string"
          ? [{ name: item.name, meaning: item.meaning }]
          : []
      )
    : [];

async function inlineHtml(markdown: unknown): Promise<string> {
  if (typeof markdown !== "string" || !markdown.trim()) return "";
  const { html } = await renderMarkdown(markdown);
  return html.trim().replace(/^<p>([\s\S]*)<\/p>$/, "$1");
}

const text = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : value instanceof Date ? value.toISOString().slice(0, 10) : fallback;

const dirs = (dir: string): string[] =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && SLUG.test(entry.name))
        .map((entry) => entry.name)
    : [];

async function load(...parts: string[]): Promise<MarkdownFileResult | null> {
  return loadFrom(ROOT, ...parts);
}

async function loadFrom(root: string, ...parts: string[]): Promise<MarkdownFileResult | null> {
  if (!parts.every((part) => SLUG.test(part) || part.endsWith(".md"))) return null;
  const filePath = path.join(root, ...parts);
  return fs.existsSync(filePath) ? loadMarkdownFile(filePath) : null;
}

export function listPacketSlugs(): string[] {
  return dirs(ROOT).filter((slug) => fs.existsSync(path.join(ROOT, slug, "index.md")));
}

export function listPaperSlugs(packet: string): string[] {
  return dirs(path.join(ROOT, packet)).filter((slug) =>
    fs.existsSync(path.join(ROOT, packet, slug, "tldr.md"))
  );
}

async function loadPage(packet: string, slug: string, file: "tldr.md" | "paper.md"): Promise<PaperPage | null> {
  const result = await load(packet, slug, file);
  if (!result) return null;
  const { frontmatter: fm, html } = result;
  return {
    packet,
    slug,
    title: text(fm.title, slug),
    version: text(fm.version),
    date: text(fm.date),
    summary: text(fm.summary),
    status: statusOf(fm.status),
    types: typesOf(fm.types),
    namesHtml: await inlineHtml(fm.names),
    html,
  };
}

export const loadTldr = (packet: string, slug: string) => loadPage(packet, slug, "tldr.md");
export const loadPaper = (packet: string, slug: string) => loadPage(packet, slug, "paper.md");

export async function loadPacket(packet: string): Promise<Packet | null> {
  const result = await load(packet, "index.md");
  if (!result) return null;
  const { frontmatter: fm, html } = result;
  // Order follows the packet's `papers` list; papers not listed follow by name.
  const listed = Array.isArray(fm.papers) ? fm.papers.filter((p): p is string => typeof p === "string") : [];
  const present = listPaperSlugs(packet);
  const order = [...listed.filter((slug) => present.includes(slug)), ...present.filter((slug) => !listed.includes(slug))];
  const papers: PacketEntry[] = [];
  for (const slug of order) {
    const tldr = await loadTldr(packet, slug);
    if (tldr) papers.push({ slug, title: tldr.title, summary: tldr.summary, version: tldr.version, status: tldr.status });
  }
  return {
    slug: packet,
    title: text(fm.title, packet),
    date: text(fm.date),
    summary: text(fm.summary),
    html,
    papers,
  };
}

export async function listPackets(): Promise<Packet[]> {
  const packets: Packet[] = [];
  for (const slug of listPacketSlugs()) {
    const packet = await loadPacket(slug);
    if (packet) packets.push(packet);
  }
  return packets.sort((a, b) => b.date.localeCompare(a.date));
}

// Code summaries: content/code-summary/<span>/{tldr,paper}.md, one public page each.

export function listCodeSummarySlugs(): string[] {
  return dirs(CODE_SUMMARY_ROOT).filter((slug) => fs.existsSync(path.join(CODE_SUMMARY_ROOT, slug, "paper.md")));
}

export async function loadCodeSummary(span: string): Promise<{ tldr: PaperPage | null; paper: PaperPage } | null> {
  if (!SLUG.test(span)) return null;
  const [tldr, paper] = await Promise.all([
    loadFrom(CODE_SUMMARY_ROOT, span, "tldr.md"),
    loadFrom(CODE_SUMMARY_ROOT, span, "paper.md"),
  ]);
  if (!paper) return null;
  const page = async (result: MarkdownFileResult): Promise<PaperPage> => ({
    packet: "code-summary",
    slug: span,
    title: text(result.frontmatter.title, span),
    version: text(result.frontmatter.version),
    date: text(result.frontmatter.date),
    summary: text(result.frontmatter.summary),
    status: statusOf(result.frontmatter.status),
    types: typesOf(result.frontmatter.types),
    namesHtml: await inlineHtml(result.frontmatter.names),
    html: result.html,
  });
  return { tldr: tldr ? await page(tldr) : null, paper: await page(paper) };
}

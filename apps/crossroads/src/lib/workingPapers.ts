// apps/crossroads/src/lib/workingPapers.ts
//
// Working Papers (Puddlejump zz/spike-peer-review.md, Phase 1): static pages
// built from Markdown in content/working-papers/, written by Puddlejump.
//
//   content/working-papers/<packet>/index.md         packet overview
//   content/working-papers/<packet>/<paper>/tldr.md  TL;DR
//   content/working-papers/<packet>/<paper>/paper.md the artifact itself
//
// Unlisted: reachable only by a URL sent to a reader; every page is noindex.

import fs from "fs";
import path from "path";
import { loadMarkdownFile, type MarkdownFileResult } from "@mixtape/content";

const ROOT = path.join(process.cwd(), "content", "working-papers");
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

export const WORKING_PAPERS_ROBOTS = { index: false, follow: false };

export type PacketEntry = {
  slug: string;
  title: string;
  summary: string;
  version: string;
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
  html: string;
};

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
  if (!parts.every((part) => SLUG.test(part) || part.endsWith(".md"))) return null;
  const filePath = path.join(ROOT, ...parts);
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
    if (tldr) papers.push({ slug, title: tldr.title, summary: tldr.summary, version: tldr.version });
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

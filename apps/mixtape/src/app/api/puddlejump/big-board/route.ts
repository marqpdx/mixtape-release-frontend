// apps/mixtape/src/app/api/puddlejump/big-board/route.ts
//
// Reads the sibling puddlejump repo directly off disk (co-location
// assumption -- release/puddlejump sits next to release/mixtape-release-
// frontend). Only works where both repos are checked out side by side:
// true on a local dev machine today, true on the VPS once it's fully
// enabled, not true elsewhere. Returns `available: false` rather than
// throwing when the path doesn't exist, so the page can render a clear
// "not available in this environment" state instead of erroring.

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUDDLEJUMP_PATH =
  process.env.PUDDLEJUMP_REPO_PATH ?? path.resolve(process.cwd(), "../../../puddlejump");

type Lifecycle = "completed" | "in_progress" | "awaiting_input" | "draft";

interface AdrEntry {
  path: string;
  title: string;
  status: string;
  class: string;
  uuid: string | null;
  adrNumber: number | null;
  created: string | null;
  updated: string | null;
  summary: string | null;
  lifecycle: Lifecycle;
  timely: boolean;
}

interface SpikeEntry {
  path: string;
  title: string;
  status: string;
  class: string;
  uuid: string | null;
  created: string | null;
  updated: string | null;
  timely: boolean;
}

// A human-set flag, not a derived one: "this floats to the top of whatever
// list it's in, regardless of sort, because I know I want back to it
// directly." Orthogonal to status/lifecycle. See
// decisions/spikes/spike-doc-shape-process-contracts.md's "timely flag"
// section -- ADR shape convention is `> **Timely:** yes` in the header
// block; spike shape convention is `timely: true` in frontmatter.
function isTimely(value: string | undefined): boolean {
  return !!value && /^(true|yes)$/i.test(value.trim());
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// ADRs in this repo carry a blockquote header block, not YAML frontmatter:
//   > **Status:** Ratified
//   > **Created:** 2026-06-04
//   > **Last Updated:** 2026-06-09
//   > **UUID:** 426b7f22-...
// This is the ADR shape's real convention -- distinct from spikes'
// `---\nkey: value\n---` frontmatter, parsed separately below.
function parseHeaderBlock(content: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const lines = content.split("\n").slice(0, 40);
  for (const line of lines) {
    const kv = line.match(/^>\s*\*\*([A-Za-z ]+):\*\*\s*(.+)$/);
    if (kv) fields[kv[1].trim()] = kv[2].trim();
  }
  return fields;
}

function extractAdrNumber(title: string, content: string, headerFields: Record<string, string>): number | null {
  // Preference order: a declared `> **ADR Number:** ADR-0054` header field
  // (some ADRs have this, most don't -- no canonical requirement yet) is
  // the actual authorial claim, so it wins when present. Otherwise fall
  // back to the title, then a body scan with header lines stripped (a
  // header "Related:" line naming a *different* ADR would otherwise be
  // picked up as if it were this doc's own number). Still a heuristic
  // stack, not a canonical field -- see the shape/process-contract spike.
  const declared = headerFields["ADR Number"]?.match(/ADR-0*(\d{2,5})/i);
  if (declared) return parseInt(declared[1], 10);

  const titleMatch = title.match(/ADR-0*(\d{2,5})/i);
  if (titleMatch) return parseInt(titleMatch[1], 10);

  const bodyOnly = content.replace(/^>.*$/gm, "").slice(0, 2000);
  const bodyMatch = bodyOnly.match(/ADR-0*(\d{2,5})/i);
  return bodyMatch ? parseInt(bodyMatch[1], 10) : null;
}

// Best-effort one-paragraph summary: first substantial prose paragraph
// after the header block, H1, and any **Scope:**/**Audience:** lines.
// There's no canonical `summary:` field for the ADR shape yet -- this is a
// mechanical stand-in, named as a gap in the shape/process-contract spike.
function extractSummary(content: string): string | null {
  const body = content
    .replace(/^>.*$/gm, "") // header blockquote lines
    .replace(/^#\s+.+$/m, "") // H1
    .replace(/^\*\*(Scope|Audience):\*\*.*$/gm, "");

  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 40 && !p.startsWith("#") && !p.startsWith("|") && !p.startsWith("-"));

  if (!paragraphs.length) return null;
  const first = paragraphs[0];
  return first.length > 500 ? first.slice(0, 497) + "..." : first;
}

// Companion `*-status.md` phase-table file, when one exists in the same
// directory (naming isn't fully consistent -- ambient-intelligence-adr.md
// -> ambient-intelligence-status.md, but keeper-adr.md ->
// keeper-adr-status.md -- so scan the directory rather than guess the
// transform).
async function findCompanionStatusFile(filePath: string): Promise<string | null> {
  const dir = path.dirname(filePath);
  const self = path.basename(filePath);
  try {
    const files = await fs.readdir(dir);
    const match = files.find((f) => f.endsWith("-status.md") && f !== self);
    return match ? path.join(dir, match) : null;
  } catch {
    return null;
  }
}

async function deriveLifecycle(status: string, filePath: string): Promise<Lifecycle> {
  const s = status.toLowerCase();
  if (s.includes("draft") || s.includes("proposed")) return "draft";

  const isCanonOrRatified = s.includes("canon") || s.includes("ratified");
  if (!isCanonOrRatified) return "awaiting_input";

  const statusFile = await findCompanionStatusFile(filePath);
  if (!statusFile) return "completed";

  try {
    const content = await fs.readFile(statusFile, "utf-8");
    const hasPending = /⏳\s*Pending/i.test(content);
    return hasPending ? "in_progress" : "completed";
  } catch {
    return "completed";
  }
}

function titleFromPath(logicalPath: string): string {
  const base = logicalPath.split("/").pop() ?? logicalPath;
  return base
    .replace(/\.md$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function loadAdrs(): Promise<AdrEntry[]> {
  const bundlePath = path.join(PUDDLEJUMP_PATH, "reference/exports/canon-bundle.json");
  if (!(await pathExists(bundlePath))) return [];

  const raw = await fs.readFile(bundlePath, "utf-8");
  const bundle = JSON.parse(raw) as {
    documents: Array<{ logical_path: string; class: string; status_label: string; uuid: string }>;
  };

  const adrDocs = bundle.documents.filter(
    (doc) => /-adr\.md$/i.test(doc.logical_path) || /adr/i.test(doc.class ?? "")
  );

  const entries = await Promise.all(
    adrDocs.map(async (doc) => {
      const filePath = path.join(PUDDLEJUMP_PATH, doc.logical_path);
      let content = "";
      let mtime: Date | null = null;
      try {
        const [fileContent, stat] = await Promise.all([fs.readFile(filePath, "utf-8"), fs.stat(filePath)]);
        content = fileContent;
        mtime = stat.mtime;
      } catch {
        // leave content empty; entry still renders with bundle-only fields
      }

      const headerFields = content ? parseHeaderBlock(content) : {};
      const headingMatch = content.match(/^#\s+(.+)$/m);
      const title = headingMatch ? headingMatch[1].trim() : titleFromPath(doc.logical_path);
      const status = doc.status_label || headerFields["Status"] || "Unknown";

      return {
        path: doc.logical_path,
        title,
        status,
        class: doc.class || "adr",
        uuid: headerFields["UUID"] || doc.uuid || null,
        adrNumber: extractAdrNumber(title, content, headerFields),
        created: headerFields["Created"] || null,
        updated: headerFields["Last Updated"] || mtime?.toISOString() || null,
        summary: content ? extractSummary(content) : null,
        lifecycle: await deriveLifecycle(status, filePath),
        timely: isTimely(headerFields["Timely"]),
      };
    })
  );

  return entries;
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fields: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const kv = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].trim().replace(/^["'](.*)["']$/, "$1");
  }
  return fields;
}

async function loadSpikes(): Promise<SpikeEntry[]> {
  const spikesDir = path.join(PUDDLEJUMP_PATH, "decisions/spikes");
  if (!(await pathExists(spikesDir))) return [];

  const files = (await fs.readdir(spikesDir)).filter((f) => f.endsWith(".md"));

  const entries = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(spikesDir, file);
      const content = await fs.readFile(filePath, "utf-8");
      const stat = await fs.stat(filePath);
      const fm = parseFrontmatter(content);
      const logicalPath = `decisions/spikes/${file}`;
      return {
        path: logicalPath,
        title: fm.title || titleFromPath(logicalPath),
        status: fm.status || "Unknown",
        class: fm.class || "spike",
        uuid: fm.uuid || null,
        created: fm.created || null,
        updated: fm.created || stat.mtime.toISOString(),
        timely: isTimely(fm.timely),
      };
    })
  );

  return entries;
}

export async function GET() {
  const available = await pathExists(PUDDLEJUMP_PATH);

  if (!available) {
    return NextResponse.json({
      available: false,
      puddlejumpPath: PUDDLEJUMP_PATH,
      generatedAt: new Date().toISOString(),
      adrs: [],
      spikes: [],
    });
  }

  const [adrs, spikes] = await Promise.all([loadAdrs(), loadSpikes()]);

  return NextResponse.json({
    available: true,
    puddlejumpPath: PUDDLEJUMP_PATH,
    generatedAt: new Date().toISOString(),
    adrs,
    spikes,
  });
}

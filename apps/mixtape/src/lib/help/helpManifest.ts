import fs from "fs";
import path from "path";
import { cache } from "react";
import { loadMarkdownFile } from "@mixtape/content";
import type { HelpDocMetadata, HelpDocSummary, HelpEntry, HelpManifest } from "@/types/help";

function resolveContentRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), "content", "help"),
    path.resolve(process.cwd(), "..", "..", "content", "help"),
    path.resolve(process.cwd(), "..", "content", "help"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Unable to locate content/help directory. Tried: ${candidates.join(", ")}`);
}

function resolveGeneratedManifestPath(): string {
  const candidates = [
    path.resolve(process.cwd(), "public", "help-manifest.json"),
    path.resolve(process.cwd(), "..", "..", "apps", "mixtape", "public", "help-manifest.json"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

function collectUserHelpFiles(rootDir: string): string[] {
  const results: string[] = [];

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const nextPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "_deprecated" || entry.name === "_template") continue;
        walk(nextPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith("-help-users.md")) continue;
      results.push(nextPath);
    }
  };

  walk(rootDir);
  return results.sort();
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeMetadata(frontmatter: Record<string, unknown>): HelpDocMetadata {
  return {
    status: typeof frontmatter.status === "string" ? frontmatter.status : undefined,
    class: typeof frontmatter.class === "string" ? frontmatter.class : undefined,
    audit: typeof frontmatter.audit === "string" ? frontmatter.audit : undefined,
    library: typeof frontmatter.library === "string" ? frontmatter.library : undefined,
    lastUpdated: typeof frontmatter.lastUpdated === "string"
      ? frontmatter.lastUpdated
      : typeof frontmatter["last-updated"] === "string"
        ? (frontmatter["last-updated"] as string)
        : undefined,
    audience: typeof frontmatter.audience === "string" ? frontmatter.audience : undefined,
  };
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function slugFromEntry(subsystem: string, area: string): string {
  return area === "overview" ? subsystem : `${subsystem}-${area}`;
}

async function buildHelpEntry(filePath: string): Promise<HelpEntry | null> {
  const relativeDir = path.basename(path.dirname(filePath));
  const { frontmatter, content, html, headings } = await loadMarkdownFile(filePath);

  const subsystem = typeof frontmatter.subsystem === "string" ? frontmatter.subsystem : relativeDir;
  const area = typeof frontmatter.area === "string" ? frontmatter.area : "overview";
  const title = typeof frontmatter.title === "string" ? frontmatter.title : relativeDir;
  const excerpt = typeof frontmatter.excerpt === "string" && frontmatter.excerpt.trim()
    ? frontmatter.excerpt.trim()
    : stripMarkdown(content.split(/\n\s*\n/)[0] || "");
  const key = `${subsystem}-${area}`;

  return {
    key,
    slug: slugFromEntry(subsystem, area),
    feature: subsystem,
    title,
    subsystem,
    area,
    summary: excerpt,
    excerpt,
    plainText: stripMarkdown(content),
    html,
    headings,
    metadata: normalizeMetadata(frontmatter as Record<string, unknown>),
    routes: asStringArray(frontmatter.routes),
    workAreas: asStringArray(frontmatter.workAreas),
    tags: asStringArray(frontmatter.tags),
  };
}

async function buildManifestFromContent(): Promise<HelpManifest> {
  const contentRoot = resolveContentRoot();
  const files = collectUserHelpFiles(contentRoot);
  const entriesArray = (await Promise.all(files.map((filePath) => buildHelpEntry(filePath)))).filter(
    (entry): entry is HelpEntry => Boolean(entry),
  );

  const entries: Record<string, HelpEntry> = {};
  const workAreaIndex: Record<string, string[]> = {};
  const subsystemIndex: Record<string, string[]> = {};

  for (const entry of entriesArray) {
    entries[entry.key] = entry;

    for (const workArea of entry.workAreas) {
      if (!workAreaIndex[workArea]) workAreaIndex[workArea] = [];
      if (!workAreaIndex[workArea].includes(entry.key)) {
        workAreaIndex[workArea].push(entry.key);
      }
    }

    if (!subsystemIndex[entry.subsystem]) subsystemIndex[entry.subsystem] = [];
    subsystemIndex[entry.subsystem].push(entry.key);
  }

  return {
    entries,
    workAreaIndex,
    subsystemIndex,
    generatedAt: new Date().toISOString(),
  };
}

export const loadHelpManifest = cache(async (): Promise<HelpManifest> => {
  const manifestPath = resolveGeneratedManifestPath();
  if (fs.existsSync(manifestPath)) {
    const raw = fs.readFileSync(manifestPath, "utf8");
    return JSON.parse(raw) as HelpManifest;
  }
  return buildManifestFromContent();
});

export async function listHelpEntries(): Promise<HelpDocSummary[]> {
  const manifest = await loadHelpManifest();
  return Object.values(manifest.entries).sort((a, b) => a.title.localeCompare(b.title));
}

export async function getHelpEntryBySlug(slug: string): Promise<HelpEntry | null> {
  const manifest = await loadHelpManifest();
  const exactEntry = manifest.entries[slug];
  if (exactEntry) return exactEntry;

  const bySlug = Object.values(manifest.entries).find((entry) => entry.slug === slug);
  if (bySlug) return bySlug;

  const overview = manifest.entries[`${slug}-overview`];
  return overview || null;
}

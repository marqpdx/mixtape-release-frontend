import fs from "fs";
import path from "path";
import { renderMarkdown, type ContentHeading } from "@mixtape/content";

type HelpDocMetadata = {
  status?: string;
  class?: string;
  audit?: string;
  library?: string;
  lastUpdated?: string;
  audience?: string;
};

export type HelpDocSummary = {
  slug: string;
  feature: string;
  title: string;
  summary: string;
  plainText: string;
  headings: ContentHeading[];
  metadata: HelpDocMetadata;
  variant: HelpDocVariant;
};

export type HelpDoc = HelpDocSummary & {
  html: string;
  markdown: string;
};

export type HelpDocVariant = "users" | "tech";

const HELP_ROOT = path.resolve(process.cwd(), "..", "..", "..", "puddlejump", "help");

const DOC_SUFFIX_BY_VARIANT: Record<HelpDocVariant, string> = {
  users: "-help-users.md",
  tech: "-help-tech.md",
};

function shouldIgnoreFile(filePath: string): boolean {
  return filePath.includes(`${path.sep}_template${path.sep}`) || filePath.includes(`${path.sep}_deprecated${path.sep}`);
}

function parseMetadataAndBody(raw: string): { metadata: HelpDocMetadata; body: string } {
  const lines = raw.split(/\r?\n/);
  const metadata: HelpDocMetadata = {};

  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line === "---") {
      index += 1;
      continue;
    }

    const match = line.match(/^>\s+\*\*(.+?):\*\*\s*(.*)$/);
    if (!match) {
      break;
    }

    const [, rawKey, rawValue] = match;
    const normalizedKey = rawKey.trim().toLowerCase().replace(/\s+/g, "");
    const value = rawValue.trim();

    if (normalizedKey === "status") metadata.status = value;
    else if (normalizedKey === "class") metadata.class = value;
    else if (normalizedKey === "audit") metadata.audit = value;
    else if (normalizedKey === "library") metadata.library = value;
    else if (normalizedKey === "lastupdated") metadata.lastUpdated = value;
    else if (normalizedKey === "audience") metadata.audience = value;

    index += 1;
  }

  while (index < lines.length && (lines[index].trim() === "" || lines[index].trim() === "---")) {
    index += 1;
  }

  return {
    metadata,
    body: lines.slice(index).join("\n").trim(),
  };
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

function extractTitle(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim() || fallback;
}

function extractSummary(markdown: string): string {
  const blocks = markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  for (const block of blocks) {
    if (block.startsWith("#")) continue;
    if (block.startsWith(">")) continue;
    return stripMarkdown(block);
  }

  return "";
}

async function loadHelpDocFromFile(filePath: string, variant: HelpDocVariant): Promise<HelpDoc> {
  const raw = fs.readFileSync(filePath, "utf8");
  const { metadata, body } = parseMetadataAndBody(raw);
  const feature = path.basename(path.dirname(filePath));
  const title = extractTitle(body, feature);
  const summary = extractSummary(body);
  const { html, headings } = await renderMarkdown(body);
  const plainText = stripMarkdown(body);

  return {
    slug: feature,
    feature,
    title,
    summary,
    plainText,
    headings,
    metadata,
    variant,
    html,
    markdown: body,
  };
}

function collectHelpFiles(rootDir: string, variant: HelpDocVariant): string[] {
  const results: string[] = [];
  const suffix = DOC_SUFFIX_BY_VARIANT[variant];

  const walk = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const nextPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "_deprecated" || entry.name === "_template") continue;
        walk(nextPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!entry.name.endsWith(suffix)) continue;
      if (shouldIgnoreFile(nextPath)) continue;
      results.push(nextPath);
    }
  };

  walk(rootDir);
  return results.sort();
}

export async function listHelpDocs(variant: HelpDocVariant = "users"): Promise<HelpDocSummary[]> {
  const files = collectHelpFiles(HELP_ROOT, variant);
  const docs = await Promise.all(files.map((filePath) => loadHelpDocFromFile(filePath, variant)));

  return docs
    .map((doc) => {
      const { html, markdown, ...summary } = doc;
      void html;
      void markdown;
      return summary;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getHelpDocBySlug(
  slug: string,
  variant: HelpDocVariant = "users"
): Promise<HelpDoc | null> {
  const filePath = path.join(HELP_ROOT, slug, `${slug}${DOC_SUFFIX_BY_VARIANT[variant]}`);
  if (!fs.existsSync(filePath) || shouldIgnoreFile(filePath)) {
    return null;
  }
  return loadHelpDocFromFile(filePath, variant);
}

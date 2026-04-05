import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const helpDir = path.join(repoRoot, "content", "help");
const manifestOut = path.join(repoRoot, "apps", "mixtape", "public", "help-manifest.json");
const typesOut = path.join(repoRoot, "apps", "mixtape", "src", "types", "help-keys.ts");

function walk(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const nextPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_deprecated" || entry.name === "_template") continue;
      results.push(...walk(nextPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith("-help-users.md")) {
      results.push(nextPath);
    }
  }
  return results.sort();
}

function stripMarkdown(markdown) {
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

function asStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function slugFromEntry(subsystem, area) {
  return area === "overview" ? subsystem : `${subsystem}-${area}`;
}

function slugifyHeading(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function extractHeadings(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{2,6})\s+(.+)$/))
    .filter(Boolean)
    .map((match) => ({
      depth: match[1].length,
      text: match[2].trim(),
      id: slugifyHeading(match[2].trim()),
    }));
}

async function renderMarkdown(content) {
  const file = await remark().use(remarkGfm).use(remarkRehype).use(rehypeSlug).use(rehypeStringify).process(content);
  return file.toString();
}

async function run() {
  const files = walk(helpDir);
  const entries = {};
  const workAreaIndex = {};
  const subsystemIndex = {};

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    if (!data.subsystem || !data.area || !data.title) {
      console.warn(`[help] Skipping ${filePath}: missing subsystem, area, or title`);
      continue;
    }

    const key = `${data.subsystem}-${data.area}`;
    const excerpt = typeof data.excerpt === "string" && data.excerpt.trim()
      ? data.excerpt.trim()
      : stripMarkdown(content.split(/\n\s*\n/)[0] || "");

    entries[key] = {
      key,
      slug: slugFromEntry(data.subsystem, data.area),
      feature: data.subsystem,
      title: data.title,
      subsystem: data.subsystem,
      area: data.area,
      summary: excerpt,
      excerpt,
      plainText: stripMarkdown(content),
      html: await renderMarkdown(content),
      headings: extractHeadings(content),
      metadata: {
        status: typeof data.status === "string" ? data.status : undefined,
        class: typeof data.class === "string" ? data.class : undefined,
        audit: typeof data.audit === "string" ? data.audit : undefined,
        library: typeof data.library === "string" ? data.library : undefined,
        lastUpdated:
          typeof data.lastUpdated === "string"
            ? data.lastUpdated
            : typeof data["last-updated"] === "string"
              ? data["last-updated"]
              : undefined,
        audience: typeof data.audience === "string" ? data.audience : undefined,
      },
      routes: asStringArray(data.routes),
      workAreas: asStringArray(data.workAreas),
      tags: asStringArray(data.tags),
    };

    for (const workArea of entries[key].workAreas) {
      if (!workAreaIndex[workArea]) workAreaIndex[workArea] = [];
      if (!workAreaIndex[workArea].includes(key)) workAreaIndex[workArea].push(key);
    }

    if (!subsystemIndex[data.subsystem]) subsystemIndex[data.subsystem] = [];
    subsystemIndex[data.subsystem].push(key);
  }

  const manifest = {
    entries,
    workAreaIndex,
    subsystemIndex,
    generatedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(manifestOut), { recursive: true });
  fs.writeFileSync(manifestOut, JSON.stringify(manifest, null, 2));

  const keys = Object.keys(entries)
    .sort()
    .map((key) => `  | "${key}"`)
    .join("\n");
  const typeSource = `// AUTO-GENERATED — do not edit. Run \`yarn generate:help\` to regenerate.\nexport type HelpKey =\n${keys};\n`;
  fs.writeFileSync(typesOut, typeSource);

  console.log(`[help] Generated manifest with ${Object.keys(entries).length} entries`);
}

run().catch((error) => {
  console.error("[help] Failed to generate manifest", error);
  process.exit(1);
});

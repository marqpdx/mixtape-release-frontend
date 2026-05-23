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
const appSourceDir = path.join(repoRoot, "apps", "mixtape", "src");
const REQUIRED_FRONTMATTER_FIELDS = ["title", "subsystem", "area"];

function walk(dir, predicate = (name) => name.endsWith("-help-users.md")) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const nextPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_deprecated" || entry.name === "_template") continue;
      results.push(...walk(nextPath, predicate));
      continue;
    }
    if (entry.isFile() && predicate(entry.name, nextPath)) {
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

function loadRuntimeWorkAreas() {
  const files = walk(
    appSourceDir,
    (name) => name.endsWith(".ts") || name.endsWith(".tsx"),
  );
  const matcher = /useHelpRegistration\(\s*["'`]([^"'`]+)["'`]\s*\)/g;
  const workAreas = new Set();

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    for (const match of raw.matchAll(matcher)) {
      workAreas.add(match[1]);
    }
  }

  return workAreas;
}

async function run() {
  const files = walk(helpDir);
  const entries = {};
  const workAreaIndex = {};
  const subsystemIndex = {};
  const manifestErrors = [];
  const runtimeWorkAreas = loadRuntimeWorkAreas();

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);
    const missingFields = REQUIRED_FRONTMATTER_FIELDS.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      manifestErrors.push(
        `[help] ${filePath}: missing required frontmatter fields: ${missingFields.join(", ")}`,
      );
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

    const invalidRoutes = entries[key].routes.filter((route) => route.includes("?"));
    if (invalidRoutes.length > 0) {
      manifestErrors.push(
        `[help] ${filePath}: route patterns must not include query strings: ${invalidRoutes.join(", ")}`,
      );
    }

    for (const workArea of entries[key].workAreas) {
      if (!runtimeWorkAreas.has(workArea)) {
        manifestErrors.push(
          `[help] ${filePath}: work area "${workArea}" is not registered via useHelpRegistration()`,
        );
      }
      if (!workAreaIndex[workArea]) workAreaIndex[workArea] = [];
      if (!workAreaIndex[workArea].includes(key)) workAreaIndex[workArea].push(key);
    }

    if (!subsystemIndex[data.subsystem]) subsystemIndex[data.subsystem] = [];
    subsystemIndex[data.subsystem].push(key);
  }

  const unmappedRuntimeWorkAreas = Array.from(runtimeWorkAreas).filter(
    (workArea) => !workAreaIndex[workArea],
  );
  for (const workArea of unmappedRuntimeWorkAreas) {
    manifestErrors.push(
      `[help] runtime work area "${workArea}" has no mapped help content in content/help`,
    );
  }

  if (manifestErrors.length > 0) {
    for (const error of manifestErrors) {
      console.error(error);
    }
    throw new Error(`Help manifest validation failed with ${manifestErrors.length} issue(s)`);
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

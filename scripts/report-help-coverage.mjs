import fs from "fs";
import path from "path";
import matter from "gray-matter";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const authAppDir = path.join(repoRoot, "apps", "mixtape", "src", "app", "(authenticated)");
const helpDir = path.join(repoRoot, "content", "help");
const sourceDir = path.join(repoRoot, "apps", "mixtape", "src");

const REQUIRED_FRONTMATTER_FIELDS = ["title", "subsystem", "area"];

function walk(dir, predicate) {
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

function asStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function routeFromPagePath(filePath) {
  const routePath = path.relative(authAppDir, path.dirname(filePath));
  const segments = routePath.split(path.sep).filter(Boolean);
  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function routePatternToRegex(pattern) {
  const regexStr = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[^/]+");
  return new RegExp(`^${regexStr}$`);
}

function matchRoute(pathname, patterns) {
  return patterns.some((pattern) => routePatternToRegex(pattern).test(pathname));
}

function inferSubsystemFromPathname(pathname) {
  if (pathname.startsWith("/groups/") && pathname.includes("/workbench")) return "workbench";
  if (pathname.startsWith("/groups/") && pathname.includes("/projects")) return "projects";
  if (pathname.startsWith("/groups/") && pathname.includes("/almanac")) return "almanac";
  if (pathname.startsWith("/groups/") && pathname.includes("/puddlejump")) return "puddlejump";
  if (pathname.startsWith("/groups/") && pathname.includes("/library")) return "stackroom";
  if (pathname.startsWith("/groups/") && pathname.includes("/writing")) return "writing";
  if (pathname.startsWith("/groups/")) return "groups";

  if (pathname.includes("/workbench")) return "workbench";
  if (pathname.includes("/writing")) return "writing";
  if (pathname.startsWith("/stackroom")) return "stackroom";
  if (pathname.startsWith("/puddlejump")) return "puddlejump";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/aperture")) return "aperture";
  if (pathname.startsWith("/bazaar")) return "bazaar";
  if (pathname.startsWith("/clients")) return "clients";
  if (pathname.startsWith("/community-hub")) return "community-hub";
  if (pathname.startsWith("/console")) return "console";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/demos")) return "demos";
  if (pathname.startsWith("/dispatch")) return "dispatch";
  if (pathname.startsWith("/feedback")) return "feedback";
  if (pathname.startsWith("/help")) return "help";
  if (pathname.startsWith("/living-books")) return "living-books";
  if (pathname.startsWith("/member")) return "member";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/seed")) return "writing";
  if (pathname.startsWith("/settings")) return "member";
  if (pathname.includes("/almanac")) return "almanac";
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/mobile")) return "mobile";
  return null;
}

function loadHelpEntries() {
  const files = walk(helpDir, (name) => name.endsWith("-help-users.md"));
  const entries = [];
  const skipped = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    const { data } = matter(raw);
    const missingFields = REQUIRED_FRONTMATTER_FIELDS.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      skipped.push({
        filePath,
        missingFields,
      });
      continue;
    }

    entries.push({
      filePath,
      key: `${data.subsystem}-${data.area}`,
      subsystem: data.subsystem,
      area: data.area,
      title: data.title,
      routes: asStringArray(data.routes),
      workAreas: asStringArray(data.workAreas),
    });
  }

  return { entries, skipped };
}

function loadAuthenticatedRoutes() {
  const files = walk(authAppDir, (name) => name === "page.tsx");
  return files.map((filePath) => ({
    filePath,
    route: routeFromPagePath(filePath),
  }));
}

function loadRuntimeWorkAreas() {
  const files = walk(sourceDir, (name) => name.endsWith(".ts") || name.endsWith(".tsx"));
  const workAreas = new Map();
  const matcher = /useHelpRegistration\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf8");
    for (const match of raw.matchAll(matcher)) {
      const key = match[1];
      if (!workAreas.has(key)) workAreas.set(key, []);
      workAreas.get(key).push(filePath);
    }
  }

  return Array.from(workAreas.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, filePaths]) => ({ key, filePaths: filePaths.sort() }));
}

function toRelativePath(filePath) {
  return path.relative(repoRoot, filePath);
}

function formatFileList(filePaths) {
  return filePaths.map((filePath) => `    - ${toRelativePath(filePath)}`).join("\n");
}

function run() {
  const { entries, skipped } = loadHelpEntries();
  const routes = loadAuthenticatedRoutes();
  const runtimeWorkAreas = loadRuntimeWorkAreas();

  const subsystemIndex = new Map();
  const declaredWorkAreas = new Map();
  const impossiblePatterns = [];

  for (const entry of entries) {
    if (!subsystemIndex.has(entry.subsystem)) subsystemIndex.set(entry.subsystem, []);
    subsystemIndex.get(entry.subsystem).push(entry);

    for (const workArea of entry.workAreas) {
      if (!declaredWorkAreas.has(workArea)) declaredWorkAreas.set(workArea, []);
      declaredWorkAreas.get(workArea).push(entry);
    }

    for (const route of entry.routes) {
      if (route.includes("?")) {
        impossiblePatterns.push({
          key: entry.key,
          route,
          filePath: entry.filePath,
        });
      }
    }
  }

  const routeCoverage = routes.map(({ filePath, route }) => {
    const directMatches = entries.filter((entry) => matchRoute(route, entry.routes));
    const subsystem = inferSubsystemFromPathname(route);
    const subsystemMatches = subsystem ? subsystemIndex.get(subsystem) ?? [] : [];

    return {
      filePath,
      route,
      subsystem,
      directMatches,
      subsystemMatches,
    };
  });

  const directCoverage = routeCoverage.filter((item) => item.directMatches.length > 0);
  const collisions = routeCoverage.filter((item) => item.directMatches.length > 1);
  const subsystemFallbackOnly = routeCoverage.filter(
    (item) => item.directMatches.length === 0 && item.subsystemMatches.length > 0,
  );
  const unresolved = routeCoverage.filter(
    (item) => item.directMatches.length === 0 && item.subsystemMatches.length === 0,
  );

  const runtimeKeys = new Set(runtimeWorkAreas.map((item) => item.key));
  const declaredKeys = new Set(declaredWorkAreas.keys());

  const deadDeclaredWorkAreas = Array.from(declaredWorkAreas.entries())
    .filter(([key]) => !runtimeKeys.has(key))
    .sort(([left], [right]) => left.localeCompare(right));

  const unmappedRuntimeWorkAreas = runtimeWorkAreas.filter(({ key }) => !declaredKeys.has(key));

  console.log("Help Coverage Report");
  console.log("====================");
  console.log(`Authenticated routes: ${routes.length}`);
  console.log(`Help entries: ${entries.length}`);
  console.log(`Runtime work areas: ${runtimeWorkAreas.length}`);
  console.log("");

  console.log("Route Coverage");
  console.log("--------------");
  console.log(`Direct route matches: ${directCoverage.length}/${routes.length}`);
  console.log(`Direct route collisions: ${collisions.length}`);
  console.log(`Subsystem fallback only: ${subsystemFallbackOnly.length}`);
  console.log(`Unresolved routes: ${unresolved.length}`);
  console.log("");

  if (collisions.length > 0) {
    console.log("Route collisions:");
    for (const item of collisions) {
      console.log(`  - ${item.route} (${toRelativePath(item.filePath)})`);
      console.log(`    entries: ${item.directMatches.map((entry) => entry.key).join(", ")}`);
    }
    console.log("");
  }

  if (subsystemFallbackOnly.length > 0) {
    console.log("Subsystem fallback only:");
    for (const item of subsystemFallbackOnly) {
      console.log(`  - ${item.route} -> ${item.subsystem}`);
    }
    console.log("");
  }

  if (unresolved.length > 0) {
    console.log("Unresolved authenticated routes:");
    for (const item of unresolved) {
      console.log(`  - ${item.route} (${toRelativePath(item.filePath)})`);
    }
    console.log("");
  }

  console.log("Work Area Coverage");
  console.log("------------------");
  console.log(`Declared work areas: ${declaredKeys.size}`);
  console.log(`Dead declared work areas: ${deadDeclaredWorkAreas.length}`);
  console.log(`Runtime work areas without help mapping: ${unmappedRuntimeWorkAreas.length}`);
  console.log("");

  if (deadDeclaredWorkAreas.length > 0) {
    console.log("Dead declared work areas:");
    for (const [key, mappedEntries] of deadDeclaredWorkAreas) {
      console.log(`  - ${key} -> ${mappedEntries.map((entry) => entry.key).join(", ")}`);
    }
    console.log("");
  }

  if (unmappedRuntimeWorkAreas.length > 0) {
    console.log("Runtime work areas without mapped help:");
    for (const item of unmappedRuntimeWorkAreas) {
      console.log(`  - ${item.key}`);
      console.log(formatFileList(item.filePaths));
    }
    console.log("");
  }

  console.log("Manifest Risks");
  console.log("--------------");
  console.log(`Skipped help files: ${skipped.length}`);
  console.log(`Impossible route patterns: ${impossiblePatterns.length}`);
  console.log("");

  if (skipped.length > 0) {
    console.log("Skipped help files:");
    for (const item of skipped) {
      console.log(
        `  - ${toRelativePath(item.filePath)} (missing: ${item.missingFields.join(", ")})`,
      );
    }
    console.log("");
  }

  if (impossiblePatterns.length > 0) {
    console.log("Impossible route patterns:");
    for (const item of impossiblePatterns) {
      console.log(`  - ${item.route} -> ${item.key} (${toRelativePath(item.filePath)})`);
    }
    console.log("");
  }
}

run();

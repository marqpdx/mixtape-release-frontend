import { readFile } from "node:fs/promises";
import path from "node:path";
import UnifiedNavbar from "@components/layout/UnifiedNavbar";

function extractBetween(haystack: string, start: string, end: string) {
  const i = haystack.indexOf(start);
  if (i === -1) return "";
  const j = haystack.indexOf(end, i + start.length);
  if (j === -1) return "";
  return haystack.slice(i + start.length, j);
}

function extractAllStyleBlocks(html: string) {
  const styles: string[] = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const chunk = m[1]?.trim();
    if (chunk) styles.push(chunk);
  }
  return styles.join("\n\n");
}

export default async function ConversationArtifactPage() {
  // NOTE: process.cwd() should be apps/crossroads when running this app,
  // but even if it isn't, this path is still correct once you run from the app root.
  const htmlPath = path.resolve(
    process.cwd(),
    "public/artifacts/another-one/conversation_trimmed.html"
  );

  const raw = await readFile(htmlPath, "utf-8");
  const styles = extractAllStyleBlocks(raw);
  const body = extractBetween(raw, "<body>", "</body>") || raw;

  return (
    <>
      <UnifiedNavbar extraCompact />
      <div>
        {styles ? <style dangerouslySetInnerHTML={{ __html: styles }} /> : null}
        <div dangerouslySetInnerHTML={{ __html: body }} />
      </div>
    </>
  );
}

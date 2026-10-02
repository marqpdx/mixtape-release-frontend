import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const dictionaryDir = join(process.cwd(), "public", "spell");
  const [aff, dic] = await Promise.all([
    readFile(join(dictionaryDir, "en-US.aff"), "utf8"),
    readFile(join(dictionaryDir, "en-US.dic"), "utf8"),
  ]);
  return Response.json(
    { aff, dic },
    { headers: { "Cache-Control": "public, max-age=86400, immutable" } },
  );
}

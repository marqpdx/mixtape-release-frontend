import { NextResponse } from "next/server";
import { loadHelpManifest } from "@/lib/help/helpManifest";

export async function GET() {
  const manifest = await loadHelpManifest();
  return NextResponse.json(manifest);
}

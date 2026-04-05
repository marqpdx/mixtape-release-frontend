import type { ContentHeading } from "@mixtape/content";

export type HelpDocMetadata = {
  status?: string;
  class?: string;
  audit?: string;
  library?: string;
  lastUpdated?: string;
  audience?: string;
};

export interface HelpEntry {
  key: string;
  slug: string;
  feature: string;
  title: string;
  subsystem: string;
  area: string;
  summary: string;
  excerpt: string;
  plainText: string;
  html: string;
  headings: ContentHeading[];
  metadata: HelpDocMetadata;
  routes: string[];
  workAreas: string[];
  tags: string[];
}

export type HelpDocSummary = Omit<HelpEntry, "html">;

export interface HelpManifest {
  entries: Record<string, HelpEntry>;
  workAreaIndex: Record<string, string[]>;
  subsystemIndex: Record<string, string[]>;
  generatedAt: string;
}

export interface ResolvedHelp {
  entries: HelpEntry[];
  source: "workArea" | "route" | "subsystem" | "fallback";
}

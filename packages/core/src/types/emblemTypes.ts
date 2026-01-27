// Shared across app (pickers, group/profile serializers, etc.)
export type EmblemCategory = 'abstract' | 'person' | 'upload' | 'custom';

export interface EmblemTypeInline {
  id: string;
  engine: string;
  style: string;
  category?: EmblemCategory;
}

export interface EmblemInline {
  id: string;

  // raw storage keys (server may include them)
  size_48?: string | null;
  size_96?: string | null;
  size_192?: string | null;
  size_512?: string | null;
  image_path?: string | null;

  // resolved, absolute URLs (preferred in UI)
  size_48_url?: string | null;
  size_96_url?: string | null;
  size_192_url?: string | null;
  size_512_url?: string | null;
  url?: string | null;

  // generator hints
  seed?: string;
  initials?: string;
  fg?: string;
  bg?: string;

  // optional metadata
  reuse_policy?: 'anyone' | 'owner_only' | 'public_attr';
  license?: 'CC0' | 'CC-BY' | 'CC-BY-SA' | 'PRO';

  // optional type
  type?: EmblemTypeInline;
}

/** Pick the best URL for a given render size. */
export function getBestEmblemUrl(e?: EmblemInline | null, px: number = 96): string | undefined {
  if (!e) return undefined;
  // Prefer server-provided URLs
  const bySizeUrl =
    (px <= 48 && (e.size_48_url || e.size_48)) ||
    (px <= 96 && (e.size_96_url || e.size_96)) ||
    (px <= 192 && (e.size_192_url || e.size_192)) ||
    (e.size_512_url || e.size_512 || e.url);
  return bySizeUrl ?? undefined;
}

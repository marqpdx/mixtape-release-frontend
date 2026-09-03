// types.ts — Group Public Landing config shape (mirrors GroupPublicConfig API response)

export type GroupPublicTier = "t1" | "t2";

export interface GroupPublicCta {
  label: string;
  action: string; // "scroll:subscribe" | "scroll:featured" | URL
}

export interface FeaturedPiece {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  writing_kind: string;
  published_at: string | null;
  reading_time: number | null;
  author: {
    username: string;
    display_name: string;
  };
}

export type TypographySetting = "journal" | "notice";

export interface GroupPublicPresentation {
  typography_setting?: TypographySetting | null;
  template_id?: string | null;
  palette_id?: string | null;
  font_id?: string | null;
}

export interface GroupPublicLandingConfig {
  tier: GroupPublicTier;
  group: {
    id: string;
    slug: string;
    title: string;
    summary: string;
    tagline?: string | null;
    profile_image_url: string | null;
    background_image_url: string | null;
  };
  presentation?: GroupPublicPresentation | null;
  // null for T1
  hero: {
    eyebrow: string;
    headline: string;
    body: string;
    primary_cta: GroupPublicCta;
    secondary_cta: GroupPublicCta;
  } | null;
  featured_content: {
    type: string;
    layout: string;
    collection_id: string | null;
    pieces: FeaturedPiece[];
  };
  about: {
    text: string;
    descriptors: string[];
  };
  engagement: {
    text: string;
    capability_pills: string[];
    cta: GroupPublicCta;
  };
  subscription: {
    list_slug: string | null;
    has_list: boolean;
  };
  // T2: AI-assembled Rows layout. null for T1.
  rows: unknown[] | null;
  generation_status: "none" | "pending" | "complete" | "stale";
}

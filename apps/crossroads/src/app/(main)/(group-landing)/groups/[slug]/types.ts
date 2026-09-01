// types.ts — Group Public Landing config shape (mirrors GroupPublicConfig API response)

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

export interface GroupPublicLandingConfig {
  group: {
    id: string;
    slug: string;
    title: string;
    profile_image_url: string | null;
    background_image_url: string | null;
  };
  hero: {
    eyebrow: string;
    headline: string;
    body: string;
    primary_cta: GroupPublicCta;
    secondary_cta: GroupPublicCta;
  };
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
}

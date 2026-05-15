// Ported verbatim from prototype/data.jsx → THEMES / FONT_PAIRS / BACKGROUNDS
// Do not edit token values here — update prototype/data.jsx and re-port.

export type ThemeKey   = 'paper' | 'noir' | 'garden' | 'neon' | 'sunset';
export type FontKey    = 'editorial' | 'modern' | 'mono' | 'playful';
export type BgKey      = 'none' | 'paper' | 'grid' | 'leaves' | 'sunset' | 'halftone';
export type SectionId  = 'header' | 'pinned' | 'now' | 'activity' | 'friends' | 'qa' | 'badges' | 'links';
export type AvatarShape = 'rounded' | 'circle' | 'square' | 'blob';
export type Density    = 'compact' | 'cozy' | 'roomy';

export interface ThemeTokens {
  '--bg': string;
  '--surface': string;
  '--ink': string;
  '--ink-soft': string;
  '--rule': string;
  '--accent': string;
  '--accent-ink': string;
  '--avatar-radius': string;
  '--btn-radius': string;
}

export interface ThemeDef {
  name: string;
  sub: string;
  tokens: ThemeTokens;
  accents: string[];
  bg: BgKey;
}

export const THEMES: Record<ThemeKey, ThemeDef> = {
  paper: {
    name: 'Paper',
    sub: 'warm · readable · classic',
    tokens: {
      '--bg': '#efece6',
      '--surface': '#f7f5f0',
      '--ink': '#1a1814',
      '--ink-soft': '#7a7367',
      '--rule': '#d8d3c8',
      '--accent': '#c2410c',
      '--accent-ink': '#fff7ed',
      '--avatar-radius': '24px',
      '--btn-radius': '999px',
    },
    accents: ['#c2410c', '#1d4ed8', '#15803d', '#a16207', '#7c3aed', '#be123c'],
    bg: 'paper',
  },
  noir: {
    name: 'Noir',
    sub: 'high contrast · cinematic',
    tokens: {
      '--bg': '#0d0c0a',
      '--surface': '#1a1814',
      '--ink': '#f4f1ea',
      '--ink-soft': '#8a8276',
      '--rule': '#2a2722',
      '--accent': '#fde68a',
      '--accent-ink': '#0d0c0a',
      '--avatar-radius': '50%',
      '--btn-radius': '8px',
    },
    accents: ['#fde68a', '#fb7185', '#22d3ee', '#a78bfa', '#84cc16', '#fb923c'],
    bg: 'grid',
  },
  garden: {
    name: 'Garden',
    sub: 'organic · soft · grounded',
    tokens: {
      '--bg': '#eef0e6',
      '--surface': '#f6f7ee',
      '--ink': '#1f2a17',
      '--ink-soft': '#6b7458',
      '--rule': '#cfd5b8',
      '--accent': '#4d7c0f',
      '--accent-ink': '#f7faea',
      '--avatar-radius': '50%',
      '--btn-radius': '999px',
    },
    accents: ['#4d7c0f', '#9a3412', '#0f766e', '#a16207', '#6d28d9', '#1d4ed8'],
    bg: 'leaves',
  },
  neon: {
    name: 'Neon',
    sub: 'electric · grid · midnight',
    tokens: {
      '--bg': '#08070d',
      '--surface': '#11101c',
      '--ink': '#f1efff',
      '--ink-soft': '#7a7693',
      '--rule': '#2a2740',
      '--accent': '#22d3ee',
      '--accent-ink': '#08070d',
      '--avatar-radius': '12px',
      '--btn-radius': '4px',
    },
    accents: ['#22d3ee', '#f472b6', '#a78bfa', '#facc15', '#34d399', '#fb7185'],
    bg: 'grid',
  },
  sunset: {
    name: 'Sunset',
    sub: 'warm · gradient · soft',
    tokens: {
      '--bg': '#fdf2e9',
      '--surface': '#fde8d4',
      '--ink': '#3d1d10',
      '--ink-soft': '#9a6a55',
      '--rule': '#f1c8a8',
      '--accent': '#db2777',
      '--accent-ink': '#fff1f7',
      '--avatar-radius': '50%',
      '--btn-radius': '999px',
    },
    accents: ['#db2777', '#ea580c', '#7c3aed', '#0ea5e9', '#16a34a', '#ca8a04'],
    bg: 'sunset',
  },
};

export interface FontPairDef {
  name: string;
  display: string;
  body: string;
  sample: string;
}

export const FONT_PAIRS: Record<FontKey, FontPairDef> = {
  editorial: {
    name: 'Editorial',
    display: "var(--font-instrument-serif), Georgia, serif",
    body: "var(--font-instrument-sans), system-ui, sans-serif",
    sample: 'Aa',
  },
  modern: {
    name: 'Modern',
    display: "var(--font-space-grotesk), system-ui, sans-serif",
    body: "var(--font-space-grotesk), system-ui, sans-serif",
    sample: 'Aa',
  },
  mono: {
    name: 'Mono',
    display: "var(--font-jetbrains-mono), monospace",
    body: "var(--font-jetbrains-mono), monospace",
    sample: 'Aa',
  },
  playful: {
    name: 'Playful',
    display: "var(--font-caprasimo), serif",
    body: "var(--font-dm-sans), system-ui, sans-serif",
    sample: 'Aa',
  },
};

export const ROW_GAP: Record<Density, string> = {
  compact: '16px',
  cozy: '32px',
  roomy: '56px',
};

export const SECTION_NAMES: Record<SectionId, string> = {
  header:   'Header',
  pinned:   'Pinned showcase',
  now:      'Now playing',
  activity: 'Activity',
  friends:  'Friends',
  qa:       'About / Q&A',
  badges:   'Badges',
  links:    'Featured links',
};

export const KNOWN_SECTIONS: SectionId[] = [
  'header', 'pinned', 'now', 'activity', 'friends', 'qa', 'badges', 'links',
];

export const DEFAULT_SECTION_LAYOUT = KNOWN_SECTIONS.map(id => ({ id, visible: true }));

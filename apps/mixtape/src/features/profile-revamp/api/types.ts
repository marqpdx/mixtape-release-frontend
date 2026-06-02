import type { ThemeKey, FontKey, BgKey, SectionId, AvatarShape, Density } from '../lib/themes';

export type { ThemeKey, FontKey, BgKey, SectionId, AvatarShape, Density };

export interface SectionEntry {
  id: SectionId;
  visible: boolean;
}

export interface PinnedTrackDTO {
  position: number;
  label: string;
  name: string;
  duration: string;
}

export interface PinnedDTO {
  kind: 'tape' | 'project' | 'quote';
  label: string;
  title: string;
  subtitle: string;
  mark: string;
  cover: string | null;
  cta_target: string;
  tracks: PinnedTrackDTO[];
}

export interface NowDTO {
  track: string;
  artist: string;
  label: string;
  source: string;
  updated_at: string;
}

export interface ActivityDTO {
  when: string;
  verb: string;
  what: string;
}

export interface FriendDTO {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  online?: boolean;
}

export interface QAItemDTO {
  position: number;
  q: string;
  a: string;
}

export interface BadgeDTO {
  glyph: string;
  text: string;
  featured: boolean;
  earned_at: string;
}

export interface LinkDTO {
  position: number;
  icon: string;
  title: string;
  sub: string;
  url: string;
}

export interface ProfileStats {
  followers: string;
  following: string;
  mixtapes: number;
  joined: string;
}

export interface ProfileDTO {
  username: string;
  displayName: string;
  role: string;
  bio: string;
  status: string;
  avatarUrl: string | null;
  backgroundImageUrl: string | null;
  avatarSticker: string;
  theme: ThemeKey;
  accent: string;
  font: FontKey;
  background: BgKey;
  avatarShape: AvatarShape;
  density: Density;
  decorations: boolean;
  stats: ProfileStats;
  sectionLayout: SectionEntry[];
  pinned: PinnedDTO | null;
  nowPlaying: NowDTO | null;
  activity: ActivityDTO[];
  friends: FriendDTO[];
  qa: QAItemDTO[];
  badges: BadgeDTO[];
  links: LinkDTO[];
  version: number;
}

export type ProfilePatch = Partial<
  Pick<ProfileDTO, 'theme' | 'accent' | 'font' | 'background' | 'avatarShape' | 'density' | 'decorations' | 'avatarSticker'> &
  { displayName: string; bio: string; status: string }
>;

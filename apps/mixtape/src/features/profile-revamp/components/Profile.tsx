import type { ProfileDTO, SectionId } from '../api/types';
import { computeAccentInk } from '../lib/contrast';
import { FONT_PAIRS, ROW_GAP } from '../lib/themes';
import ProfileHeader from './ProfileHeader';
import PinnedShowcase from './PinnedShowcase';
import NowPlaying from './NowPlaying';
import ActivityFeed from './ActivityFeed';
import FriendsGrid from './FriendsGrid';
import AboutQA from './AboutQA';
import BadgeRow from './BadgeRow';
import FeaturedLinks from './FeaturedLinks';
import PaperBg from './backgrounds/PaperBg';
import GridBg from './backgrounds/GridBg';
import LeavesBg from './backgrounds/LeavesBg';
import SunsetBg from './backgrounds/SunsetBg';
import HalftoneBg from './backgrounds/HalftoneBg';

interface Props {
  profile: ProfileDTO;
  isEditor?: boolean;
}

const BG_COMPONENTS = {
  none:     null,
  paper:    PaperBg,
  grid:     GridBg,
  leaves:   LeavesBg,
  sunset:   SunsetBg,
  halftone: HalftoneBg,
};

function SectionComponent({ id, profile, isEditor }: { id: SectionId; profile: ProfileDTO; isEditor?: boolean }) {
  switch (id) {
    case 'header':   return <ProfileHeader profile={profile} isEditor={isEditor} />;
    case 'pinned':   return profile.pinned ? <PinnedShowcase pinned={profile.pinned} /> : null;
    case 'now':      return profile.nowPlaying ? <NowPlaying now={profile.nowPlaying} /> : null;
    case 'activity': return <ActivityFeed activity={profile.activity} />;
    case 'friends':  return <FriendsGrid friends={profile.friends} />;
    case 'qa':       return <AboutQA qa={profile.qa} />;
    case 'badges':   return <BadgeRow badges={profile.badges} />;
    case 'links':    return <FeaturedLinks links={profile.links} />;
    default:         return null;
  }
}

export default function Profile({ profile, isEditor }: Props) {
  const { theme, accent, font, background, density, sectionLayout } = profile;

  const BgComp = BG_COMPONENTS[background ?? 'none'];
  const rowGap = ROW_GAP[density ?? 'cozy'];
  const fontPair = FONT_PAIRS[font ?? 'editorial'];

  const cssVars: Record<string, string> = {
    '--profile-accent':     accent,
    '--profile-accent-ink': computeAccentInk(accent),
    '--font-display': fontPair.display,
    '--font-body':    fontPair.body,
  };

  const visibleSections = (sectionLayout ?? []).filter(s => s.visible);

  return (
    <div
      data-theme={theme}
      data-font={font}
      data-density={density}
      data-editing={isEditor ? 'true' : undefined}
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-body)',
        ...cssVars,
      }}
    >
      {BgComp && <BgComp />}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '32px 20px', display: 'flex', flexDirection: 'column', gap: rowGap }}>
        {visibleSections.map(entry => (
          <SectionComponent key={entry.id} id={entry.id} profile={profile} isEditor={isEditor} />
        ))}
      </div>
    </div>
  );
}

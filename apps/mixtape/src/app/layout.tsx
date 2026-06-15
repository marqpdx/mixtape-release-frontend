import { Providers } from '@/components/providers';
import { SkipLinks } from '@/components/accessibility';
import { ProfileDrawer } from '@/features/profile-revamp/components/ProfileDrawer';
import { Analytics } from '@/components/analytics';
import {
  Inter, DM_Serif_Display, Source_Serif_4,
  Instrument_Serif, Instrument_Sans,
  Space_Grotesk, JetBrains_Mono,
  DM_Sans, Caprasimo, Newsreader, Hanken_Grotesk,
} from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
});

const dmSerif = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

// Profile revamp font pairings
const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const caprasimo = Caprasimo({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-caprasimo',
  display: 'swap',
});

const sourceSerif = Source_Serif_4({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
});

const newsreader = Newsreader({
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-read',
  display: 'swap',
});

const hankenGrotesk = Hanken_Grotesk({
  weight: ['500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-head',
  display: 'swap',
});

const defaultGroupName =
  process.env.NEXT_PUBLIC_DEFAULT_GROUP_NAME ||
  process.env.MIXTAPE_DEFAULT_GROUP_NAME ||
  "Crossroads";

export const metadata = {
  title: defaultGroupName,
  description: 'Mixtape Release Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSerif.variable} ${sourceSerif.variable} ${instrumentSerif.variable} ${instrumentSans.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} ${dmSans.variable} ${caprasimo.variable} ${newsreader.variable} ${hankenGrotesk.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <Analytics />
          <SkipLinks />
          {children}
          <ProfileDrawer />
        </Providers>
      </body>
    </html>
  );
}

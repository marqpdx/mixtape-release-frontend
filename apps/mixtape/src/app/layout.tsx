import { Providers } from '@/components/providers';
import { SkipLinks } from '@/components/accessibility';
import { Inter, DM_Serif_Display } from 'next/font/google';

// Configure Inter font with optimization
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
});

// Configure DM Serif Display font with optimization
const dmSerif = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-dm-serif',
  display: 'swap',
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

// Note: Joan font - if available from Google Fonts, add here
// For now using system serif fallback in theme config

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
    <html lang="en" className={`${inter.variable} ${dmSerif.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <SkipLinks />
          {children}
        </Providers>
      </body>
    </html>
  );
}

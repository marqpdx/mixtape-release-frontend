// apps/crossroads/src/app/layout.tsx

import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Analytics } from "@/components/analytics/Analytics";
import { getThemePreferenceBootstrapScript } from "@mixtape/core/theme/theme-preferences";
import localFont from "next/font/local";

const pacifico = localFont({
  src: "../fonts/pacifico/latin-normal.woff2",
  weight: "400",
  variable: "--font-pacifico",
  display: "swap",
  preload: false,
});

const allura = localFont({
  src: "../fonts/allura/latin-normal.woff2",
  weight: "400",
  variable: "--font-allura",
  display: "swap",
  preload: false,
});

const greatVibes = localFont({
  src: "../fonts/greatvibes/latin-normal.woff2",
  weight: "400",
  variable: "--font-great-vibes",
  display: "swap",
  preload: false,
});

const nunitoSans = localFont({
  src: "../fonts/nunitosans/latin-normal.woff2",
  weight: "400 600",
  variable: "--font-nunito-sans",
  display: "swap",
  preload: false,
});

const figtree = localFont({
  src: "../fonts/figtree/latin-normal.woff2",
  weight: "400 600",
  variable: "--font-figtree",
  display: "swap",
  preload: false,
});

const sora = localFont({
  src: "../fonts/sora/latin-normal.woff2",
  weight: "400 600",
  variable: "--font-sora",
  display: "swap",
  preload: false,
});

const quicksand = localFont({
  src: "../fonts/quicksand/latin-normal.woff2",
  weight: "400 600",
  variable: "--font-quicksand",
  display: "swap",
  preload: false,
});

const manrope = localFont({
  src: "../fonts/manrope/latin-normal.woff2",
  weight: "400 600",
  variable: "--font-manrope",
  display: "swap",
  preload: false,
});

const alegreyaSans = localFont({
  src: [
    { path: "../fonts/alegreyasans/latin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/alegreyasans/latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/alegreyasans/latin-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-alegreya-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Crossroads",
  description: "Crossroads - A community platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={[
        pacifico.variable,
        allura.variable,
        greatVibes.variable,
        nunitoSans.variable,
        figtree.variable,
        sora.variable,
        quicksand.variable,
        manrope.variable,
        alegreyaSans.variable,
      ].join(" ")}
    >
      <head>
        <style>{`body { overflow-x: hidden; }`}</style>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: getThemePreferenceBootstrapScript("crossroads"),
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <Analytics />
          {children}
        </Providers>
      </body>
    </html>
  );
}

// apps/crossroads/src/app/layout.tsx

import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import {
  Pacifico,
  Allura,
  Great_Vibes,
  Nunito_Sans,
  Figtree,
  Sora,
  Quicksand,
  Manrope,
  Alegreya_Sans,
} from "next/font/google";

const pacifico = Pacifico({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-pacifico",
  display: "swap",
});

const allura = Allura({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-allura",
  display: "swap",
});

const greatVibes = Great_Vibes({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-great-vibes",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  display: "swap",
});

const figtree = Figtree({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const sora = Sora({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const quicksand = Quicksand({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

const manrope = Manrope({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const alegreyaSans = Alegreya_Sans({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
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
      <body style={{ overflowX: 'hidden' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

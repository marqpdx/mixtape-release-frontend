// apps/crossroads/src/app/layout.tsx

import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import Footer from "@components/layout/Footer";

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
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: "1 0 auto" }}>{children}</div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}

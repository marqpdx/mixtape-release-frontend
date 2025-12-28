import type { Metadata } from "next";
import { Provider } from "@/providers/provider";

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
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}

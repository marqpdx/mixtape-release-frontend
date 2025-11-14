import { Providers } from '@/components/providers';

export const metadata = {
  title: 'Mixtape Release',
  description: 'Mixtape Release Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

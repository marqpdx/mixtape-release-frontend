// (main)/(group-landing)/layout.tsx
//
// Layout for public Group landing pages (Group Public Landing ADR).
// No platform navigation — Decision 11: the page belongs to the Group,
// not the platform. Anonymous visitors see no Crossroads chrome.

import { SurfaceTransitionProvider } from "./SurfaceTransition";

export default function GroupPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SurfaceTransitionProvider>{children}</SurfaceTransitionProvider>;
}

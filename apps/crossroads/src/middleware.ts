// Subdomain routing middleware for Crossroads.
//
// Rewrites {slug}.apps.crossroads.place → /groups/{slug} internally so that
// the Next.js app serves the correct page without a redirect. The browser URL
// stays as the subdomain — this is a server-side rewrite only.
//
// The tenant namespace is *.apps.crossroads.place, keeping platform subdomains
// (api, www, chat) on the root domain with no collision risk.

import { NextRequest, NextResponse } from "next/server";

const TENANT_SUFFIX =
  process.env.NEXT_PUBLIC_TENANT_SUFFIX ?? ".apps.crossroads.place";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  if (hostname.endsWith(TENANT_SUFFIX)) {
    const slug = hostname.slice(0, hostname.length - TENANT_SUFFIX.length);

    if (slug) {
      const url = req.nextUrl.clone();
      // Preserve sub-paths: mindful-brilliance.apps.crossroads.place/writing
      //   → /groups/mindful-brilliance/writing
      const existingPath = url.pathname === "/" ? "" : url.pathname;
      url.pathname = `/groups/${slug}${existingPath}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};

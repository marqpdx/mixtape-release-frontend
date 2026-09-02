// Subdomain routing middleware for Crossroads.
//
// Rewrites {slug}.crossroads.place → /groups/{slug} internally so that the
// Next.js app serves the correct page without a redirect. The browser URL
// stays as the subdomain — this is a server-side rewrite only.
//
// Reserved subdomains are passed through unchanged so platform routing
// (www, api, app, chat) continues to work normally.

import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "crossroads.place";

const RESERVED = new Set([
  "www", "api", "app", "chat", "admin", "mail", "staging",
]);

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = hostname.slice(0, hostname.length - ROOT_DOMAIN.length - 1);

    if (subdomain && !RESERVED.has(subdomain)) {
      const url = req.nextUrl.clone();
      // Preserve sub-paths: mindful-brilliance.crossroads.place/writing → /groups/mindful-brilliance/writing
      const existingPath = url.pathname === "/" ? "" : url.pathname;
      url.pathname = `/groups/${subdomain}${existingPath}`;
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

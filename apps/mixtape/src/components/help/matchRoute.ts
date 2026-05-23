export function matchRoute(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    const regexStr = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, "[^/]+");
    return new RegExp(`^${regexStr}$`).test(pathname);
  });
}

export function inferSubsystemFromPathname(pathname: string): string | null {
  if (pathname.startsWith("/groups/") && pathname.includes("/workbench")) return "workbench";
  if (pathname.startsWith("/groups/") && pathname.includes("/projects")) return "projects";
  if (pathname.startsWith("/groups/") && pathname.includes("/almanac")) return "almanac";
  if (pathname.startsWith("/groups/") && pathname.includes("/puddlejump")) return "puddlejump";
  if (pathname.startsWith("/groups/") && pathname.includes("/library")) return "stackroom";
  if (pathname.startsWith("/groups/") && pathname.includes("/writing")) return "writing";
  if (pathname.startsWith("/groups/")) return "groups";

  if (pathname.includes("/workbench")) return "workbench";
  if (pathname.includes("/writing")) return "writing";
  if (pathname.startsWith("/stackroom")) return "stackroom";
  if (pathname.startsWith("/puddlejump")) return "puddlejump";
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/aperture")) return "aperture";
  if (pathname.startsWith("/bazaar")) return "bazaar";
  if (pathname.startsWith("/clients")) return "clients";
  if (pathname.startsWith("/community-hub")) return "community-hub";
  if (pathname.startsWith("/console")) return "console";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/demos")) return "demos";
  if (pathname.startsWith("/dispatch")) return "dispatch";
  if (pathname.startsWith("/feedback")) return "feedback";
  if (pathname.startsWith("/help")) return "help";
  if (pathname.startsWith("/living-books")) return "living-books";
  if (pathname.startsWith("/member")) return "member";
  if (pathname.startsWith("/notifications")) return "notifications";
  if (pathname.startsWith("/seed")) return "writing";
  if (pathname.startsWith("/settings")) return "member";
  if (pathname.includes("/almanac")) return "almanac";
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/mobile")) return "mobile";
  return null;
}

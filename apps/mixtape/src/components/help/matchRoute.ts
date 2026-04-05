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
  if (pathname.startsWith("/workbench")) return "workbench";
  if (pathname.startsWith("/puddlejump")) return "puddlejump";
  if (pathname.startsWith("/stackroom")) return "puddlejump";
  if (pathname.includes("/almanac")) return "almanac";
  if (pathname.includes("/projects")) return "projects";
  if (pathname.includes("/writing")) return "writing";
  if (pathname.includes("/mobile")) return "mobile";
  return null;
}

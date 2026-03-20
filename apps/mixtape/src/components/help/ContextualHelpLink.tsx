"use client";

import NextLink from "next/link";
import { useMemo } from "react";
import { Box, Link, Text } from "@chakra-ui/react";
import { usePathname } from "next/navigation";

type HelpRouteMatch = {
  slug: string;
  label: string;
};

function matchHelpRoute(pathname: string): HelpRouteMatch | null {
  if (pathname.startsWith("/help")) return null;
  if (pathname.startsWith("/groups/") && pathname.includes("/workbench")) {
    return { slug: "workbench", label: "Workbench help" };
  }
  if (pathname.startsWith("/groups/") && pathname.includes("/projects")) {
    return { slug: "projects", label: "Projects help" };
  }
  if (pathname.startsWith("/groups/") && pathname.includes("/almanac")) {
    return { slug: "almanac", label: "Almanac help" };
  }
  if (pathname.startsWith("/groups/") && pathname.includes("/puddlejump")) {
    return { slug: "puddlejump", label: "Puddlejump help" };
  }
  if (pathname.startsWith("/workbench")) return { slug: "workbench", label: "Workbench help" };
  if (pathname.startsWith("/puddlejump")) return { slug: "puddlejump", label: "Puddlejump help" };
  if (pathname.startsWith("/stackroom")) return { slug: "puddlejump", label: "Puddlejump help" };
  if (pathname.includes("/almanac")) return { slug: "almanac", label: "Almanac help" };
  if (pathname.includes("/projects")) return { slug: "projects", label: "Projects help" };
  return null;
}

export function ContextualHelpLink() {
  const pathname = usePathname();

  const match = useMemo(() => matchHelpRoute(pathname), [pathname]);

  if (!match) {
    return null;
  }

  return (
    <Box px={4} py={2} borderBottomWidth="1px" borderColor="border" bg="bg.subtle">
      <Text fontSize="sm" color="fg.muted">
        Need guidance here?{" "}
        <Link asChild color="fg" textDecoration="underline" textUnderlineOffset="3px">
          <NextLink href={`/help/${match.slug}`}>{match.label}</NextLink>
        </Link>
      </Text>
    </Box>
  );
}

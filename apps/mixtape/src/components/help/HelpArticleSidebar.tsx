"use client";

import { useEffect, useState } from "react";
import { Box, Link, Stack, Text } from "@chakra-ui/react";
import type { ContentHeading } from "@mixtape/content";

interface HelpArticleSidebarProps {
  headings: ContentHeading[];
  metadataLabel?: string;
  metadataValue?: string;
}

export function HelpArticleSidebar({
  headings,
  metadataLabel,
  metadataValue,
}: HelpArticleSidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) setActiveId(hash);
    };

    handleHash();
    window.addEventListener("hashchange", handleHash);

    const targets = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (targets.length === 0) {
      return () => window.removeEventListener("hashchange", handleHash);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top ?? 0) - (b.boundingClientRect.top ?? 0));
        const next = visible[0]?.target?.id;
        if (next) setActiveId(next);
      },
      {
        rootMargin: "0px 0px -65% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      window.removeEventListener("hashchange", handleHash);
      observer.disconnect();
    };
  }, [headings]);

  return (
    <Box
      as="nav"
      position={{ base: "static", lg: "sticky" }}
      top={{ base: "auto", lg: "calc(var(--app-topbar) + 24px)" }}
      alignSelf={{ base: "stretch", lg: "flex-start" }}
      w={{ base: "full", lg: "240px" }}
      maxW={{ base: "full", lg: "240px" }}
    >
      <Stack gap={6}>
        {metadataLabel && metadataValue ? (
          <Stack gap={2}>
            <Text fontSize="xs" letterSpacing="0.24em" color="fg.muted" fontWeight="600">
              {metadataLabel}
            </Text>
            <Text fontSize="sm" color="fg.subtle">
              {metadataValue}
            </Text>
          </Stack>
        ) : null}

        {headings.length > 0 ? (
          <Stack gap={3}>
            <Text fontSize="xs" letterSpacing="0.24em" color="fg.muted" fontWeight="600">
              ON THIS PAGE
            </Text>
            <Stack gap={2}>
              {headings.map((heading) => (
                <Link
                  key={heading.id}
                  href={`#${heading.id}`}
                  fontSize="sm"
                  color={activeId === heading.id ? "fg" : "fg.subtle"}
                  fontWeight={activeId === heading.id ? "600" : "400"}
                  onClick={(event) => {
                    event.preventDefault();
                    const target = document.getElementById(heading.id);
                    if (target) {
                      target.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                    window.history.replaceState(null, "", `#${heading.id}`);
                    setActiveId(heading.id);
                  }}
                >
                  {heading.text}
                </Link>
              ))}
            </Stack>
          </Stack>
        ) : (
          <Text fontSize="sm" color="fg.subtle">
            No sections available.
          </Text>
        )}
      </Stack>
    </Box>
  );
}


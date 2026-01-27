"use client";

import { useEffect, useState } from "react";
import { Box, Link, Stack, Text } from "@chakra-ui/react";
import type { ContentHeading } from "@mixtape/content";

type ArticleSidebarProps = {
  headings: ContentHeading[];
  author?: string;
  tags?: string[];
};

export function ArticleSidebar({ headings, author, tags }: ArticleSidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) {
      return;
    }

    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setActiveId(hash);
      }
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
        if (next) {
          setActiveId(next);
        }
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

  const hasMeta = Boolean(author || (tags && tags.length > 0));

  return (
    <Box
      as="nav"
      position={{ base: "static", lg: "fixed" }}
      top={{ base: "auto", lg: "var(--site-header-height)" }}
      left={{ base: "auto", lg: "max(32px, calc((100vw - 72rem) / 2 + 32px))" }}
      alignSelf={{ base: "stretch", lg: "flex-start" }}
      w={{ base: "full", lg: "221px" }}
      maxW={{ base: "full", lg: "221px" }}
      pr={{ base: 0, lg: 2 }}
    >
      <Box
        maxH={{ base: "none", lg: "calc(100vh - var(--site-header-height) - 32px)" }}
        overflowY={{ base: "visible", lg: "auto" }}
        pt={{ base: 0, lg: 4 }}
      >
        <Stack gap={6}>
          {hasMeta && (
            <Stack gap={2}>
              <Text fontSize="xs" letterSpacing="0.3em" color="fg.muted" fontWeight="600">
                ABOUT THIS PAGE
              </Text>
              {author && (
                <Text fontSize="sm" color="fg.subtle">
                  By {author}
                </Text>
              )}
              {tags && tags.length > 0 && (
                <Text
                  fontSize="xs"
                  color="fg.muted"
                  letterSpacing="0.12em"
                  lineHeight="1.6"
                  textTransform="lowercase"
                  wordBreak="break-word"
                  fontStyle="italic"
                >
                  {tags.map((tag, index) => (
                    <span key={`${tag}-${index}`}>
                      {tag.toLowerCase()}
                      {index < tags.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </Text>
              )}
            </Stack>
          )}
          {headings.length > 0 && (
            <Stack gap={3}>
              <Text fontSize="xs" letterSpacing="0.3em" color="fg.muted" fontWeight="600">
                ON THIS PAGE
              </Text>
              <Stack gap={2} lineHeight="1.4">
                {headings.map((heading) => (
                  <Link
                    key={heading.id}
                    href={`#${heading.id}`}
                    fontSize="sm"
                    color={activeId === heading.id ? "fg" : "fg.subtle"}
                    fontWeight={activeId === heading.id ? "600" : "400"}
                    display="block"
                    maxW="100%"
                    whiteSpace="normal"
                    pr={2}
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
          )}
          {headings.length === 0 && !hasMeta && (
            <Text fontSize="sm" color="fg.subtle">
              No sections available.
            </Text>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
